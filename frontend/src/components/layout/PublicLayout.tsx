import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { WatchDemoButton } from '@/components/landing/WatchDemoButton';
import { PublicBrand } from '@/components/layout/PublicBrand';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { cn } from '@/lib/cn';

const NAV_LINKS = [
  { to: '/#features', label: 'Features' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
] as const;

interface PublicLayoutProps {
  children: ReactNode;
  /** Centered narrow column for auth forms */
  narrow?: boolean;
  /** Hide marketing nav (e.g. minimal dev login) */
  minimalHeader?: boolean;
}

export function PublicLayout({ children, narrow = false, minimalHeader = false }: PublicLayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-primary/[0.08] via-white to-secondary/[0.06]">
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      {!minimalHeader && (
        <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <PublicBrand />

            <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
              {NAV_LINKS.map(({ to, label }) => {
                const isAbout = to === '/about' && pathname === '/about';
                const isContact = to === '/contact' && pathname === '/contact';
                const isHomeSection = to.startsWith('/#') && pathname === '/';
                const active = isAbout || isContact || isHomeSection;

                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      'text-sm font-medium transition',
                      active ? 'text-primary' : 'text-muted hover:text-ink',
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <WatchDemoButton variant="header" className="hidden sm:inline-flex" />
              <Button
                size="sm"
                variant="outline"
                className="hidden border-gray-200 sm:inline-flex"
                onClick={() => navigate('/login')}
              >
                Sign in
              </Button>
              <Button size="sm" className="shadow-sm" onClick={() => navigate('/signup')}>
                Sign up
              </Button>
            </div>
          </div>
        </header>
      )}

      <main
        className={cn(
          'flex-1',
          narrow ? 'mx-auto w-full max-w-md px-5 py-8 sm:py-10' : 'w-full',
        )}
      >
        {children}
      </main>

      {!minimalHeader && <PublicFooter />}
    </div>
  );
}
