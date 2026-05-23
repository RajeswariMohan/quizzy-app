import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { SCHOOL_ID, TEACHER_ID, TEST_CLASS_ID, TEST_QUIZ_ID } from './helpers/constants';
import { createTestApp } from './helpers/create-test-app';

describe('Quiz creation (e2e)', () => {
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

  it('POST /api/quizzes creates a tenant-scoped draft quiz', async () => {
    const title = `E2E Quiz ${Date.now()}`;

    const res = await request(app.getHttpServer())
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId: TEST_CLASS_ID,
        title,
        subject: 'Mathematics',
        topic: 'Fractions',
      })
      .expect(201);

    expect(res.body.schoolId).toBe(SCHOOL_ID);
    expect(res.body.classId).toBe(TEST_CLASS_ID);
    expect(res.body.status).toBe('DRAFT');
    expect(res.body.title).toBe(title);

    const fetched = await request(app.getHttpServer())
      .get(`/api/quizzes/${res.body.id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    expect(fetched.body.title).toBe(title);
    expect(fetched.body.questionCount).toBe(0);
  });
});
