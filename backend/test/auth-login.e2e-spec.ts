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

  it('POST /api/auth/login rejects wrong password', async () => {
    const email = `bad-pass-${Date.now()}@test.school`;
    const password = 'correctpassword1';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        firstName: 'Bad',
        lastName: 'Pass',
        role: 'PARENT',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'wrongpassword1' })
      .expect(401);
  });

  it('POST /api/auth/login rejects unknown email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: `nobody-${Date.now()}@test.school`, password: 'password123' })
      .expect(401);
  });

  it('POST /api/auth/register rejects invalid email format', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'not-an-email',
        password: 'password123',
        firstName: 'Bad',
        lastName: 'Email',
        role: 'STUDENT',
        board: 'CBSE',
        grade: 'Class 8',
        subject: 'Science',
      })
      .expect(400);
  });

  it('POST /api/auth/register rejects password shorter than 8 characters', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `short-${Date.now()}@test.school`,
        password: 'short',
        firstName: 'Short',
        lastName: 'Pass',
        role: 'PARENT',
      })
      .expect(400);
  });

  it('POST /api/auth/dev/token rejects invalid role', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/dev/token')
      .send({ role: 'invalid-role' })
      .expect(400);
  });

  it('POST /api/auth/dev/token issues each seed role', async () => {
    for (const role of ['student', 'parent', 'schooladmin', 'superadmin'] as const) {
      const res = await request(app.getHttpServer())
        .post('/api/auth/dev/token')
        .send({ role })
        .expect(201);
      expect(res.body.accessToken).toMatch(/^eyJ/);
    }
  });
});
