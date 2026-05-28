import { cn } from '@/lib/cn';
import type { HTMLAttributes } from 'react';

/** White card panel for page-level filter controls (used inside fixed header zone). */
export function FilterPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-gray-100 bg-white p-4 shadow-card', className)}
      {...props}
    />
  );
}
