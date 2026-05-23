/**
 * End-to-end smoke suite — validates the full backend build in one run.
 * Requires: docker compose -f docker-compose.test.yml up (Postgres + Redis)
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { TEACHER_ID, TEST_QUIZ_ID } from './helpers/constants';
import { createTestApp } from './helpers/create-test-app';

describe('Build validation smoke (e2e)', () => {
  let app: INestApplication;
  let teacherToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    teacherToken = (
      await testApp.module.get(AuthService).issueTokensForUser(TEACHER_ID)
    ).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${teacherToken}` });

  it('boots Nest application with global /api prefix', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', service: 'quizzy-api' });
  });

  it('wires auth middleware and RBAC on protected routes', async () => {
    await request(app.getHttpServer()).get('/api/me').expect(401);
    await request(app.getHttpServer()).get('/api/me').set(auth()).expect(200);
  });

  it('exposes quiz module routes', async () => {
    await request(app.getHttpServer())
      .get(`/api/quizzes/${TEST_QUIZ_ID}`)
      .set(auth())
      .expect(200);
  });

  it('exposes question module routes', async () => {
    await request(app.getHttpServer())
      .get(`/api/quizzes/${TEST_QUIZ_ID}/questions`)
      .set(auth())
      .expect(200);
  });

  it('runs BullMQ AI pipeline to completion', async () => {
    const { body } = await request(app.getHttpServer())
      .post(`/api/quizzes/${TEST_QUIZ_ID}/questions/ai-generate`)
      .set(auth())
      .send({ prompt: 'Smoke test MCQs', count: 1 })
      .expect(202);

    let status = 'PENDING';
    for (let i = 0; i < 25 && status !== 'COMPLETED' && status !== 'FAILED'; i += 1) {
      await new Promise((r) => setTimeout(r, 150));
      const poll = await request(app.getHttpServer())
        .get(`/api/ai-generation-tasks/${body.taskId}`)
        .set(auth())
        .expect(200);
      status = poll.body.status;
    }

    expect(status).toBe('COMPLETED');
  });
});
