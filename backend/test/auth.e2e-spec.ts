import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import {
  SCHOOL_ID,
  STUDENT_ID,
  SUPER_ADMIN_ID,
  TEACHER_ID,
} from './helpers/constants';
import { createTestApp } from './helpers/create-test-app';

describe('Auth & RBAC (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let teacherToken: string;
  let studentToken: string;
  let superAdminToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    authService = testApp.module.get(AuthService);
    teacherToken = (await authService.issueTokensForUser(TEACHER_ID)).accessToken;
    studentToken = (await authService.issueTokensForUser(STUDENT_ID)).accessToken;
    superAdminToken = (await authService.issueTokensForUser(SUPER_ADMIN_ID)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health is public', () => {
    return request(app.getHttpServer()).get('/api/health').expect(200).expect({
      status: 'ok',
      service: 'quizzy-api',
    });
  });

  it('GET /api/me returns 401 without token', () => {
    return request(app.getHttpServer()).get('/api/me').expect(401);
  });

  it('GET /api/me returns 401 for invalid token', () => {
    return request(app.getHttpServer())
      .get('/api/me')
      .set('Authorization', 'Bearer not-a-valid-jwt')
      .expect(401);
  });

  it('GET /api/me allows teacher with valid tenant token', () => {
    return request(app.getHttpServer())
      .get('/api/me')
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.userId).toBe(TEACHER_ID);
        expect(res.body.role).toBe('TEACHER');
        expect(res.body.schoolId).toBe(SCHOOL_ID);
        expect(res.body.isTenantScoped).toBe(true);
      });
  });

  it('GET /api/me allows super admin', () => {
    return request(app.getHttpServer())
      .get('/api/me')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.role).toBe('SUPER_ADMIN');
        expect(res.body.schoolId).toBeNull();
      });
  });

  it('GET /api/me allows student with valid tenant token', () => {
    return request(app.getHttpServer())
      .get('/api/me')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.userId).toBe(STUDENT_ID);
        expect(res.body.role).toBe('STUDENT');
        expect(res.body.schoolId).toBe(SCHOOL_ID);
      });
  });
});
