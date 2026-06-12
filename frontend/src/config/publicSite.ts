/**
 * Public marketing site copy and contact details.
 * Override via Vite env for each deployment without code changes.
 */
const trimOrUndefined = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const PUBLIC_SITE = {
  productName: 'Quizzy',
  tagline: 'Learn. Practice. Excel.',
  description:
    'Quizzy is a school quiz platform that helps students practice with purpose, gives teachers clear insights by grade, and keeps parents informed about progress.',
  heroSubtext:
    'Assign quizzes, celebrate effort with XP and streaks, and review results by grade and subject in one secure portal for your school.',
  supportEmail: trimOrUndefined(import.meta.env.VITE_SUPPORT_EMAIL) ?? 'support@quizzy.app',
  supportUrl: trimOrUndefined(import.meta.env.VITE_SUPPORT_URL),
  termsUrl: trimOrUndefined(import.meta.env.VITE_TERMS_URL),
  privacyUrl: trimOrUndefined(import.meta.env.VITE_PRIVACY_URL),
  /** Hosted demo video (MP4/WebM URL or path such as /videos/demo.mp4). */
  demoVideoUrl: trimOrUndefined(import.meta.env.VITE_DEMO_VIDEO_URL),
} as const;

export function supportMailtoHref(): string {
  return `mailto:${PUBLIC_SITE.supportEmail}`;
}
