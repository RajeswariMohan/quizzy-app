import { getCorsOrigins } from './cors.config';

describe('getCorsOrigins', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFrontendOrigin = process.env.FRONTEND_ORIGIN;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.FRONTEND_ORIGIN = originalFrontendOrigin;
  });

  it('includes localhost in non-production', () => {
    process.env.NODE_ENV = 'development';
    process.env.FRONTEND_ORIGIN = '';
    expect(getCorsOrigins()).toEqual(
      expect.arrayContaining(['http://localhost:5173', 'http://127.0.0.1:5173']),
    );
  });

  it('omits localhost in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_ORIGIN = 'https://quizzy.vercel.app';
    expect(getCorsOrigins()).toEqual(['https://quizzy.vercel.app']);
  });

  it('supports comma-separated FRONTEND_ORIGIN values', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_ORIGIN =
      'https://quizzy.vercel.app, https://www.quizzy.app';
    expect(getCorsOrigins()).toEqual([
      'https://quizzy.vercel.app',
      'https://www.quizzy.app',
    ]);
  });
});
