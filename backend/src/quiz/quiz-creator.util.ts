import { User } from '@database/entities/user.entity';
import { UserRole } from '@database/enums/user-role.enum';

export interface QuizCreatorDto {
  userId: string;
  displayName: string;
  email: string;
  role: UserRole;
}

export function resolveUserDisplayName(user: User): string {
  const name = user.displayName?.trim() || `${user.firstName} ${user.lastName}`.trim();
  return name || user.email;
}

export function mapQuizCreator(user: User | null | undefined): QuizCreatorDto | null {
  if (!user) return null;
  return {
    userId: user.id,
    displayName: resolveUserDisplayName(user),
    email: user.email,
    role: user.role,
  };
}
