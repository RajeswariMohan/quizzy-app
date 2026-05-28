import { describe, expect, it } from 'vitest';
import {
  computeClientPagination,
  DEFAULT_TABLE_PAGE_SIZE,
} from '@/utils/clientPagination';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `item-${i + 1}`);

describe('computeClientPagination', () => {
  it('returns empty page items and zero range when list is empty', () => {
    const result = computeClientPagination([], 1, 10);
    expect(result.pageItems).toEqual([]);
    expect(result.rangeStart).toBe(0);
    expect(result.rangeEnd).toBe(0);
    expect(result.totalItems).toBe(0);
    expect(result.showPagination).toBe(false);
  });

  it('returns first page slice (happy path)', () => {
    const items = ids(25);
    const result = computeClientPagination(items, 1, 10);
    expect(result.pageItems).toHaveLength(10);
    expect(result.pageItems[0]).toBe('item-1');
    expect(result.pageItems[9]).toBe('item-10');
    expect(result.rangeStart).toBe(1);
    expect(result.rangeEnd).toBe(10);
    expect(result.totalPages).toBe(3);
    expect(result.showPagination).toBe(true);
  });

  it('returns last partial page', () => {
    const items = ids(25);
    const result = computeClientPagination(items, 3, 10);
    expect(result.pageItems).toHaveLength(5);
    expect(result.pageItems[0]).toBe('item-21');
    expect(result.rangeEnd).toBe(25);
  });

  it('clamps page below 1 to page 1', () => {
    const items = ids(15);
    const result = computeClientPagination(items, 0, 10);
    expect(result.safePage).toBe(1);
    expect(result.pageItems[0]).toBe('item-1');
  });

  it('clamps page above totalPages to last page', () => {
    const items = ids(15);
    const result = computeClientPagination(items, 99, 10);
    expect(result.safePage).toBe(2);
    expect(result.pageItems).toHaveLength(5);
  });

  it('does not show pagination when items fit one page (≤10)', () => {
    const result = computeClientPagination(ids(10), 1, 10);
    expect(result.showPagination).toBe(false);
    expect(result.totalPages).toBe(1);
  });

  it('shows pagination when more than default page size', () => {
    const result = computeClientPagination(ids(11), 1, 10);
    expect(result.showPagination).toBe(true);
  });

  it('supports custom page size', () => {
    const result = computeClientPagination(ids(30), 2, 25);
    expect(result.pageItems).toHaveLength(5);
    expect(result.safePage).toBe(2);
  });

  it('uses DEFAULT_TABLE_PAGE_SIZE constant of 10', () => {
    expect(DEFAULT_TABLE_PAGE_SIZE).toBe(10);
  });
});
