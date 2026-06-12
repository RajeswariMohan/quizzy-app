import { BadRequestException } from '@nestjs/common';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

export const USERNAME_PATTERN = /^[a-z0-9._-]+$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function assertValidUsername(raw: string): string {
  const username = normalizeUsername(raw);
  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    throw new BadRequestException(
      `Username must be ${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} characters`,
    );
  }
  if (!USERNAME_PATTERN.test(username)) {
    throw new BadRequestException(
      'Username may only contain letters, numbers, dots, hyphens, and underscores',
    );
  }
  if (!/^[a-z0-9]/.test(username) || !/[a-z0-9]$/.test(username)) {
    throw new BadRequestException('Username must start and end with a letter or number');
  }
  return username;
}

/** Internal login email for self-service students (not shown to users). */
export function buildStudentLoginEmail(username: string, schoolSlug: string): string {
  const slug = schoolSlug.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'school';
  return `${normalizeUsername(username)}@${slug}.student.quizzy`;
}
