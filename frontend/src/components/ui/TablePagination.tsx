import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TABLE_PAGE_SIZE_OPTIONS } from '@/hooks/useClientPagination';

export interface TablePaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: readonly number[];
  className?: string;
}

export function TablePagination({
  page,
  totalPages,
  pageSize,
  totalItems,
  rangeStart,
  rangeEnd,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = TABLE_PAGE_SIZE_OPTIONS,
  className = '',
}: TablePaginationProps) {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-4 py-3 ${className}`}
    >
      <p className="text-sm text-muted">
        {totalItems === 0 ? (
          'No rows'
        ) : (
          <>
            Showing <span className="font-medium text-ink">{rangeStart}</span>–
            <span className="font-medium text-ink">{rangeEnd}</span> of{' '}
            <span className="font-medium text-ink">{totalItems}</span>
          </>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          Rows per page
          <select
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-ink"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[5rem] px-2 text-center text-sm text-muted">
            Page <span className="font-medium text-ink">{page}</span> of{' '}
            <span className="font-medium text-ink">{totalPages}</span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
