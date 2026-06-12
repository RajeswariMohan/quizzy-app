import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { WatchDemoButton } from '@/components/landing/WatchDemoButton';
import {
  LANDING_AUDIENCES,
  LANDING_COMMUNITY_SUMMARY,
  LANDING_FEATURES,
  LANDING_STEPS,
} from '@/content/landingContent';
import { PUBLIC_SITE, supportMailtoHref } from '@/config/publicSite';

export function LandingFeaturesSection() {
  return (
    <section id="features" className="scroll-mt-24 border-t border-gray-200/60 bg-white/50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Tools your school can use every day
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            From daily practice to school-wide reporting, {PUBLIC_SITE.productName} supports
            teaching, learning, and family engagement in one place.
          </p>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LANDING_FEATURES.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition hover:border-primary/20 hover:shadow-lg"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-ink">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function LandingHowItWorksSection() {
  return (
    <section id="demo" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">How it works</h2>
            <p className="mt-3 max-w-xl text-muted">
              Three steps from registration to meaningful progress reports.
            </p>
          </div>
          <WatchDemoButton />
        </div>

        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {LANDING_STEPS.map(({ step, title, body }) => (
            <li key={step} className="relative rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-card">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white"
                aria-hidden
              >
                {step}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function LandingAudiencesSection() {
  return (
    <section id="about" className="scroll-mt-24 border-t border-gray-200/60 bg-white/50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Designed for your whole school community
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              {LANDING_COMMUNITY_SUMMARY}
            </p>
            <Link
              to="/about"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Read more about {PUBLIC_SITE.productName}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {LANDING_AUDIENCES.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition hover:border-primary/15 hover:shadow-md"
              >
                <Icon className="h-6 w-6 text-secondary" aria-hidden />
                <h3 className="mt-3 font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function LandingCtaSection() {
  return (
    <section id="contact" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary px-8 py-12 text-center text-white shadow-xl shadow-primary/25 sm:px-12 sm:py-14">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Ready to use {PUBLIC_SITE.productName} at your school?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/90 sm:text-base">
            Create an account or sign in with your school email address. For technical help, contact
            our support team.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/signup"
              className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-white px-6 py-3 text-base font-medium text-primary transition hover:bg-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Sign up
            </Link>
            <Link
              to="/login"
              className="inline-flex min-w-[160px] items-center justify-center rounded-xl border border-white/50 bg-white/10 px-6 py-3 text-base font-medium text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Sign in
            </Link>
            <WatchDemoButton variant="cta" />
            <a
              href={supportMailtoHref()}
              className="inline-flex min-w-[160px] items-center justify-center rounded-xl border border-white/40 px-6 py-3 text-base font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Contact support
            </a>
          </div>
          <p className="mt-6 text-xs text-white/75">
            Email{' '}
            <a href={supportMailtoHref()} className="font-medium underline underline-offset-2">
              {PUBLIC_SITE.supportEmail}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
