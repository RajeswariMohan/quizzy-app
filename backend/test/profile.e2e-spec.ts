import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { STUDENT_ID, TEACHER_ID } from './helpers/constants';
import { createTestApp } from './helpers/create-test-app';

describe('User profile (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let studentToken: string;
  let teacherToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    module = testApp.module;
    const authService = module.get(AuthService);
    studentToken = (await authService.issueTokensForUser(STUDENT_ID)).accessToken;
    teacherToken = (await authService.issueTokensForUser(TEACHER_ID)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/me returns extended profile fields', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/me')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(res.body.firstName).toBeDefined();
    expect(res.body.lastName).toBeDefined();
    expect(res.body.email).toBeDefined();
    expect(res.body.role).toBe('STUDENT');
    expect(res.body.academicOptions).toBeDefined();
  });

  it('PATCH /api/me updates display name', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/me')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ displayName: 'Test Teacher Display' })
      .expect(200);

    expect(res.body.displayName).toBe('Test Teacher Display');
  });

  it('teacher cannot set student grade via profile', async () => {
    await request(app.getHttpServer())
      .patch('/api/me')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ grade: 'Class 8' })
      .expect(403);
  });

  it('PATCH /api/me/password changes password with current password', async () => {
    await request(app.getHttpServer())
      .patch('/api/me/password')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ currentPassword: 'TestPassword1!', newPassword: 'NewPassword9!' })
      .expect(200)
      .expect({ success: true });

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'teacher@test.school', password: 'NewPassword9!' })
      .expect(200);

    await request(app.getHttpServer())
      .patch('/api/me/password')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ currentPassword: 'NewPassword9!', newPassword: 'TestPassword1!' })
      .expect(200);
  });
});
