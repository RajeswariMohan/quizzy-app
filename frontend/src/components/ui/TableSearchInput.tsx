import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface TableSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  id?: string;
  compact?: boolean;
}

export function TableSearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  className,
  id = 'table-search',
  compact = false,
}: TableSearchInputProps) {
  return (
    <div className={cn(compact ? 'min-w-[160px] flex-[2]' : 'min-w-[200px] flex-1', className)}>
      <label
        htmlFor={id}
        className={
          compact
            ? 'mb-0.5 block text-xs font-medium text-muted'
            : 'mb-1 block text-sm font-medium text-ink'
        }
      >
        {label}
      </label>
      <div className="relative">
        <Search
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-muted',
            compact ? 'left-2.5 h-3.5 w-3.5' : 'left-3 h-4 w-4',
          )}
        />
        <input
          id={id}
          type="search"
          placeholder={placeholder}
          className={
            compact
              ? 'w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
              : 'w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:bg-gray-100 hover:text-ink"
            onClick={() => onChange('')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
