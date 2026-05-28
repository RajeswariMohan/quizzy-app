import { Link } from 'react-router-dom';
import { ExternalLink, Mail, MessageCircleQuestion } from 'lucide-react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { PUBLIC_SITE, supportMailtoHref } from '@/config/publicSite';
import { useRedirectIfAuthenticated } from '@/hooks/useRedirectIfAuthenticated';

const FAQ = [
  {
    q: 'How do I get access for my school?',
    a: 'School administrators set up accounts and classes. If your school already uses Quizzy, sign up with your school email address or ask your administrator for an invite.',
  },
  {
    q: 'I forgot my password or cannot sign in',
    a: 'Use the email address tied to your account. For school-managed accounts, your school administrator can reset access. Our platform support team can help with technical issues.',
  },
  {
    q: 'Parents: how do I link to my child?',
    a: 'During sign-up, enter your child’s student email address if they already have an account. You can also ask your school administrator to confirm the link.',
  },
] as const;

export function ContactPage() {
  useRedirectIfAuthenticated();

  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Contact</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">We&apos;re here to help</h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          For product support, billing questions, or partnership inquiries, use the options below.
          For classroom or account questions, your school administrator is often the fastest
          contact.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href={supportMailtoHref()}
            className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition hover:border-primary/30 hover:shadow-lg"
          >
            <Mail className="h-6 w-6 text-primary" aria-hidden />
            <h2 className="mt-4 font-semibold text-ink">Email support</h2>
            <p className="mt-1 text-sm text-muted">We typically respond within one to two business days.</p>
            <span className="mt-3 text-sm font-medium text-primary">{PUBLIC_SITE.supportEmail}</span>
          </a>

          {PUBLIC_SITE.supportUrl ? (
            <a
              href={PUBLIC_SITE.supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition hover:border-primary/30 hover:shadow-lg"
            >
              <ExternalLink className="h-6 w-6 text-primary" aria-hidden />
              <h2 className="mt-4 font-semibold text-ink">Help center</h2>
              <p className="mt-1 text-sm text-muted">Guides, FAQs, and troubleshooting articles.</p>
              <span className="mt-3 text-sm font-medium text-primary">Visit the help center</span>
            </a>
          ) : (
            <div className="flex flex-col rounded-2xl border border-dashed border-gray-200 bg-white/60 p-6">
              <MessageCircleQuestion className="h-6 w-6 text-muted" aria-hidden />
              <h2 className="mt-4 font-semibold text-ink">School administrator</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Class enrollment, grade placement, and account changes are managed by your
                school&apos;s Quizzy administrator.
              </p>
            </div>
          )}
        </div>

        <section className="mt-14">
          <h2 className="text-lg font-semibold text-ink">Frequently asked questions</h2>
          <dl className="mt-6 space-y-6">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-gray-100 bg-white/80 px-5 py-4">
                <dt className="font-medium text-ink">{q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted">{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-10 text-sm text-muted">
          <Link to="/" className="font-medium text-primary hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </PublicLayout>
  );
}
