import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { BACKUP_FORMAT_VERSION } from '../src/data-transfer/data-transfer.types';
import {
  SCHOOL_ADMIN_ID,
  SCHOOL_ID,
  SUPER_ADMIN_ID,
  TEACHER_ID,
} from './helpers/constants';
import { createTestApp } from './helpers/create-test-app';

describe('Data transfer backup (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let schoolAdminToken: string;
  let superAdminToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    module = testApp.module;
    const authService = module.get(AuthService);
    schoolAdminToken = (
      await authService.issueTokensForUser(SCHOOL_ADMIN_ID)
    ).accessToken;
    superAdminToken = (
      await authService.issueTokensForUser(SUPER_ADMIN_ID)
    ).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const schoolAdminAuth = () => ({ Authorization: `Bearer ${schoolAdminToken}` });
  const superAdminAuth = () => ({
    Authorization: `Bearer ${superAdminToken}`,
    'X-School-Ids': SCHOOL_ID,
  });

  it('school admin can export backup JSON', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/data/export')
      .set(schoolAdminAuth())
      .expect(200);

    expect(res.body.formatVersion).toBe(BACKUP_FORMAT_VERSION);
    expect(res.body.scope.schoolIds).toContain(SCHOOL_ID);
    expect(Array.isArray(res.body.schools)).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
  });

  it('school admin can validate import with dry run', async () => {
    const exportRes = await request(app.getHttpServer())
      .get('/api/admin/data/export')
      .set(schoolAdminAuth())
      .expect(200);

    const buffer = Buffer.from(JSON.stringify(exportRes.body), 'utf8');

    const importRes = await request(app.getHttpServer())
      .post('/api/admin/data/import?dryRun=true')
      .set(schoolAdminAuth())
      .attach('file', buffer, 'backup.json')
      .expect(201);

    expect(importRes.body.dryRun).toBe(true);
    expect(importRes.body.imported.schools).toBeGreaterThanOrEqual(0);
  });

  it('super admin can export with school scope header', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/data/export')
      .set(superAdminAuth())
      .expect(200);

    expect(res.body.scope.schoolIds).toContain(SCHOOL_ID);
  });

  it('rejects import without a file', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/data/import')
      .set(schoolAdminAuth())
      .expect(400);
  });

  it('rejects invalid JSON upload', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/data/import?dryRun=true')
      .set(schoolAdminAuth())
      .attach('file', Buffer.from('not json'), 'bad.json')
      .expect(400);
  });

  it('teacher cannot access backup endpoints', async () => {
    const authService = module.get(AuthService);
    const teacherToken = (await authService.issueTokensForUser(TEACHER_ID)).accessToken;

    await request(app.getHttpServer())
      .get('/api/admin/data/export')
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(403);
  });
});
