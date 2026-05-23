import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { SCHOOL_ID, TEACHER_ID, TEST_QUIZ_ID } from './helpers/constants';
import { createTestApp } from './helpers/create-test-app';

describe('Quiz & Question modules (e2e)', () => {
  let app: INestApplication;
  let teacherToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    const authService = testApp.module.get(AuthService);
    teacherToken = (await authService.issueTokensForUser(TEACHER_ID)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${teacherToken}` });

  it('GET /api/quizzes/:id returns seeded quiz', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/quizzes/${TEST_QUIZ_ID}`)
      .set(auth())
      .expect(200);

    expect(res.body.schoolId).toBe(SCHOOL_ID);
    expect(res.body.title).toContain('Photosynthesis');
  });

  it('POST manual question creates MANUAL source question', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/quizzes/${TEST_QUIZ_ID}/questions/manual`)
      .set(auth())
      .send({
        questionText: 'Which gas do plants absorb?',
        options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
        correctOptionIndex: 2,
        explanation: 'Plants use CO2 during photosynthesis.',
      })
      .expect(201);

    expect(res.body.sourceType).toBe('MANUAL');
  });

  it('POST ai-generate returns 202 and completes via BullMQ worker', async () => {
    const accepted = await request(app.getHttpServer())
      .post(`/api/quizzes/${TEST_QUIZ_ID}/questions/ai-generate`)
      .set(auth())
      .send({
        prompt: 'Generate MCQs about photosynthesis',
        count: 3,
        subject: 'Science',
        topic: 'Photosynthesis',
        grade: '5',
        board: 'CBSE',
      })
      .expect(202);

    expect(accepted.body.taskId).toBeDefined();
    expect(accepted.body.status).toBe('PENDING');

    const taskId = accepted.body.taskId as string;
    let status = 'PENDING';
    let attempts = 0;

    while (status !== 'COMPLETED' && status !== 'FAILED' && attempts < 30) {
      await new Promise((r) => setTimeout(r, 200));
      const poll = await request(app.getHttpServer())
        .get(`/api/ai-generation-tasks/${taskId}`)
        .set(auth())
        .expect(200);
      status = poll.body.status;
      attempts += 1;

      if (status === 'COMPLETED') {
        expect(poll.body.completedCount).toBe(3);
        expect(poll.body.metrics.questionsPersisted).toBe(3);
        expect(poll.body.aiModelUsed).toBe('quizzy-mock-structured-v1');
      }
    }

    expect(status).toBe('COMPLETED');

    const questions = await request(app.getHttpServer())
      .get(`/api/quizzes/${TEST_QUIZ_ID}/questions`)
      .set(auth())
      .expect(200);

    const fromThisTask = questions.body.filter(
      (q: { sourceType: string; aiGenerationTaskId: string }) =>
        q.sourceType === 'AI_GENERATED' && q.aiGenerationTaskId === taskId,
    );
    expect(fromThisTask.length).toBe(3);
  });
});
