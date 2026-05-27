import { IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  /** Required when the account already has a real password; omit for first-time setup. */
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
