import type { CreateSchoolUserPayload, SchoolAcademicConfig } from '@/api/schoolAdmin.api';
import axios from 'axios';
import { normalizeCsvHeader, parseCsvLine } from '@/utils/questionCsvImport';

export interface UserCsvParseError {
  row: number;
  message: string;
}

export interface UserCsvParseResult {
  users: CreateSchoolUserPayload[];
  errors: UserCsvParseError[];
}

const REQUIRED_HEADERS = [
  'first_name',
  'last_name',
  'email',
  'password',
  'role',
] as const;

const VALID_ROLES = ['STUDENT', 'TEACHER', 'PARENT'] as const;

function buildTemplateCsv(academics?: SchoolAcademicConfig | null): string {
  const gradeHint = academics?.grades.length
    ? academics.grades.slice(0, 5).join(', ') + (academics.grades.length > 5 ? ', …' : '')
    : 'Class 1, Class 2, …';
  const sectionHint = academics?.sections.length
    ? academics.sections.join(', ')
    : 'A, B, C, D';

  return `# Quizzy user import template (open in Excel or Google Sheets, then Save As CSV UTF-8)
# Columns: first_name | last_name | email | password (min 8 chars) | role (STUDENT/TEACHER/PARENT) | grade | section
# For STUDENT rows, grade and section are required. Leave grade/section empty for TEACHER and PARENT.
# Valid grades at your school: ${gradeHint}
# Valid sections at your school: ${sectionHint}
first_name,last_name,email,password,role,grade,section
Priya,Sharma,priya.sharma@school.edu,Welcome123!,STUDENT,Class 5,A
Raj,Kumar,raj.kumar@school.edu,Welcome123!,TEACHER,,
Anita,Patel,anita.patel@school.edu,Welcome123!,PARENT,,
`;
}

export function downloadUserImportTemplate(academics?: SchoolAcademicConfig | null): void {
  const blob = new Blob([buildTemplateCsv(academics)], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'quizzy-users-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function parseUsersCsv(
  text: string,
  academics?: SchoolAcademicConfig | null,
): UserCsvParseResult {
  const users: CreateSchoolUserPayload[] = [];
  const errors: UserCsvParseError[] = [];
  const emailsInFile = new Set<string>();

  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) {
    errors.push({ row: 0, message: 'File is empty.' });
    return { users, errors };
  }

  const headerCells = parseCsvLine(lines[0]).map(normalizeCsvHeader);
  const headerIndex = new Map<string, number>();
  headerCells.forEach((h, i) => headerIndex.set(h, i));

  for (const required of REQUIRED_HEADERS) {
    if (!headerIndex.has(required)) {
      errors.push({
        row: 1,
        message: `Missing column "${required}". Download the template for the correct format.`,
      });
      return { users, errors };
    }
  }

  const gradeIdx = headerIndex.get('grade');
  const sectionIdx = headerIndex.get('section');

  for (let i = 1; i < lines.length; i += 1) {
    const rowNum = i + 1;
    const cells = parseCsvLine(lines[i]);
    if (cells.every((c) => !c.trim())) continue;

    const get = (key: string) => cells[headerIndex.get(key)!] ?? '';

    const firstName = get('first_name').trim();
    const lastName = get('last_name').trim();
    const email = get('email').trim().toLowerCase();
    const password = get('password');
    const roleRaw = get('role').trim().toUpperCase();
    const grade = gradeIdx !== undefined ? (cells[gradeIdx]?.trim() ?? '') : '';
    const section = sectionIdx !== undefined ? (cells[sectionIdx]?.trim() ?? '') : '';

    if (!firstName) {
      errors.push({ row: rowNum, message: 'first_name is required.' });
      continue;
    }
    if (!lastName) {
      errors.push({ row: rowNum, message: 'last_name is required.' });
      continue;
    }
    if (!email || !email.includes('@')) {
      errors.push({ row: rowNum, message: 'A valid email is required.' });
      continue;
    }
    if (emailsInFile.has(email)) {
      errors.push({ row: rowNum, message: `Duplicate email in file: ${email}` });
      continue;
    }
    emailsInFile.add(email);

    if (password.length < 8) {
      errors.push({ row: rowNum, message: 'password must be at least 8 characters.' });
      continue;
    }

    if (!VALID_ROLES.includes(roleRaw as (typeof VALID_ROLES)[number])) {
      errors.push({
        row: rowNum,
        message: `role must be STUDENT, TEACHER, or PARENT (got "${roleRaw}").`,
      });
      continue;
    }

    const role = roleRaw as CreateSchoolUserPayload['role'];

    if (role === 'STUDENT') {
      if (!grade) {
        errors.push({ row: rowNum, message: 'grade is required for STUDENT rows.' });
        continue;
      }
      if (!section) {
        errors.push({ row: rowNum, message: 'section is required for STUDENT rows.' });
        continue;
      }
      if (academics && !academics.grades.includes(grade)) {
        errors.push({ row: rowNum, message: `Invalid grade "${grade}" for your school.` });
        continue;
      }
      if (academics && !academics.sections.includes(section)) {
        errors.push({ row: rowNum, message: `Invalid section "${section}" for your school.` });
        continue;
      }
    } else if (grade || section) {
      errors.push({
        row: rowNum,
        message: 'grade and section must be empty for TEACHER and PARENT rows.',
      });
      continue;
    }

    users.push({
      firstName,
      lastName,
      email,
      password,
      role,
      ...(role === 'STUDENT' ? { grade, section } : {}),
    });
  }

  if (users.length === 0 && errors.length === 0) {
    errors.push({ row: 0, message: 'No user rows found in file.' });
  }

  if (users.length > 200) {
    return {
      users: [],
      errors: [{ row: 0, message: 'Maximum 200 users per upload.' }],
    };
  }

  return { users, errors };
}

export function extractBulkImportErrors(error: unknown): UserCsvParseError[] {
  if (!axios.isAxiosError(error)) return [];
  const data = error.response?.data as {
    message?: unknown;
    errors?: UserCsvParseError[];
  };
  if (Array.isArray(data?.errors)) return data.errors;
  if (typeof data?.message === 'object' && data.message !== null) {
    const nested = data.message as { errors?: UserCsvParseError[] };
    if (Array.isArray(nested.errors)) return nested.errors;
  }
  return [];
}
