import { normalizeCsvHeader, parseCsvLine } from '@/utils/questionCsvImport';

export interface AcademicsCsvParseError {
  row: number;
  message: string;
}

export interface AcademicsCsvParseResult {
  gradeSections: Record<string, string[]>;
  errors: AcademicsCsvParseError[];
}

/** Excel-friendly column headers (row 1). */
export const ACADEMICS_STRUCTURE_HEADERS = ['Grade', 'Group'] as const;

const HEADER_ALIASES: Record<string, 'grade' | 'group'> = {
  grade: 'grade',
  grades: 'grade',
  level: 'grade',
  grade_level: 'grade',
  group: 'group',
  section: 'group',
  sections: 'group',
  department: 'group',
  stream: 'group',
  enrollment: 'group',
  class_group: 'group',
};

function buildTemplateRows(existing?: Record<string, string[]>): string {
  if (existing && Object.keys(existing).length > 0) {
    const lines = [ACADEMICS_STRUCTURE_HEADERS.join(',')];
    for (const [grade, groups] of Object.entries(existing)) {
      for (const group of groups) {
        const escaped =
          group.includes(',') || group.includes('"')
            ? `"${group.replace(/"/g, '""')}"`
            : group;
        const gradeCell =
          grade.includes(',') || grade.includes('"')
            ? `"${grade.replace(/"/g, '""')}"`
            : grade;
        lines.push(`${gradeCell},${escaped}`);
      }
    }
    return lines.join('\r\n');
  }

  return [
    ACADEMICS_STRUCTURE_HEADERS.join(','),
    'Pre-KG,Morning',
    'Class 5,A',
    'Class 5,B',
    'Class 11,Science',
    'Class 11,Commerce',
    `Class 11,Science · A`,
    `Class 11,Science · B`,
    'Class 12,Science',
    'Class 12,Commerce',
  ].join('\r\n');
}

export function buildAcademicsStructureTemplateCsv(
  existing?: Record<string, string[]>,
): string {
  return `\uFEFF${buildTemplateRows(existing)}`;
}

export function downloadAcademicsStructureTemplate(
  existing?: Record<string, string[]>,
): void {
  const blob = new Blob([buildAcademicsStructureTemplateCsv(existing)], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'quizzy-grades-sections-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function parseAcademicsStructureCsv(text: string): AcademicsCsvParseResult {
  const errors: AcademicsCsvParseError[] = [];
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) {
    return { gradeSections: {}, errors: [{ row: 0, message: 'File is empty.' }] };
  }

  const headerCells = parseCsvLine(lines[0]).map((c) => normalizeCsvHeader(c));
  const gradeIdx = headerCells.findIndex((h) => HEADER_ALIASES[h] === 'grade');
  const groupIdx = headerCells.findIndex((h) => HEADER_ALIASES[h] === 'group');

  if (gradeIdx < 0 || groupIdx < 0) {
    return {
      gradeSections: {},
      errors: [
        {
          row: 1,
          message: `Header row must include Grade and Group (found: ${lines[0]}).`,
        },
      ],
    };
  }

  const gradeSections: Record<string, string[]> = {};
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i += 1) {
    const rowNum = i + 1;
    const cells = parseCsvLine(lines[i]);
    const grade = (cells[gradeIdx] ?? '').trim();
    const group = (cells[groupIdx] ?? '').trim();

    if (!grade) {
      errors.push({ row: rowNum, message: 'Grade is required.' });
      continue;
    }
    if (!group) {
      errors.push({ row: rowNum, message: 'Group is required.' });
      continue;
    }

    const dedupeKey = `${grade.toLowerCase()}::${group.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    if (!gradeSections[grade]) gradeSections[grade] = [];
    gradeSections[grade].push(group);
  }

  if (Object.keys(gradeSections).length === 0 && errors.length === 0) {
    errors.push({ row: 0, message: 'No grade rows found after the header.' });
  }

  return { gradeSections, errors };
}

export function summarizeGradeSections(map: Record<string, string[]>): {
  gradeCount: number;
  groupCount: number;
} {
  const grades = Object.keys(map);
  const groupCount = grades.reduce((sum, g) => sum + (map[g]?.length ?? 0), 0);
  return { gradeCount: grades.length, groupCount };
}
