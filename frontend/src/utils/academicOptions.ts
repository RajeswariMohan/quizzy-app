/** Merge school-configured options with values already present in data (e.g. legacy quizzes). */
export function mergeAcademicOptions(configured: string[], fromData: string[]): string[] {
  return [...new Set([...configured, ...fromData])].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
}
