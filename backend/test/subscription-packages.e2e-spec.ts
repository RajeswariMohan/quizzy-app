import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import {
  SCHOOL_ID,
  SUPER_ADMIN_ID,
  TEACHER_ID,
  TEST_QUIZ_ID,
} from './helpers/constants';
import { createTestApp } from './helpers/create-test-app';

describe('Subscription packages (e2e)', () => {
  let app: INestApplication;
  let superAdminToken: string;
  let teacherToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    const authService = testApp.module.get(AuthService);
    superAdminToken = (await authService.issueTokensForUser(SUPER_ADMIN_ID)).accessToken;
    teacherToken = (await authService.issueTokensForUser(TEACHER_ID)).accessToken;
  });

  afterAll(async () => {
    await request(app.getHttpServer())
      .patch(`/api/admin/schools/${SCHOOL_ID}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ subscriptionTier: 'STANDARD' })
      .catch(() => undefined);
    await app.close();
  });

  it('GET /api/admin/subscription-packages returns templates and feature metadata', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/subscription-packages')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    expect(res.body.templates.BASIC).toBeDefined();
    expect(res.body.templates.STANDARD).toBeDefined();
    expect(res.body.templates.PREMIUM).toBeDefined();
    expect(Array.isArray(res.body.features)).toBe(true);
    expect(res.body.features.length).toBeGreaterThan(0);
  });

  it('GET /api/school/features returns effective features for tenant', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/school/features')
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    expect(res.body.subscriptionTier).toBeDefined();
    expect(Array.isArray(res.body.allowedPublishScopes)).toBe(true);
  });

  it('Basic tier rejects section-level publish', async () => {
    await request(app.getHttpServer())
      .patch(`/api/admin/schools/${SCHOOL_ID}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ subscriptionTier: 'BASIC' })
      .expect(200);

    const quizRes = await request(app.getHttpServer())
      .get(`/api/quizzes/${TEST_QUIZ_ID}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    if (quizRes.body.status === 'PUBLISHED') {
      await request(app.getHttpServer())
        .patch(`/api/quizzes/${TEST_QUIZ_ID}/unpublish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
    }

    await request(app.getHttpServer())
      .patch(`/api/quizzes/${TEST_QUIZ_ID}/publish`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        audienceScope: 'GRADE_SECTION',
        targets: [{ grade: 'Class 5', section: 'A' }],
      })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/api/admin/schools/${SCHOOL_ID}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ subscriptionTier: 'STANDARD' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/quizzes/${TEST_QUIZ_ID}/publish`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        audienceScope: 'GRADE',
        targets: [{ grade: 'Class 5' }],
      })
      .expect(200);
  });

  it('PATCH /api/admin/subscription-packages updates templates', async () => {
    const current = await request(app.getHttpServer())
      .get('/api/admin/subscription-packages')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    const templates = {
      ...current.body.templates,
      STANDARD: {
        ...current.body.templates.STANDARD,
        bulkUserImportEnabled: false,
      },
    };

    const patchRes = await request(app.getHttpServer())
      .patch('/api/admin/subscription-packages')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(templates)
      .expect(200);

    expect(patchRes.body.STANDARD.bulkUserImportEnabled).toBe(false);

    await request(app.getHttpServer())
      .patch('/api/admin/subscription-packages')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(current.body.templates)
      .expect(200);
  });
});
