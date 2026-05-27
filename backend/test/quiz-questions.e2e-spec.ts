import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { SCHOOL_ID, TEACHER_ID, TEST_CLASS_ID, TEST_QUIZ_ID } from './helpers/constants';
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

  it('POST /api/quizzes/:quizId/questions/bulk imports CSV-parsed rows', async () => {
    const draftRes = await request(app.getHttpServer())
      .post('/api/quizzes')
      .set(auth())
      .send({
        classId: TEST_CLASS_ID,
        title: `Bulk import ${Date.now()}`,
        subject: 'Math',
      })
      .expect(201);

    const quizId = draftRes.body.id as string;

    const bulkRes = await request(app.getHttpServer())
      .post(`/api/quizzes/${quizId}/questions/bulk`)
      .set(auth())
      .send({
        questions: [
          {
            questionText: 'What is 5+5?',
            options: ['8', '9', '10', '11'],
            correctOptionIndex: 2,
            explanation: 'Ten',
            points: 10,
          },
          {
            questionText: 'What is 1+1?',
            options: ['1', '2', '3', '4'],
            correctOptionIndex: 1,
          },
        ],
      })
      .expect(201);

    expect(bulkRes.body.importedCount).toBe(2);

    const listRes = await request(app.getHttpServer())
      .get(`/api/quizzes/${quizId}/questions`)
      .set(auth())
      .expect(200);

    expect(listRes.body.length).toBeGreaterThanOrEqual(2);
    expect(listRes.body.some((q: { questionText: string }) => q.questionText === 'What is 5+5?')).toBe(
      true,
    );
  });

  it('PATCH /api/quizzes/:quizId/questions/:questionId updates MCQ on draft quiz', async () => {
    const draftRes = await request(app.getHttpServer())
      .post('/api/quizzes')
      .set(auth())
      .send({
        classId: TEST_CLASS_ID,
        title: `Edit questions ${Date.now()}`,
        subject: 'Math',
        topic: 'Addition',
      })
      .expect(201);

    const quizId = draftRes.body.id as string;

    const createRes = await request(app.getHttpServer())
      .post(`/api/quizzes/${quizId}/questions/manual`)
      .set(auth())
      .send({
        questionText: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctOptionIndex: 1,
      })
      .expect(201);

    const questionId = createRes.body.id as string;

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/quizzes/${quizId}/questions/${questionId}`)
      .set(auth())
      .send({
        questionText: 'What is 3+3?',
        options: ['5', '6', '7', '8'],
        correctOptionIndex: 1,
        explanation: 'Six is correct.',
      })
      .expect(200);

    expect(patchRes.body.questionText).toBe('What is 3+3?');
    expect(patchRes.body.options[1]).toBe('6');
    expect(patchRes.body.explanation).toBe('Six is correct.');
  });

  it('DELETE /api/quizzes/:quizId/questions/:questionId removes MCQ on draft quiz', async () => {
    const draftRes = await request(app.getHttpServer())
      .post('/api/quizzes')
      .set(auth())
      .send({
        classId: TEST_CLASS_ID,
        title: `Delete questions ${Date.now()}`,
        subject: 'Science',
        topic: 'Plants',
      })
      .expect(201);

    const quizId = draftRes.body.id as string;

    const keepRes = await request(app.getHttpServer())
      .post(`/api/quizzes/${quizId}/questions/manual`)
      .set(auth())
      .send({
        questionText: 'Keep this question',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 0,
      })
      .expect(201);

    const removeRes = await request(app.getHttpServer())
      .post(`/api/quizzes/${quizId}/questions/manual`)
      .set(auth())
      .send({
        questionText: 'Remove this question',
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 1,
      })
      .expect(201);

    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/quizzes/${quizId}/questions/${removeRes.body.id}`)
      .set(auth())
      .expect(200);

    expect(deleteRes.body.deleted).toBe(true);
    expect(deleteRes.body.remainingCount).toBe(1);

    const listRes = await request(app.getHttpServer())
      .get(`/api/quizzes/${quizId}/questions`)
      .set(auth())
      .expect(200);

    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].id).toBe(keepRes.body.id);
    expect(listRes.body[0].orderIndex).toBe(0);
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
