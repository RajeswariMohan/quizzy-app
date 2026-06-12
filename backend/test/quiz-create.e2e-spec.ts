import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import {
  SCHOOL_ADMIN_ID,
  SCHOOL_ID,
  TEACHER_ID,
  TEST_CLASS_ID,
  TEST_QUIZ_ID,
} from './helpers/constants';
import { createTestApp } from './helpers/create-test-app';

describe('Quiz creation (e2e)', () => {
  let app: INestApplication;
  let teacherToken: string;
  let schoolAdminToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    const authService = testApp.module.get(AuthService);
    teacherToken = (await authService.issueTokensForUser(TEACHER_ID)).accessToken;
    schoolAdminToken = (await authService.issueTokensForUser(SCHOOL_ADMIN_ID)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/quizzes creates a tenant-scoped draft quiz', async () => {
    const title = `E2E Quiz ${Date.now()}`;

    const res = await request(app.getHttpServer())
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId: TEST_CLASS_ID,
        title,
        subject: 'Mathematics',
        topic: 'Fractions',
      })
      .expect(201);

    expect(res.body.schoolId).toBe(SCHOOL_ID);
    expect(res.body.classId).toBe(TEST_CLASS_ID);
    expect(res.body.status).toBe('DRAFT');
    expect(res.body.title).toBe(title);

    const fetched = await request(app.getHttpServer())
      .get(`/api/quizzes/${res.body.id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    expect(fetched.body.title).toBe(title);
    expect(fetched.body.questionCount).toBe(0);
  });

  it('POST /api/quizzes resolves class from grade when classId omitted', async () => {
    const title = `Grade quiz ${Date.now()}`;

    const res = await request(app.getHttpServer())
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title,
        subject: 'Science',
        topic: 'Cells',
        board: 'CBSE',
        grade: 'Class 8',
      })
      .expect(201);

    expect(res.body.schoolId).toBe(SCHOOL_ID);
    expect(res.body.classId).toBeTruthy();
    expect(res.body.grade).toBe('Class 8');
    expect(res.body.status).toBe('DRAFT');

    const list = await request(app.getHttpServer())
      .get('/api/quizzes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    const created = list.body.find((q: { id: string }) => q.id === res.body.id);
    expect(created?.grade).toBe('Class 8');
    expect(created?.board).toBe('CBSE');
  });

  it('PATCH /api/quizzes/:id updates metadata', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId: TEST_CLASS_ID,
        title: `Update target ${Date.now()}`,
        subject: 'Science',
        topic: 'Plants',
      })
      .expect(201);

    const quizId = createRes.body.id as string;

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'Updated title', topic: 'Trees' })
      .expect(200);

    expect(patchRes.body.title).toBe('Updated title');
    expect(patchRes.body.topic).toBe('Trees');
  });

  it('PATCH unpublish then publish round-trips published quiz', async () => {
    const unpublishRes = await request(app.getHttpServer())
      .patch(`/api/quizzes/${TEST_QUIZ_ID}/unpublish`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    expect(unpublishRes.body.status).toBe('DRAFT');
    expect(unpublishRes.body.publishedAt).toBeNull();

    const publishRes = await request(app.getHttpServer())
      .patch(`/api/quizzes/${TEST_QUIZ_ID}/publish`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        audienceScope: 'GRADE',
        targets: [{ grade: 'Class 5' }],
      })
      .expect(200);

    expect(publishRes.body.status).toBe('PUBLISHED');
    expect(publishRes.body.publishedAt).toBeTruthy();
  });

  it('GET /api/quizzes lists only quizzes created by the teacher', async () => {
    const adminQuiz = await request(app.getHttpServer())
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        classId: TEST_CLASS_ID,
        title: `Admin-only quiz ${Date.now()}`,
        subject: 'English',
        topic: 'Grammar',
      })
      .expect(201);

    const teacherQuiz = await request(app.getHttpServer())
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId: TEST_CLASS_ID,
        title: `Teacher quiz ${Date.now()}`,
        subject: 'Science',
        topic: 'Plants',
      })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get('/api/quizzes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    const ids = list.body.map((q: { id: string }) => q.id);
    expect(ids).toContain(teacherQuiz.body.id);
    expect(ids).not.toContain(adminQuiz.body.id);
  });

  it('GET /api/quizzes/:id returns 404 for another user quiz in same school', async () => {
    const adminQuiz = await request(app.getHttpServer())
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        classId: TEST_CLASS_ID,
        title: `Admin quiz access ${Date.now()}`,
        subject: 'Science',
        topic: 'Cells',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/quizzes/${adminQuiz.body.id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(404);
  });
});
