import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { STUDENT_ID, TEACHER_ID } from './helpers/constants';
import { createTestApp } from './helpers/create-test-app';

describe('Student flow (e2e)', () => {
  let app: INestApplication;
  let studentToken: string;
  let teacherToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    const authService = testApp.module.get(AuthService);
    studentToken = (await authService.issueTokensForUser(STUDENT_ID)).accessToken;
    teacherToken = (await authService.issueTokensForUser(TEACHER_ID)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/student/quizzes lists published quizzes without query params', () => {
    return request(app.getHttpServer())
      .get('/api/student/quizzes')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length).toBeGreaterThan(0);
        expect(res.body.filter).toBeNull();
      });
  });

  it('GET /api/student/quizzes rejects grade filter for another class', () => {
    return request(app.getHttpServer())
      .get('/api/student/quizzes')
      .query({ grade: 'Class 1' })
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });

  it('GET /api/student/audience-options returns published grade groups', () => {
    return request(app.getHttpServer())
      .get('/api/student/audience-options')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('grades');
        expect(res.body).toHaveProperty('sectionsByGrade');
        expect(res.body).toHaveProperty('viewer');
      });
  });

  it('GET /api/student/progress returns student stats', () => {
    return request(app.getHttpServer())
      .get('/api/student/progress')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('xpPoints');
        expect(res.body).toHaveProperty('accuracy');
      });
  });

  it('POST /api/student/quizzes/:id/responses saves an answer', async () => {
    const quizzes = await request(app.getHttpServer())
      .get('/api/student/quizzes')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    const quizId = quizzes.body.items[0].id;

    const quiz = await request(app.getHttpServer())
      .get(`/api/student/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    const unanswered = quiz.body.questions.find(
      (q: { selectedOptionIndex: number | null }) => q.selectedOptionIndex == null,
    );
    const questionId = unanswered?.id ?? quiz.body.questions[0].id;

    if (unanswered) {
      await request(app.getHttpServer())
        .post(`/api/student/quizzes/${quizId}/responses`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ questionId, selectedOptionIndex: 1 })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });
    }

    await request(app.getHttpServer())
      .post(`/api/student/quizzes/${quizId}/responses`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ questionId, selectedOptionIndex: 0 })
      .expect(409);
  });

  it('GET /api/quizzes/dashboard/overview allows teacher', () => {
    return request(app.getHttpServer())
      .get('/api/quizzes/dashboard/overview')
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.stats).toBeDefined();
        expect(res.body.recentQuizzes).toBeDefined();
      });
  });
});
