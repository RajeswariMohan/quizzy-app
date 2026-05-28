import { describe, expect, it } from 'vitest';
import { PUBLIC_SITE, supportMailtoHref } from '@/config/publicSite';
import {
  LANDING_AUDIENCES,
  LANDING_FEATURES,
  LANDING_HERO_HIGHLIGHTS,
  LANDING_STEPS,
} from '@/content/landingContent';

function allLandingStrings(): string[] {
  return [
    PUBLIC_SITE.description,
    PUBLIC_SITE.heroSubtext,
    PUBLIC_SITE.tagline,
    ...LANDING_FEATURES.flatMap((f) => [f.title, f.description]),
    ...LANDING_STEPS.flatMap((s) => [s.title, s.body]),
    ...LANDING_AUDIENCES.flatMap((a) => [a.title, a.description]),
    ...LANDING_HERO_HIGHLIGHTS,
  ];
}

describe('publicSite config', () => {
  it('exposes product name and support email', () => {
    expect(PUBLIC_SITE.productName).toBe('Quizzy');
    expect(PUBLIC_SITE.supportEmail).toMatch(/@/);
  });

  it('builds mailto href from support email', () => {
    expect(supportMailtoHref()).toBe(`mailto:${PUBLIC_SITE.supportEmail}`);
  });
});

describe('landing marketing copy', () => {
  it('does not use "free" promotional wording on public pages', () => {
    const combined = allLandingStrings().join(' ').toLowerCase();
    expect(combined).not.toMatch(/\bfree\b/);
    expect(combined).not.toMatch(/get started free/);
  });

  it('uses quiz creator terminology (not quiz author) in feature copy', () => {
    const analytics = LANDING_FEATURES.find((f) => f.title.includes('Analytics'));
    expect(analytics?.description).toContain('quiz creator');
    expect(analytics?.description).not.toMatch(/quiz author/i);
  });

  it('uses parallel list phrasing for analytics dimensions', () => {
    const analytics = LANDING_FEATURES.find((f) => f.title.includes('Analytics'));
    expect(analytics?.description).toMatch(/by class, grade level, and quiz creator/);
  });

  it('includes sign-up oriented hero highlights', () => {
    expect(LANDING_HERO_HIGHLIGHTS.length).toBeGreaterThanOrEqual(3);
    expect(LANDING_HERO_HIGHLIGHTS.some((h) => h.toLowerCase().includes('feedback'))).toBe(true);
  });

  it('has non-empty step copy for onboarding', () => {
    expect(LANDING_STEPS).toHaveLength(3);
    for (const step of LANDING_STEPS) {
      expect(step.title.length).toBeGreaterThan(3);
      expect(step.body.length).toBeGreaterThan(20);
    }
  });
});
