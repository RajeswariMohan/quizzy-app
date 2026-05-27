/** Seeded user IDs from database/seeds/test-auth.seed.sql */
export const DEV_SEED_USER_IDS = {
  teacher: '22222222-2222-2222-2222-222222222222',
  student: '33333333-3333-3333-3333-333333333333',
  superadmin: '44444444-4444-4444-4444-444444444444',
  parent: '55555555-5555-5555-5555-555555555555',
  schooladmin: '66666666-6666-6666-6666-666666666666',
} as const;

export type DevSeedRole = keyof typeof DEV_SEED_USER_IDS;

/** Legacy CLI alias: `npm run issue-token -- admin` */
export const DEV_SEED_ROLE_ALIASES: Record<string, DevSeedRole> = {
  admin: 'superadmin',
};

export function resolveDevSeedRole(role: string): DevSeedRole {
  const normalized = role.trim().toLowerCase();
  if (normalized in DEV_SEED_USER_IDS) {
    return normalized as DevSeedRole;
  }
  const alias = DEV_SEED_ROLE_ALIASES[normalized];
  if (alias) return alias;
  throw new Error(`Unknown role. Use: ${Object.keys(DEV_SEED_USER_IDS).join(', ')}`);
}
