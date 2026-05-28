import { FilterPanel } from '@/components/layout/FilterPanel';
import type { HTMLAttributes, ReactNode } from 'react';

/** @deprecated Use `PageWithScrollBelowFilter` + `FilterPanel` instead. */
export interface StickyPageFilterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'card' | 'shell';
}

/** @deprecated Use `PageWithScrollBelowFilter` + `FilterPanel` instead. */
export function StickyPageFilter({ children, variant = 'card', ...props }: StickyPageFilterProps) {
  if (variant === 'shell') {
    return <div {...props}>{children}</div>;
  }
  return <FilterPanel {...props}>{children}</FilterPanel>;
}
