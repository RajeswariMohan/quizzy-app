import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '@database/entities/school.entity';
import { SchoolSubscriptionTier } from '@database/enums/school-subscription-tier.enum';
import {
  DEFAULT_GRADE_OPTIONS,
  DEFAULT_SECTION_OPTIONS,
  DEFAULT_SUBJECT_OPTIONS,
} from '../common/constants/academics';

export interface SchoolAcademicOptionsDto {
  grades: string[];
  /** Sections per grade, e.g. { "Class 1": ["Tulip", "Lilly"] } */
  gradeSections: Record<string, string[]>;
  /** Flat union of all sections (backward compatibility) */
  sections: string[];
  subjects: string[];
  subscriptionTier: SchoolSubscriptionTier;
  /** Curriculum board configured for this school (e.g. CBSE). */
  board: string | null;
}

export function normalizeOptionList(values: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);
  }
  return normalized;
}

export function normalizeGradeSectionMap(
  raw: Record<string, string[]>,
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const [grade, sections] of Object.entries(raw)) {
    const gradeLabel = grade.trim();
    if (!gradeLabel) continue;
    const normalizedSections = normalizeOptionList(sections ?? []);
    if (normalizedSections.length === 0) continue;
    map[gradeLabel] = normalizedSections;
  }
  return map;
}

@Injectable()
export class SchoolAcademicsService {
  constructor(
    @InjectRepository(School)
    private readonly schoolsRepository: Repository<School>,
  ) {}

  resolveGradeOptions(school: School): string[] {
    const fromMap = Object.keys(this.resolveGradeSectionMap(school));
    if (fromMap.length > 0) return fromMap;
    const configured = normalizeOptionList(school.gradeOptions ?? []);
    return configured.length > 0 ? configured : [...DEFAULT_GRADE_OPTIONS];
  }

  resolveGradeSectionMap(school: School): Record<string, string[]> {
    const configured = normalizeGradeSectionMap(school.gradeSectionMap ?? {});
    if (Object.keys(configured).length > 0) {
      return configured;
    }

    const grades = normalizeOptionList(school.gradeOptions ?? []);
    const sections = this.resolveFlatSectionOptions(school);
    if (grades.length === 0) {
      return Object.fromEntries(
        DEFAULT_GRADE_OPTIONS.map((grade) => [grade, [...DEFAULT_SECTION_OPTIONS]]),
      );
    }
    return Object.fromEntries(grades.map((grade) => [grade, [...sections]]));
  }

  resolveSectionsForGrade(school: School, grade: string): string[] {
    const map = this.resolveGradeSectionMap(school);
    return map[grade.trim()] ?? [];
  }

  resolveSectionOptions(school: School): string[] {
    const map = this.resolveGradeSectionMap(school);
    const union = normalizeOptionList(Object.values(map).flat());
    return union.length > 0 ? union : this.resolveFlatSectionOptions(school);
  }

  private resolveFlatSectionOptions(school: School): string[] {
    const configured = normalizeOptionList(school.sectionOptions ?? []);
    return configured.length > 0 ? configured : [...DEFAULT_SECTION_OPTIONS];
  }

  resolveSubjectOptions(school: School): string[] {
    const configured = normalizeOptionList(school.subjectOptions ?? []);
    return configured.length > 0 ? configured : [...DEFAULT_SUBJECT_OPTIONS];
  }

  resolveSubscriptionTier(school: School): SchoolSubscriptionTier {
    const tier = school.subscriptionTier;
    if (
      tier === SchoolSubscriptionTier.BASIC ||
      tier === SchoolSubscriptionTier.STANDARD ||
      tier === SchoolSubscriptionTier.PREMIUM
    ) {
      return tier;
    }
    return SchoolSubscriptionTier.STANDARD;
  }

  toDto(school: School): SchoolAcademicOptionsDto {
    const gradeSections = this.resolveGradeSectionMap(school);
    return {
      grades: Object.keys(gradeSections),
      gradeSections,
      sections: this.resolveSectionOptions(school),
      subjects: this.resolveSubjectOptions(school),
      subscriptionTier: this.resolveSubscriptionTier(school),
      board: school.board ?? null,
    };
  }

  syncLegacyOptionsFromMap(school: School, map: Record<string, string[]>): void {
    school.gradeSectionMap = map;
    school.gradeOptions = Object.keys(map);
    school.sectionOptions = normalizeOptionList(Object.values(map).flat());
  }

  async getForSchoolId(schoolId: string): Promise<SchoolAcademicOptionsDto> {
    const school = await this.schoolsRepository.findOne({
      where: { id: schoolId, isActive: true },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }
    return this.toDto(school);
  }

  assertGradeAllowed(school: School, grade: string): void {
    const options = this.resolveGradeOptions(school);
    if (!options.includes(grade.trim())) {
      throw new BadRequestException(
        `Grade must be one of your school's configured options`,
      );
    }
  }

  assertSectionAllowed(school: School, section: string, grade?: string): void {
    const trimmedSection = section.trim();
    if (grade?.trim()) {
      const forGrade = this.resolveSectionsForGrade(school, grade);
      if (!forGrade.includes(trimmedSection)) {
        throw new BadRequestException(
          `Section must be one of the sections configured for ${grade.trim()}`,
        );
      }
      return;
    }
    const options = this.resolveSectionOptions(school);
    if (!options.includes(trimmedSection)) {
      throw new BadRequestException(
        `Section must be one of your school's configured options`,
      );
    }
  }

  assertSubjectAllowed(school: School, subject: string): void {
    const options = this.resolveSubjectOptions(school);
    if (!options.includes(subject.trim())) {
      throw new BadRequestException(
        `Subject must be one of your school's configured options`,
      );
    }
  }
}
