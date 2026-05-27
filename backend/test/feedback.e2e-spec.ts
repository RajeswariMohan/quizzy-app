import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { STUDENT_ID } from './helpers/constants';
import { createTestApp } from './helpers/create-test-app';

describe('Feedback (e2e)', () => {
  let app: INestApplication;
  let studentToken: string;
  let superAdminToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    const authService = testApp.module.get(AuthService);
    studentToken = (await authService.issueTokensForUser(STUDENT_ID)).accessToken;
    superAdminToken = (
      await authService.issueTokensForUser('44444444-4444-4444-4444-444444444444')
    ).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const studentAuth = () => ({ Authorization: `Bearer ${studentToken}` });
  const superAdminAuth = () => ({ Authorization: `Bearer ${superAdminToken}` });

  it('student can submit and list own feedback', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/feedback')
      .set(studentAuth())
      .send({
        category: 'UX',
        rating: 4,
        message: 'The quiz flow is easy to use but could show progress more clearly.',
      })
      .expect(201);

    expect(createRes.body.status).toBe('OPEN');
    expect(createRes.body.message).toContain('quiz flow');

    const listRes = await request(app.getHttpServer())
      .get('/api/feedback/mine')
      .set(studentAuth())
      .expect(200);

    expect(listRes.body.items.length).toBeGreaterThanOrEqual(1);
  });

  it('super admin can list and update feedback', async () => {
    await request(app.getHttpServer())
      .post('/api/feedback')
      .set(studentAuth())
      .send({
        message: 'Another feedback entry for admin review testing.',
      })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/api/admin/feedback')
      .set(superAdminAuth())
      .expect(200);

    expect(listRes.body.items.length).toBeGreaterThan(0);
    const target = listRes.body.items[0];

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/admin/feedback/${target.id}`)
      .set(superAdminAuth())
      .send({
        status: 'IN_PROGRESS',
        adminNotes: 'Reviewing with product team.',
      })
      .expect(200);

    expect(patchRes.body.status).toBe('IN_PROGRESS');
    expect(patchRes.body.adminNotes).toContain('product team');
  });
});
