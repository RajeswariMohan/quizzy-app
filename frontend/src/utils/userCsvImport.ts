import type { CreateSchoolUserPayload, SchoolAcademicConfig } from '@/api/schoolAdmin.api';
import axios from 'axios';
import { normalizeCsvHeader, parseCsvLine } from '@/utils/questionCsvImport';
import { resolveStoredEnrollmentSection } from '@/utils/gradeStructure';
import { USER_IMPORT_HEADERS } from '@/utils/schoolUserOnboarding';
import { validateUsername } from '@/utils/username';

export { USER_IMPORT_HEADERS };

export interface UserCsvParseError {
  row: number;
  message: string;
}

export interface UserCsvParseResult {
  users: CreateSchoolUserPayload[];
  errors: UserCsvParseError[];
}

const REQUIRED_HEADER_KEYS = ['first_name', 'last_name', 'password', 'role'] as const;

const ROLE_ALIASES: Record<string, CreateSchoolUserPayload['role']> = {
  student: 'STUDENT',
  teacher: 'TEACHER',
  parent: 'PARENT',
  student_role: 'STUDENT',
  teacher_role: 'TEACHER',
  parent_role: 'PARENT',
};

function normalizeRole(raw: string): CreateSchoolUserPayload['role'] | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
  return ROLE_ALIASES[key] ?? null;
}

function buildTemplateRows(academics?: SchoolAcademicConfig | null): string {
  const sampleGrade = academics?.grades[0] ?? 'Class 5';
  const sampleSection = academics?.gradeSections[sampleGrade]?.[0] ?? 'A';

  return [
    USER_IMPORT_HEADERS.join(','),
    `Priya,Sharma,Student,priya.sharma,,parent@example.com,Welcome123!,${sampleGrade},${sampleSection}`,
    'Raj,Kumar,Teacher,,raj.kumar@school.edu,,Welcome123!,',
    'Anita,Patel,Parent,,anita.patel@school.edu,,Welcome123!,',
  ].join('\r\n');
}

export function buildUserImportTemplateCsv(academics?: SchoolAcademicConfig | null): string {
  return `\uFEFF${buildTemplateRows(academics)}`;
}

export function downloadUserImportTemplate(academics?: SchoolAcademicConfig | null): void {
  const blob = new Blob([buildUserImportTemplateCsv(academics)], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'quizzy-users-import.csv';
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
  const usernamesInFile = new Set<string>();

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
  headerCells.forEach((h, i) => {
    if (h) headerIndex.set(h, i);
  });

  for (const required of REQUIRED_HEADER_KEYS) {
    if (!headerIndex.has(required)) {
      const label =
        required === 'first_name'
          ? 'First Name'
          : required === 'last_name'
            ? 'Last Name'
            : required.charAt(0).toUpperCase() + required.slice(1);
      errors.push({
        row: 1,
        message: `Missing column "${label}". Download the template — row 1 must contain all column headers.`,
      });
      return { users, errors };
    }
  }

  const usernameIdx = headerIndex.get('username');
  const emailIdx = headerIndex.get('email');
  const parentEmailIdx = headerIndex.get('parent_email');
  const gradeIdx = headerIndex.get('grade');
  const sectionIdx = headerIndex.get('section');

  for (let i = 1; i < lines.length; i += 1) {
    const rowNum = i + 1;
    const cells = parseCsvLine(lines[i]);
    if (cells.every((c) => !c.trim())) continue;

    const get = (key: string) => {
      const idx = headerIndex.get(key);
      return idx === undefined ? '' : (cells[idx] ?? '');
    };

    const firstName = get('first_name').trim();
    const lastName = get('last_name').trim();
    const usernameRaw = usernameIdx !== undefined ? (cells[usernameIdx]?.trim() ?? '') : '';
    const email = emailIdx !== undefined ? (cells[emailIdx]?.trim().toLowerCase() ?? '') : '';
    const parentEmail =
      parentEmailIdx !== undefined ? (cells[parentEmailIdx]?.trim().toLowerCase() ?? '') : '';
    const password = get('password');
    const roleRaw = get('role').trim();
    const grade = gradeIdx !== undefined ? (cells[gradeIdx]?.trim() ?? '') : '';
    const sectionRaw = sectionIdx !== undefined ? (cells[sectionIdx]?.trim() ?? '') : '';

    if (!firstName) {
      errors.push({ row: rowNum, message: 'First Name is required.' });
      continue;
    }
    if (!lastName) {
      errors.push({ row: rowNum, message: 'Last Name is required.' });
      continue;
    }
    if (password.length < 8) {
      errors.push({ row: rowNum, message: 'Password must be at least 8 characters.' });
      continue;
    }

    const role = normalizeRole(roleRaw);
    if (!role) {
      errors.push({
        row: rowNum,
        message: `Role must be Student, Teacher, or Parent (got "${roleRaw}").`,
      });
      continue;
    }

    if (role === 'STUDENT') {
      if (!usernameRaw) {
        errors.push({ row: rowNum, message: 'Username is required for Student rows.' });
        continue;
      }
      const usernameError = validateUsername(usernameRaw);
      if (usernameError) {
        errors.push({ row: rowNum, message: usernameError });
        continue;
      }
      const username = usernameRaw.trim().toLowerCase();
      if (usernamesInFile.has(username)) {
        errors.push({ row: rowNum, message: `Duplicate username in file: ${username}` });
        continue;
      }
      usernamesInFile.add(username);

      if (email) {
        if (!email.includes('@')) {
          errors.push({ row: rowNum, message: 'Email must be a valid address when provided.' });
          continue;
        }
        if (emailsInFile.has(email)) {
          errors.push({ row: rowNum, message: `Duplicate email in file: ${email}` });
          continue;
        }
        emailsInFile.add(email);
      }

      if (!parentEmail || !parentEmail.includes('@')) {
        errors.push({ row: rowNum, message: 'Parent Email is required for Student rows.' });
        continue;
      }

      if (!grade) {
        errors.push({ row: rowNum, message: 'Grade is required for Student rows.' });
        continue;
      }
      if (!sectionRaw) {
        errors.push({ row: rowNum, message: 'Section is required for Student rows.' });
        continue;
      }
      if (academics && !academics.grades.includes(grade)) {
        errors.push({ row: rowNum, message: `Invalid grade "${grade}" for your school.` });
        continue;
      }

      const section =
        academics != null
          ? resolveStoredEnrollmentSection(grade, sectionRaw, academics.gradeSections)
          : sectionRaw;
      if (!section) {
        errors.push({
          row: rowNum,
          message: `Section "${sectionRaw}" is not valid for grade "${grade}". Use a configured section or department (e.g. Science · A).`,
        });
        continue;
      }

      users.push({
        firstName,
        lastName,
        username,
        ...(email ? { email } : {}),
        parentEmail,
        password,
        role,
        grade,
        section,
      });
    } else {
      if (!email || !email.includes('@')) {
        errors.push({ row: rowNum, message: 'Email is required for Teacher and Parent rows.' });
        continue;
      }
      if (emailsInFile.has(email)) {
        errors.push({ row: rowNum, message: `Duplicate email in file: ${email}` });
        continue;
      }
      emailsInFile.add(email);

      if (usernameRaw) {
        errors.push({
          row: rowNum,
          message: 'Username must be empty for Teacher and Parent rows.',
        });
        continue;
      }
      if (parentEmail) {
        errors.push({
          row: rowNum,
          message: 'Parent Email must be empty for Teacher and Parent rows.',
        });
        continue;
      }
      if (grade || sectionRaw) {
        errors.push({
          row: rowNum,
          message: 'Grade and Section must be empty for Teacher and Parent rows.',
        });
        continue;
      }

      users.push({
        firstName,
        lastName,
        email,
        password,
        role,
      });
    }
  }

  if (users.length === 0 && errors.length === 0) {
    errors.push({ row: 0, message: 'No user rows found below the header row.' });
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
