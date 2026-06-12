export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function defaultEngagementDateRange(days = 30): { dateFrom: string; dateTo: string } {
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);
  return { dateFrom: toIsoDate(dateFrom), dateTo: toIsoDate(dateTo) };
}
