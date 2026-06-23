/**
 * Public marketing site copy and contact details.
 * Override via Vite env for each deployment without code changes.
 */
const trimOrUndefined = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/** Parse Vite boolean env vars (true / 1 / yes, case-insensitive). */
export function parseBoolEnv(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

export const PUBLIC_SITE = {
  productName: 'Quizzy',
  tagline: 'Learn. Practice. Excel.',
  description:
    'Quizzy is a school quiz platform that helps students practice with purpose, gives teachers clear insights by grade, and keeps parents informed about progress.',
  heroSubtext:
    'Assign quizzes, celebrate effort with XP and streaks, and review results by grade and subject in one secure portal for your school.',
  /** Public frontend origin (join links, marketing URLs). */
  siteUrl:
    trimOrUndefined(import.meta.env.VITE_PUBLIC_SITE_URL) ?? 'https://quizzyco.com',
  supportEmail:
    trimOrUndefined(import.meta.env.VITE_SUPPORT_EMAIL) ?? 'support@quizzyco.com',
  supportUrl: trimOrUndefined(import.meta.env.VITE_SUPPORT_URL),
  termsUrl: trimOrUndefined(import.meta.env.VITE_TERMS_URL),
  privacyUrl: trimOrUndefined(import.meta.env.VITE_PRIVACY_URL),
  /** Hosted demo video (MP4/WebM URL or path such as /videos/demo.mp4). */
  demoVideoUrl: trimOrUndefined(import.meta.env.VITE_DEMO_VIDEO_URL),
  /**
   * Public demo deploy: hide unlisted student signup and show contact-first Watch demo modal.
   * Set VITE_PUBLIC_DEMO_MODE=true on Vercel for quizzyco.com demo.
   */
  demoMode: parseBoolEnv(import.meta.env.VITE_PUBLIC_DEMO_MODE),
} as const;

export function supportMailtoHref(): string {
  return `mailto:${PUBLIC_SITE.supportEmail}`;
}

/** School invite link for teachers and students (always uses the public site URL). */
export function publicJoinUrl(schoolSlug: string): string {
  const base = PUBLIC_SITE.siteUrl.replace(/\/$/, '');
  return `${base}/join/${encodeURIComponent(schoolSlug.trim())}`;
}
