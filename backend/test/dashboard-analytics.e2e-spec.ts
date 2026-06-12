import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { STUDENT_ID, TEACHER_ID } from './helpers/constants';
import { createTestApp } from './helpers/create-test-app';

describe('Teacher dashboard analytics (e2e)', () => {
  let app: INestApplication;
  let teacherToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    const authService = testApp.module.get(AuthService);
    teacherToken = (await authService.issueTokensForUser(TEACHER_ID)).accessToken;
    studentToken = (await authService.issueTokensForUser(STUDENT_ID)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const teacherAuth = () => ({ Authorization: `Bearer ${teacherToken}` });

  it('GET /api/quizzes/dashboard/overview returns quizSummaryList and capped recentQuizzes', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/quizzes/dashboard/overview')
      .set(teacherAuth())
      .expect(200);

    expect(Array.isArray(res.body.quizSummaryList)).toBe(true);
    expect(Array.isArray(res.body.recentQuizzes)).toBe(true);
    expect(res.body.recentQuizzes.length).toBeLessThanOrEqual(8);
    expect(res.body.quizSummaryList.length).toBeGreaterThanOrEqual(res.body.recentQuizzes.length);
    expect(res.body.stats).toBeDefined();
    expect(res.body.filterOptions).toBeDefined();
    expect(Array.isArray(res.body.subjectPerformance)).toBe(true);
    expect(Array.isArray(res.body.topicPerformance)).toBe(true);
    for (const row of res.body.subjectPerformance) {
      expect(row).toMatchObject({
        subject: expect.any(String),
        score: expect.any(Number),
        answeredCount: expect.any(Number),
        correctCount: expect.any(Number),
      });
    }
    for (const row of res.body.topicPerformance) {
      expect(row).toMatchObject({
        topic: expect.any(String),
        score: expect.any(Number),
        answeredCount: expect.any(Number),
        correctCount: expect.any(Number),
      });
    }
    expect(res.body.creatorPerformance).toEqual([]);
    expect(res.body.quizSummaryList.every((q: { createdBy?: { userId?: string } }) =>
      !q.createdBy?.userId || q.createdBy.userId === TEACHER_ID,
    )).toBe(true);
  });

  it('teacher stats are scoped to their quizzes, not whole school', async () => {
    const teacherRes = await request(app.getHttpServer())
      .get('/api/quizzes/dashboard/overview')
      .set(teacherAuth())
      .expect(200);

    expect(teacherRes.body.creatorPerformance).toEqual([]);
    expect(teacherRes.body.stats.quizzesConducted).toBe(
      teacherRes.body.quizSummaryList.filter(
        (q: { status: string }) => q.status === 'PUBLISHED',
      ).length,
    );
    expect(typeof teacherRes.body.stats.totalStudents).toBe('number');
    expect(teacherRes.body.stats.totalStudents).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/quizzes/dashboard/overview accepts grade filter', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/quizzes/dashboard/overview')
      .query({ grade: 'Class 8' })
      .set(teacherAuth())
      .expect(200);

    expect(res.body.appliedFilters.grade).toBe('Class 8');
    expect(Array.isArray(res.body.subjectPerformance)).toBe(true);
    expect(Array.isArray(res.body.topicPerformance)).toBe(true);
  });

  it('rejects invalid createdByUserId (not a UUID)', async () => {
    await request(app.getHttpServer())
      .get('/api/quizzes/dashboard/overview')
      .query({ createdByUserId: 'not-a-uuid' })
      .set(teacherAuth())
      .expect(400);
  });

  it('ignores createdByUserId query for teachers and keeps implicit creator scope', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/quizzes/dashboard/overview')
      .query({ createdByUserId: 'all' })
      .set(teacherAuth())
      .expect(200);

    expect(res.body.appliedFilters.createdByUserId).toBe(TEACHER_ID);
    expect(res.body.creatorPerformance).toEqual([]);
  });

  it('denies students from teacher dashboard overview', async () => {
    await request(app.getHttpServer())
      .get('/api/quizzes/dashboard/overview')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });

  it('denies unauthenticated dashboard overview', async () => {
    await request(app.getHttpServer()).get('/api/quizzes/dashboard/overview').expect(401);
  });
});
