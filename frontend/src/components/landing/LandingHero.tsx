import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { LoginHeroIllustration } from '@/components/auth/LoginHeroIllustration';
import { WatchDemoButton } from '@/components/landing/WatchDemoButton';
import { PUBLIC_SITE } from '@/config/publicSite';
import { LANDING_HERO_HIGHLIGHTS } from '@/content/landingContent';
import { cn } from '@/lib/cn';

const TRUST_POINTS = ['Secure multi-tenant schools', 'Grade-level insights', 'Built for K–12'] as const;

const primaryCtaClass =
  'inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:w-auto';

const outlineCtaClass =
  'inline-flex w-full items-center justify-center rounded-xl border border-primary/30 bg-white px-6 py-3.5 text-base font-semibold text-primary transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:w-auto';

export function LandingHero() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14 lg:pt-16">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Built for K–12 schools
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            {PUBLIC_SITE.productName}
            <span className="mt-2 block text-2xl font-semibold text-primary sm:text-3xl">
              {PUBLIC_SITE.tagline}
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {PUBLIC_SITE.description}
          </p>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {PUBLIC_SITE.heroSubtext}
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link to="/signup" className={primaryCtaClass}>
              Sign up
            </Link>
            <Link to="/login" className={outlineCtaClass}>
              Sign in
            </Link>
            <WatchDemoButton />
          </div>

          <p className="mt-6 text-sm leading-relaxed text-muted">
            Use your school email address if your institution already uses {PUBLIC_SITE.productName}.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            className={cn(
              'rounded-3xl border border-white/80 bg-gradient-to-br from-white to-primary/[0.04] p-6 shadow-card backdrop-blur-sm sm:p-8',
            )}
          >
            <LoginHeroIllustration />
            <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-primary">
              Why schools choose {PUBLIC_SITE.productName}
            </p>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
              {LANDING_HERO_HIGHLIGHTS.map((text, index) => (
                <li key={text} className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      'mt-2 h-1.5 w-1.5 shrink-0 rounded-full',
                      index === 0 && 'bg-primary',
                      index === 1 && 'bg-secondary',
                      index === 2 && 'bg-success',
                    )}
                    aria-hidden
                  />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
