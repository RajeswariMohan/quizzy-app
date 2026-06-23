import { describe, expect, it } from 'vitest';
import { PUBLIC_SITE, publicJoinUrl, parseBoolEnv, supportMailtoHref } from '@/config/publicSite';
import {
  LANDING_AUDIENCES,
  LANDING_COMMUNITY_SUMMARY,
  LANDING_FEATURES,
  LANDING_HERO_HIGHLIGHTS,
  LANDING_STEPS,
} from '@/content/landingContent';

function allLandingStrings(): string[] {
  return [
    PUBLIC_SITE.description,
    PUBLIC_SITE.heroSubtext,
    PUBLIC_SITE.tagline,
    LANDING_COMMUNITY_SUMMARY,
    ...LANDING_FEATURES.flatMap((f) => [f.title, f.description]),
    ...LANDING_STEPS.flatMap((s) => [s.title, s.body]),
    ...LANDING_AUDIENCES.flatMap((a) => [a.title, a.description]),
    ...LANDING_HERO_HIGHLIGHTS,
  ];
}

describe('publicSite config', () => {
  it('exposes product name, site URL, and support email', () => {
    expect(PUBLIC_SITE.productName).toBe('Quizzy');
    expect(PUBLIC_SITE.siteUrl).toBe('https://quizzyco.com');
    expect(PUBLIC_SITE.supportEmail).toBe('support@quizzyco.com');
  });

  it('builds mailto href from support email', () => {
    expect(supportMailtoHref()).toBe('mailto:support@quizzyco.com');
  });

  it('builds school join links from the public site URL', () => {
    expect(publicJoinUrl('greenfield-high')).toBe(
      'https://quizzyco.com/join/greenfield-high',
    );
  });

  it('defaults demoMode to false when env is unset', () => {
    expect(PUBLIC_SITE.demoMode).toBe(false);
  });

  it('parseBoolEnv accepts common true values', () => {
    expect(parseBoolEnv('true')).toBe(true);
    expect(parseBoolEnv('1')).toBe(true);
    expect(parseBoolEnv('yes')).toBe(true);
    expect(parseBoolEnv('false')).toBe(false);
    expect(parseBoolEnv(undefined)).toBe(false);
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
    expect(analytics?.description).toMatch(/by grade, subject, and quiz creator/);
  });

  it('avoids "class" wording in favor of grade on the landing page', () => {
    const combined = allLandingStrings().join(' ').toLowerCase();
    expect(combined).not.toMatch(/\bclass\b/);
    expect(combined).not.toMatch(/\bclasses\b/);
  });

  it('uses Oxford comma in multi-item role lists', () => {
    const dashboards = LANDING_HERO_HIGHLIGHTS.find((h) => h.includes('Dashboards'));
    expect(dashboards).toMatch(/students, teachers, parents, and school administrators/);
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
