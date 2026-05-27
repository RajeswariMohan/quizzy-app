import { IsIn, IsString } from 'class-validator';

const DEV_ROLES = [
  'teacher',
  'student',
  'parent',
  'schooladmin',
  'superadmin',
  'admin',
] as const;

export class DevIssueTokenDto {
  @IsIn(DEV_ROLES)
  @IsString()
  role!: (typeof DEV_ROLES)[number];
}
