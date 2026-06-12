import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { buildStudentLoginEmail } from '../src/auth/constants/username.util';
import { AuthService } from '../src/auth/auth.service';
import { PARENT_ID, SCHOOL_ID, STUDENT_ID, UNLISTED_SCHOOL_ID } from './helpers/constants';
import { createTestApp } from './helpers/create-test-app';

function uniqueUsername(prefix: string): string {
  return `${prefix}${Date.now().toString(36).slice(-8)}`;
}

describe('Parent–student linking (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let parentToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    authService = testApp.module.get(AuthService);
    parentToken = (await authService.issueTokensForUser(PARENT_ID)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/auth/register-schools lists active schools excluding unlisted', async () => {
    const res = await request(app.getHttpServer()).get('/api/auth/register-schools').expect(200);

    expect(res.body.otherSchoolId).toBe(UNLISTED_SCHOOL_ID);
    expect(res.body.schools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: SCHOOL_ID,
          name: 'Test School',
        }),
      ]),
    );
    expect(res.body.schools).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: UNLISTED_SCHOOL_ID })]),
    );
  });

  it('GET /api/parent/children returns seeded linked student', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/parent/children')
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(200);

    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: STUDENT_ID,
          email: 'student@test.school',
        }),
      ]),
    );
  });

  it('GET /api/parent/child-summary returns only linked child data', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/parent/child-summary')
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(200);

    expect(res.body.child.userId).toBe(STUDENT_ID);
    expect(res.body.child.displayName).toContain('Student');
  });

  it('student registers with parentEmail then parent auto-links on register', async () => {
    const parentEmail = `parent-auto-${Date.now()}@test.school`;
    const username = uniqueUsername('auto');

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username,
        password: 'password123',
        firstName: 'Auto',
        lastName: 'Student',
        role: 'STUDENT',
        schoolId: SCHOOL_ID,
        parentEmail,
        board: 'CBSE',
        grade: 'Class 8',
        section: 'A',
      })
      .expect(201);

    const register = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: parentEmail,
        password: 'password123',
        firstName: 'Auto',
        lastName: 'Parent',
        role: 'PARENT',
        schoolId: SCHOOL_ID,
      })
      .expect(201);

    const token = register.body.accessToken as string;
    const studentLoginEmail = buildStudentLoginEmail(username, 'test-school');

    const children = await request(app.getHttpServer())
      .get('/api/parent/children')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(children.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ email: studentLoginEmail })]),
    );
  });

  it('parent register fails when no student has matching parent email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `orphan-parent-${Date.now()}@test.school`,
        password: 'password123',
        firstName: 'Orphan',
        lastName: 'Parent',
        role: 'PARENT',
        schoolId: SCHOOL_ID,
      })
      .expect(404);
  });

  it('parent register fails before student registers', async () => {
    const parentEmail = `early-parent-${Date.now()}@test.school`;

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: parentEmail,
        password: 'password123',
        firstName: 'Early',
        lastName: 'Parent',
        role: 'PARENT',
        schoolId: SCHOOL_ID,
      })
      .expect(404);
  });

  it('POST /api/parent/link is disabled for parents', async () => {
    await request(app.getHttpServer())
      .post('/api/parent/link')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ studentEmail: 'student@test.school' })
      .expect(403);
  });

  it('student register requires schoolId, username, and parentEmail', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username: uniqueUsername('incomplete'),
        password: 'password123',
        firstName: 'Incomplete',
        lastName: 'Student',
        role: 'STUDENT',
        board: 'CBSE',
        grade: 'Class 8',
        section: 'A',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username: uniqueUsername('noparent'),
        password: 'password123',
        firstName: 'No',
        lastName: 'Parent',
        role: 'STUDENT',
        schoolId: SCHOOL_ID,
        board: 'CBSE',
        grade: 'Class 8',
        section: 'A',
      })
      .expect(400);
  });

  it('unlisted student signup requires signupSchoolNote', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username: uniqueUsername('unlisted'),
        password: 'password123',
        firstName: 'Unlisted',
        lastName: 'Student',
        role: 'STUDENT',
        schoolId: UNLISTED_SCHOOL_ID,
        parentEmail: `unlisted-parent-${Date.now()}@test.school`,
        board: 'CBSE',
        grade: 'Class 8',
        section: 'A',
      })
      .expect(400);
  });
});
