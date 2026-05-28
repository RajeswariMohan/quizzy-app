import { useEffect, useMemo, useState } from 'react';
import {
  computeClientPagination,
  DEFAULT_TABLE_PAGE_SIZE,
} from '@/utils/clientPagination';

export { DEFAULT_TABLE_PAGE_SIZE };
export const TABLE_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export interface UseClientPaginationOptions {
  initialPageSize?: number;
  /** When this changes, pagination resets to page 1 (e.g. filter signature). */
  resetKey?: string | number;
}

export function useClientPagination<T>(
  items: T[],
  options: UseClientPaginationOptions = {},
) {
  const { initialPageSize = DEFAULT_TABLE_PAGE_SIZE, resetKey = '' } = options;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  const computed = useMemo(
    () => computeClientPagination(items, page, pageSize),
    [items, page, pageSize],
  );

  useEffect(() => {
    if (page > computed.totalPages) {
      setPage(computed.totalPages);
    }
  }, [page, computed.totalPages]);

  return {
    page: computed.safePage,
    setPage,
    pageSize,
    setPageSize,
    totalItems: computed.totalItems,
    totalPages: computed.totalPages,
    pageItems: computed.pageItems,
    rangeStart: computed.rangeStart,
    rangeEnd: computed.rangeEnd,
    showPagination: computed.showPagination,
  };
}
