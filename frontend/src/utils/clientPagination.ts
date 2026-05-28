export const DEFAULT_TABLE_PAGE_SIZE = 10;

export interface ClientPaginationState<T> {
  totalItems: number;
  totalPages: number;
  safePage: number;
  pageItems: T[];
  rangeStart: number;
  rangeEnd: number;
  showPagination: boolean;
}

/** Pure pagination math used by useClientPagination (testable without React). */
export function computeClientPagination<T>(
  items: T[],
  page: number,
  pageSize: number,
): ClientPaginationState<T> {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  const rangeStart = totalItems === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalItems);
  const showPagination = totalItems > DEFAULT_TABLE_PAGE_SIZE || totalPages > 1;

  return {
    totalItems,
    totalPages,
    safePage,
    pageItems,
    rangeStart,
    rangeEnd,
    showPagination,
  };
}
