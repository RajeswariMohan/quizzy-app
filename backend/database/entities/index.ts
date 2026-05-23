import { AiGenerationTask } from './ai-generation-task.entity';
import { Class } from './class.entity';
import { Question } from './question.entity';
import { Quiz } from './quiz.entity';
import { School } from './school.entity';
import { StudentResponse } from './student-response.entity';
import { User } from './user.entity';

export { AiGenerationTask } from './ai-generation-task.entity';
export { School } from './school.entity';
export { User } from './user.entity';
export { Class } from './class.entity';
export { Quiz } from './quiz.entity';
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
] as const;
