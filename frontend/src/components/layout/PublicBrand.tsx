import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { PUBLIC_SITE } from '@/config/publicSite';
import { cn } from '@/lib/cn';

interface PublicBrandProps {
  className?: string;
  showTagline?: boolean;
}

export function PublicBrand({ className, showTagline = false }: PublicBrandProps) {
  return (
    <Link
      to="/"
      className={cn('inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40', className)}
      aria-label={`${PUBLIC_SITE.productName} home`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25">
        <GraduationCap className="h-5 w-5" aria-hidden />
      </span>
      <span className="flex flex-col">
        <span className="text-lg font-bold tracking-tight text-ink">{PUBLIC_SITE.productName}</span>
        {showTagline && (
          <span className="text-xs font-medium text-primary">{PUBLIC_SITE.tagline}</span>
        )}
      </span>
    </Link>
  );
}
