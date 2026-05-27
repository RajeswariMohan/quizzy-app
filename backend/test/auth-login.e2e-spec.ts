import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/create-test-app';

describe('Auth login & register (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/register creates student and returns token', async () => {
    const email = `student-${Date.now()}@test.school`;

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'password123',
        firstName: 'New',
        lastName: 'Student',
        role: 'STUDENT',
        board: 'CBSE',
        grade: 'Class 8',
        subject: 'Science',
      })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();

    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(200);

    expect(me.body.email).toBe(email);
    expect(me.body.role).toBe('STUDENT');
  });

  it('POST /api/auth/login authenticates registered user', async () => {
    const email = `login-${Date.now()}@test.school`;
    const password = 'securepass99';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        firstName: 'Login',
        lastName: 'Test',
        role: 'PARENT',
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(201);

    expect(login.body.accessToken).toBeDefined();
  });

  it('POST /api/auth/dev/token issues teacher token for /api/me', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/dev/token')
      .send({ role: 'teacher' })
      .expect(201);

    expect(res.body.accessToken).toMatch(/^eyJ/);

    await request(app.getHttpServer())
      .get('/api/me')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(200)
      .expect((me) => {
        expect(me.body.role).toBe('TEACHER');
      });
  });
});
