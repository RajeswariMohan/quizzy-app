import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { STUDENT_ID, TEACHER_ID, TEST_QUIZ_ID } from './helpers/constants';
import { createTestApp } from './helpers/create-test-app';

describe('Security & validation (e2e)', () => {
  let app: INestApplication;
  let teacherToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    const authService = testApp.module.get(AuthService);
    teacherToken = (await authService.issueTokensForUser(TEACHER_ID)).accessToken;
    studentToken = (await authService.issueTokensForUser(STUDENT_ID)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const teacherAuth = () => ({ Authorization: `Bearer ${teacherToken}` });
  const studentAuth = () => ({ Authorization: `Bearer ${studentToken}` });

  describe('RBAC', () => {
    it('denies students from listing quiz questions', async () => {
      await request(app.getHttpServer())
        .get(`/api/quizzes/${TEST_QUIZ_ID}/questions`)
        .set(studentAuth())
        .expect(403);
    });

    it('denies students from triggering AI generation', async () => {
      await request(app.getHttpServer())
        .post(`/api/quizzes/${TEST_QUIZ_ID}/questions/ai-generate`)
        .set(studentAuth())
        .send({ prompt: 'Should not run', count: 1 })
        .expect(403);
    });

    it('denies unauthenticated access to quizzes', async () => {
      await request(app.getHttpServer()).get(`/api/quizzes/${TEST_QUIZ_ID}`).expect(401);
    });
  });

  describe('DTO validation', () => {
    it('rejects manual question with fewer than 4 options', async () => {
      await request(app.getHttpServer())
        .post(`/api/quizzes/${TEST_QUIZ_ID}/questions/manual`)
        .set(teacherAuth())
        .send({
          questionText: 'Invalid options',
          options: ['Only', 'Two'],
          correctOptionIndex: 0,
        })
        .expect(400);
    });

    it('rejects AI generation with count above maximum', async () => {
      await request(app.getHttpServer())
        .post(`/api/quizzes/${TEST_QUIZ_ID}/questions/ai-generate`)
        .set(teacherAuth())
        .send({
          prompt: 'Too many questions',
          count: 100,
        })
        .expect(400);
    });

    it('rejects quiz creation with unknown fields (whitelist)', async () => {
      await request(app.getHttpServer())
        .post('/api/quizzes')
        .set(teacherAuth())
        .send({
          classId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          title: 'Bad Payload',
          evilField: true,
        })
        .expect(400);
    });
  });

  describe('Tenant isolation', () => {
    it('returns 404 for non-existent quiz UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/quizzes/00000000-0000-0000-0000-000000000000')
        .set(teacherAuth())
        .expect(404);
    });

    it('returns 404 for unknown AI generation task', async () => {
      await request(app.getHttpServer())
        .get('/api/ai-generation-tasks/00000000-0000-0000-0000-000000000000')
        .set(teacherAuth())
        .expect(404);
    });
  });
});
