import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { PUBLIC_SITE, supportMailtoHref } from '@/config/publicSite';
import { PublicBrand } from '@/components/layout/PublicBrand';

function LegalLink({
  href,
  label,
  fallbackTo,
}: {
  href: string | undefined;
  label: string;
  fallbackTo: string;
}) {
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-primary"
      >
        {label}
      </a>
    );
  }
  return (
    <Link to={fallbackTo} className="hover:text-primary">
      {label}
    </Link>
  );
}

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200/80 bg-white/60 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <PublicBrand showTagline />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              {PUBLIC_SITE.description}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink">Product</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <Link to="/#features" className="hover:text-primary">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/#demo" className="hover:text-primary">
                  Watch demo
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary">
                  About us
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-primary">
                  Sign up
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink">Support</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <Link to="/contact" className="hover:text-primary">
                  Contact
                </Link>
              </li>
              <li>
                <a href={supportMailtoHref()} className="inline-flex items-center gap-1.5 hover:text-primary">
                  <Mail className="h-3.5 w-3.5" aria-hidden />
                  {PUBLIC_SITE.supportEmail}
                </a>
              </li>
              {PUBLIC_SITE.supportUrl && (
                <li>
                  <a
                    href={PUBLIC_SITE.supportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    Help center
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink">Legal</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <LegalLink href={PUBLIC_SITE.termsUrl} label="Terms of service" fallbackTo="/about#terms" />
              </li>
              <li>
                <LegalLink href={PUBLIC_SITE.privacyUrl} label="Privacy policy" fallbackTo="/about#privacy" />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-200/80 pt-8 text-center text-xs text-muted sm:flex-row sm:text-left">
          <p>
            © {year} {PUBLIC_SITE.productName}. All rights reserved.
          </p>
          <p>Built for schools with secure, tenant-isolated data.</p>
        </div>
      </div>
    </footer>
  );
}
