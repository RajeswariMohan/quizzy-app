import { Link } from 'react-router-dom';
import { Building2, Lock, Target } from 'lucide-react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { PUBLIC_SITE } from '@/config/publicSite';
const VALUES = [
  {
    icon: Target,
    title: 'Learning first',
    body: 'Quizzes should build understanding, not just scores. Instant feedback and progress views help students and families focus on growth.',
  },
  {
    icon: Building2,
    title: 'School-ready',
    body: 'Multi-tenant architecture keeps each school’s users, classes, and quizzes separate. Administrators manage academics and accounts in one place.',
  },
  {
    icon: Lock,
    title: 'Trust by design',
    body: 'Role-based access, tenant-scoped APIs, and audited admin actions reflect how schools expect student data to be handled.',
  },
] as const;

export function AboutPage() {
  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">About us</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Why we built {PUBLIC_SITE.productName}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted">
          {PUBLIC_SITE.productName} is a unified quiz portal for schools. Students practice,
          teachers create and analyze assessments, parents follow progress, and school
          administrators run their tenant securely on one platform.
        </p>
        <p className="mt-4 text-base leading-relaxed text-muted">
          We combine gamification (XP, streaks, and leaderboards) with practical analytics so
          engagement and learning outcomes improve together. AI-assisted question generation helps
          teachers scale quality content while staying in control.
        </p>

        <ul className="mt-12 space-y-6">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold text-ink">{title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <section id="terms" className="mt-14 scroll-mt-24 border-t border-gray-200 pt-10">
          <h2 className="text-lg font-semibold text-ink">Terms of service</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            By using {PUBLIC_SITE.productName}, you agree to use the platform for educational
            purposes in line with your school&apos;s policies. Account access is granted by role
            (student, parent, teacher, or administrator). Misuse, sharing credentials, or
            attempting to access another school&apos;s data is prohibited.
          </p>
        </section>

        <section id="privacy" className="mt-10 scroll-mt-24">
          <h2 className="text-lg font-semibold text-ink">Privacy policy</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            We process account and learning data to provide quizzes, progress tracking, and
            analytics. Data is limited to your school tenant. For data requests or deletion
            questions, contact your school administrator or email us at{' '}
            <a href={`mailto:${PUBLIC_SITE.supportEmail}`} className="text-primary hover:underline">
              {PUBLIC_SITE.supportEmail}
            </a>
            .
          </p>
        </section>

        <p className="mt-10 text-sm text-muted">
          <Link to="/" className="font-medium text-primary hover:underline">
            ← Back to home
          </Link>
        </p>
      </article>
    </PublicLayout>
  );
}
