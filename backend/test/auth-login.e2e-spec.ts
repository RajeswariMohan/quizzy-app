import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { buildStudentLoginEmail } from '../src/auth/constants/username.util';
import { SCHOOL_ID } from './helpers/constants';
import { createTestApp } from './helpers/create-test-app';

function uniqueUsername(prefix: string): string {
  return `${prefix}${Date.now().toString(36).slice(-8)}`;
}

describe('Auth login & register (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/register creates student with username and returns token', async () => {
    const username = uniqueUsername('stu');
    const parentEmail = `parent-of-${Date.now()}@test.school`;

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username,
        password: 'password123',
        firstName: 'New',
        lastName: 'Student',
        role: 'STUDENT',
        schoolId: SCHOOL_ID,
        parentEmail,
        board: 'CBSE',
        grade: 'Class 8',
        section: 'A',
      })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();

    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(200);

    expect(me.body.email).toBe(buildStudentLoginEmail(username, 'test-school'));
    expect(me.body.role).toBe('STUDENT');
  });

  it('GET /api/auth/register/check-username reports availability', async () => {
    const username = uniqueUsername('avail');

    await request(app.getHttpServer())
      .get('/api/auth/register/check-username')
      .query({ schoolId: SCHOOL_ID, username })
      .expect(200)
      .expect({ available: true, username });

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username,
        password: 'password123',
        firstName: 'Taken',
        lastName: 'User',
        role: 'STUDENT',
        schoolId: SCHOOL_ID,
        parentEmail: `parent-${Date.now()}@test.school`,
        board: 'CBSE',
        grade: 'Class 8',
        section: 'A',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/auth/register/check-username')
      .query({ schoolId: SCHOOL_ID, username })
      .expect(200)
      .expect({ available: false, username });
  });

  it('POST /api/auth/login authenticates parent by email and student by username', async () => {
    const username = uniqueUsername('login');
    const parentEmail = `login-parent-${Date.now()}@test.school`;
    const password = 'securepass99';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username,
        password,
        firstName: 'Login',
        lastName: 'Student',
        role: 'STUDENT',
        schoolId: SCHOOL_ID,
        parentEmail,
        board: 'CBSE',
        grade: 'Class 8',
        section: 'A',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: parentEmail,
        password,
        firstName: 'Login',
        lastName: 'Parent',
        role: 'PARENT',
        schoolId: SCHOOL_ID,
      })
      .expect(201);

    const parentLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ identifier: parentEmail, password })
      .expect(201);

    expect(parentLogin.body.accessToken).toBeDefined();

    const studentLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ identifier: username, password })
      .expect(201);

    expect(studentLogin.body.accessToken).toBeDefined();
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
    const username = uniqueUsername('badpass');
    const parentEmail = `bad-pass-parent-${Date.now()}@test.school`;
    const password = 'correctpassword1';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username,
        password,
        firstName: 'Bad',
        lastName: 'Student',
        role: 'STUDENT',
        schoolId: SCHOOL_ID,
        parentEmail,
        board: 'CBSE',
        grade: 'Class 8',
        section: 'A',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: parentEmail,
        password,
        firstName: 'Bad',
        lastName: 'Pass',
        role: 'PARENT',
        schoolId: SCHOOL_ID,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ identifier: parentEmail, password: 'wrongpassword1' })
      .expect(401);
  });

  it('POST /api/auth/login rejects unknown identifier', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ identifier: `nobody-${Date.now()}@test.school`, password: 'password123' })
      .expect(401);
  });

  it('POST /api/auth/register rejects invalid student username format', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username: 'bad username!',
        password: 'password123',
        firstName: 'Bad',
        lastName: 'User',
        role: 'STUDENT',
        schoolId: SCHOOL_ID,
        parentEmail: 'parent@test.school',
        board: 'CBSE',
        grade: 'Class 8',
        section: 'A',
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
        schoolId: SCHOOL_ID,
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
