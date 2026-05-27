import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { PARENT_ID, STUDENT_ID } from './helpers/constants';
import { createTestApp } from './helpers/create-test-app';

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

  it('POST /api/auth/register links parent to student when studentEmail provided', async () => {
    const email = `parent-link-${Date.now()}@test.school`;

    const register = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'password123',
        firstName: 'Link',
        lastName: 'Parent',
        role: 'PARENT',
        studentEmail: 'student@test.school',
      })
      .expect(201);

    const token = register.body.accessToken as string;

    const children = await request(app.getHttpServer())
      .get('/api/parent/children')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(children.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: STUDENT_ID, email: 'student@test.school' }),
      ]),
    );
  });

  it('POST /api/parent/link rejects student from wrong email', async () => {
    await request(app.getHttpServer())
      .post('/api/parent/link')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ studentEmail: 'nobody@example.com' })
      .expect(404);
  });

  it('parent without links cannot load child summary', async () => {
    const email = `lonely-parent-${Date.now()}@test.school`;

    const register = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'password123',
        firstName: 'Lonely',
        lastName: 'Parent',
        role: 'PARENT',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/parent/child-summary')
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .expect(404);
  });
});
