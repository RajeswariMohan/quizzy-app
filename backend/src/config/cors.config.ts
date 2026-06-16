/** Comma-separated production frontend origins (e.g. Vercel URL). */
export function getCorsOrigins(): string[] {
  const devDefaults =
    process.env.NODE_ENV === 'production'
      ? []
      : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  const fromEnv = (process.env.FRONTEND_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...devDefaults, ...fromEnv])];
}
