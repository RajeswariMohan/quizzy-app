import { execSync } from 'child_process';
import path from 'path';

const RESET_SCRIPT = path.resolve(
  __dirname,
  '../../../backend/scripts/reset-student-quiz-responses.sh',
);

export function resetStudentQuizResponses(): void {
  execSync(`bash "${RESET_SCRIPT}"`, { stdio: 'inherit' });
}
