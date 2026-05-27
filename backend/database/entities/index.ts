import { AiGenerationTask } from './ai-generation-task.entity';
import { Class } from './class.entity';
import { ParentStudentLink } from './parent-student-link.entity';
import { PlatformSettings } from './platform-settings.entity';
import { Question } from './question.entity';
import { Quiz } from './quiz.entity';
import { School } from './school.entity';
import { StudentResponse } from './student-response.entity';
import { UserFeedback } from './user-feedback.entity';
import { UserSession } from './user-session.entity';
import { User } from './user.entity';

export { AiGenerationTask } from './ai-generation-task.entity';
export { School } from './school.entity';
export { UserFeedback } from './user-feedback.entity';
export { UserSession } from './user-session.entity';
export { User } from './user.entity';
export { Class } from './class.entity';
export { Quiz } from './quiz.entity';
export { ParentStudentLink } from './parent-student-link.entity';
export { PlatformSettings } from './platform-settings.entity';
export { Question } from './question.entity';
export { StudentResponse } from './student-response.entity';

/** Register with TypeORM / NestJS TypeOrmModule.forFeature([...]) */
export const QUIZZY_ENTITIES = [
  School,
  User,
  Class,
  Quiz,
  Question,
  StudentResponse,
  AiGenerationTask,
  ParentStudentLink,
  PlatformSettings,
  UserSession,
  UserFeedback,
] as const;
