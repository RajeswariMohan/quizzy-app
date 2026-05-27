import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '@database/entities/school.entity';
import {
  DEFAULT_GRADE_OPTIONS,
  DEFAULT_SECTION_OPTIONS,
  DEFAULT_SUBJECT_OPTIONS,
} from '../common/constants/academics';

export interface SchoolAcademicOptionsDto {
  grades: string[];
  sections: string[];
  subjects: string[];
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

@Injectable()
export class SchoolAcademicsService {
  constructor(
    @InjectRepository(School)
    private readonly schoolsRepository: Repository<School>,
  ) {}

  resolveGradeOptions(school: School): string[] {
    const configured = normalizeOptionList(school.gradeOptions ?? []);
    return configured.length > 0 ? configured : [...DEFAULT_GRADE_OPTIONS];
  }

  resolveSectionOptions(school: School): string[] {
    const configured = normalizeOptionList(school.sectionOptions ?? []);
    return configured.length > 0 ? configured : [...DEFAULT_SECTION_OPTIONS];
  }

  resolveSubjectOptions(school: School): string[] {
    const configured = normalizeOptionList(school.subjectOptions ?? []);
    return configured.length > 0 ? configured : [...DEFAULT_SUBJECT_OPTIONS];
  }

  toDto(school: School): SchoolAcademicOptionsDto {
    return {
      grades: this.resolveGradeOptions(school),
      sections: this.resolveSectionOptions(school),
      subjects: this.resolveSubjectOptions(school),
    };
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

  assertSectionAllowed(school: School, section: string): void {
    const options = this.resolveSectionOptions(school);
    if (!options.includes(section.trim())) {
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
