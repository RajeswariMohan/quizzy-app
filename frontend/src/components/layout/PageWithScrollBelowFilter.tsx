import { cn } from '@/lib/cn';
import type { HTMLAttributes, ReactNode } from 'react';

export interface PageWithScrollBelowFilterProps extends HTMLAttributes<HTMLDivElement> {
  /** Page title, description, and top actions */
  header: ReactNode;
  /** Filters that apply to all content in the scroll region below */
  filter?: ReactNode;
  children: ReactNode;
}

/**
 * Fixed header + optional filter strip; only `children` scroll.
 * Fits inside DashboardLayout's scrollable `<main>` (cancels main padding via negative margin).
 */
export function PageWithScrollBelowFilter({
  header,
  filter,
  children,
  className,
  ...props
}: PageWithScrollBelowFilterProps) {
  return (
    <div
      className={cn(
        '-m-4 flex h-[calc(100dvh-7.25rem)] flex-col overflow-hidden md:-m-6 lg:h-[calc(100dvh-4.25rem)]',
        className,
      )}
      {...props}
    >
      <div className="shrink-0 space-y-4 border-b border-gray-200 bg-surface px-4 pb-4 pt-0 md:px-6">
        {header}
        {filter}
      </div>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        {children}
      </div>
    </div>
  );
}
