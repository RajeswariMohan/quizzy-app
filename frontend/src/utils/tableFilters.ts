/** Case-insensitive match against any of the given string fields. */
export function matchesTableSearch(
  search: string,
  fields: Array<string | null | undefined>,
): boolean {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return fields.some((field) => (field ?? '').toLowerCase().includes(term));
}
