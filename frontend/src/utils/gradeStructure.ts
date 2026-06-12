/** How a grade row is grouped in the school structure UI. */
export type GradeKind = 'early_years' | 'standard' | 'senior_secondary';

/** Separator for senior secondary department + section enrollment values (e.g. Science · A). */
export const SENIOR_COMPOSITE_SEP = ' · ';

const EARLY_YEARS_PATTERN =
  /toddler|preschool|pre-school|nursery|playgroup|play\s*group|pre-kg|prekg|lkg|ukg|kindergarten|kg/i;

const SENIOR_SECONDARY_PATTERN =
  /class\s*(11|xi{1,2}|12|xii)\b|grade\s*(11|12)\b|\b11th\b|\b12th\b|\bxi\b|\bxii\b|std\.?\s*(11|12|xi{1,2}|xii)/i;

export function inferGradeKind(grade: string): GradeKind {
  const label = grade.trim();
  if (!label) return 'standard';
  if (EARLY_YEARS_PATTERN.test(label)) return 'early_years';
  if (SENIOR_SECONDARY_PATTERN.test(label)) return 'senior_secondary';
  return 'standard';
}

/** User-facing label for the grouping under a grade (stored in gradeSections). */
export function childGroupLabel(_kind?: GradeKind): string {
  return 'Section';
}

export function childGroupPlaceholder(kind: GradeKind): string {
  if (kind === 'early_years') return 'e.g. Morning, Tulip, Lily';
  if (kind === 'senior_secondary') return 'e.g. A, B, C';
  return 'e.g. A, B, Tulip';
}

export function childGroupAddLabel(_kind?: GradeKind): string {
  return 'Add section';
}

export function departmentLabel(): string {
  return 'Department';
}

export function departmentAddLabel(): string {
  return 'Add department';
}

export function gradeLevelLabel(): string {
  return 'Grade / level';
}

/** Sections configured for a grade (enrollment & filters). */
export function sectionsForGrade(
  gradeSections: Record<string, string[]>,
  grade: string,
): string[] {
  if (!grade.trim()) return [];
  return gradeSections[grade.trim()] ?? [];
}

/** Normalize a CSV or free-text section value to a stored enrollment option for the grade. */
export function resolveStoredEnrollmentSection(
  grade: string,
  rawSection: string,
  gradeSections: Record<string, string[]>,
): string | null {
  const trimmed = rawSection.trim();
  if (!trimmed || !grade.trim()) return null;

  const flat = sectionsForGrade(gradeSections, grade);
  if (flat.includes(trimmed)) return trimmed;

  if (inferGradeKind(grade) !== 'senior_secondary') return null;

  if (trimmed.includes(SENIOR_COMPOSITE_SEP)) {
    const [department, sectionLetter] = trimmed.split(SENIOR_COMPOSITE_SEP).map((p) => p.trim());
    const resolved = resolveSeniorEnrollmentValue(flat, department ?? '', sectionLetter ?? '');
    return resolved || null;
  }

  const departmentOnly = resolveSeniorEnrollmentValue(flat, trimmed, '');
  return departmentOnly || null;
}

export const EARLY_YEARS_GRADE_PRESET: Record<string, string[]> = {
  Toddler: ['Main'],
  'Junior Toddler': ['Main'],
  'Senior Toddler': ['Main'],
  Preschool: ['Main'],
};

export const SENIOR_SECONDARY_GRADE_PRESET: Record<string, string[]> = {
  'Class 11': ['Science', 'Commerce', 'Arts', 'Humanities'],
  'Class 12': ['Science', 'Commerce', 'Arts', 'Humanities'],
};

export const SENIOR_SECONDARY_DEPARTMENT_SUGGESTIONS = [
  'Science',
  'Commerce',
  'Arts',
  'Humanities',
] as const;

/** Default sections when a new grade level is created. */
export function defaultSectionsForGrade(grade: string): string[] {
  const kind = inferGradeKind(grade);
  if (kind === 'senior_secondary') return [...SENIOR_SECONDARY_DEPARTMENT_SUGGESTIONS];
  if (kind === 'early_years') return ['Main'];
  return ['A'];
}

/** True when sections look like legacy single-letter rows (A, B, C…). */
export function hasLegacyLetterSections(sections: string[]): boolean {
  if (sections.length === 0) return false;
  return sections.every((s) => /^[A-E]$/i.test(s.trim()));
}

/** Add standard departments without removing custom entries. */
export function mergeDepartmentSuggestions(departments: string[]): string[] {
  const next = [...departments];
  for (const dept of SENIOR_SECONDARY_DEPARTMENT_SUGGESTIONS) {
    if (!next.some((s) => s.toLowerCase() === dept.toLowerCase())) {
      next.push(dept);
    }
  }
  return next;
}

/** Merge preset grades without overwriting existing keys. */
export function mergeGradePresets(
  current: Record<string, string[]>,
  preset: Record<string, string[]>,
): Record<string, string[]> {
  const next = { ...current };
  for (const [grade, sections] of Object.entries(preset)) {
    if (!next[grade]) {
      next[grade] = [...sections];
    }
  }
  return next;
}

function normalizeList(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const t = v.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

/** Build flat enrollment options for Class 11/12 from departments and optional section letters. */
export function expandSeniorEnrollmentOptions(
  departments: string[],
  sectionLetters: string[],
): string[] {
  const depts = normalizeList(departments);
  const secs = normalizeList(sectionLetters);
  if (depts.length === 0) return [];
  if (secs.length === 0) return depts;
  return depts.flatMap((dept) =>
    secs.map((sec) => `${dept}${SENIOR_COMPOSITE_SEP}${sec}`),
  );
}

/** Split stored flat list back into department + section letter lists for editing. */
export function parseSeniorEnrollmentOptions(flat: string[]): {
  departments: string[];
  sectionLetters: string[];
} {
  const normalized = normalizeList(flat);
  if (normalized.length === 0) {
    return { departments: [], sectionLetters: [] };
  }

  const hasComposite = normalized.some((e) => e.includes(SENIOR_COMPOSITE_SEP));
  if (hasComposite) {
    const departments = new Set<string>();
    const sectionLetters = new Set<string>();
    for (const entry of normalized) {
      if (entry.includes(SENIOR_COMPOSITE_SEP)) {
        const [dept, sec] = entry.split(SENIOR_COMPOSITE_SEP).map((p) => p.trim());
        if (dept) departments.add(dept);
        if (sec) sectionLetters.add(sec);
      } else {
        departments.add(entry);
      }
    }
    return {
      departments: [...departments],
      sectionLetters: [...sectionLetters],
    };
  }

  if (hasLegacyLetterSections(normalized)) {
    return { departments: [], sectionLetters: normalized };
  }

  return { departments: normalized, sectionLetters: [] };
}

export function seniorStructureHint(kind: GradeKind): string {
  if (kind === 'early_years') {
    return 'Add sections or groups for this level (e.g. Morning, Tulip).';
  }
  if (kind === 'senior_secondary') {
    return 'Add departments (streams) and optional section letters. Students pick a department, or department + section when both are set.';
  }
  return 'Add section names for this grade (e.g. A, B, Tulip).';
}

export type SeniorEnrollmentUiMode =
  | 'department_only'
  | 'department_and_section'
  | 'legacy_section_list';

/** How Class 11/12 enrollment options from school academics should render at signup. */
export function seniorEnrollmentUiModel(flat: string[]): {
  mode: SeniorEnrollmentUiMode;
  departments: string[];
  sectionLetters: string[];
  enrollmentOptions: string[];
} {
  const enrollmentOptions = normalizeList(flat);
  if (enrollmentOptions.length === 0) {
    return {
      mode: 'legacy_section_list',
      departments: [],
      sectionLetters: [],
      enrollmentOptions,
    };
  }

  const parsed = parseSeniorEnrollmentOptions(enrollmentOptions);
  const hasComposite = enrollmentOptions.some((e) => e.includes(SENIOR_COMPOSITE_SEP));

  if (hasComposite || parsed.sectionLetters.length > 0) {
    return {
      mode: 'department_and_section',
      departments: parsed.departments,
      sectionLetters: parsed.sectionLetters,
      enrollmentOptions,
    };
  }

  if (parsed.departments.length > 0) {
    return {
      mode: 'department_only',
      departments: parsed.departments,
      sectionLetters: [],
      enrollmentOptions,
    };
  }

  return {
    mode: 'legacy_section_list',
    departments: [],
    sectionLetters: [],
    enrollmentOptions,
  };
}

/** Stored student section value for Class 11/12 (must match school-configured options). */
export function resolveSeniorEnrollmentValue(
  flat: string[],
  department: string,
  sectionLetter: string,
): string {
  const model = seniorEnrollmentUiModel(flat);
  const dept = department.trim();
  const letter = sectionLetter.trim();

  if (model.mode === 'department_and_section') {
    if (!dept || !letter) return '';
    const composite = `${dept}${SENIOR_COMPOSITE_SEP}${letter}`;
    return model.enrollmentOptions.includes(composite) ? composite : '';
  }

  if (model.mode === 'department_only') {
    return dept && model.enrollmentOptions.includes(dept) ? dept : '';
  }

  return '';
}

export const FILTER_ALL = 'All';

export interface AcademicGroupFilterValues {
  department: string;
  sectionLetter: string;
  group: string;
}

export const DEFAULT_ACADEMIC_GROUP_FILTER: AcademicGroupFilterValues = {
  department: FILTER_ALL,
  sectionLetter: FILTER_ALL,
  group: FILTER_ALL,
};

export type AcademicGroupFilterMode =
  | 'none'
  | 'standard'
  | 'department_only'
  | 'department_and_section'
  | 'legacy_section_list';

/** Filter UI model for a selected grade (or none when grade is All / empty). */
export function academicGroupFilterModel(
  grade: string,
  gradeSections: Record<string, string[]>,
): {
  kind: GradeKind;
  mode: AcademicGroupFilterMode;
  flatOptions: string[];
  departments: string[];
  sectionLetters: string[];
} {
  if (!grade.trim() || grade === FILTER_ALL) {
    return {
      kind: 'standard',
      mode: 'none',
      flatOptions: [],
      departments: [],
      sectionLetters: [],
    };
  }

  const kind = inferGradeKind(grade);
  const flatOptions = sectionsForGrade(gradeSections, grade);

  if (kind !== 'senior_secondary') {
    return {
      kind,
      mode: 'standard',
      flatOptions,
      departments: [],
      sectionLetters: [],
    };
  }

  const seniorUi = seniorEnrollmentUiModel(flatOptions);
  if (seniorUi.mode === 'department_only') {
    return {
      kind,
      mode: 'department_only',
      flatOptions,
      departments: seniorUi.departments,
      sectionLetters: [],
    };
  }
  if (seniorUi.mode === 'department_and_section') {
    return {
      kind,
      mode: 'department_and_section',
      flatOptions,
      departments: seniorUi.departments,
      sectionLetters: seniorUi.sectionLetters,
    };
  }

  return {
    kind,
    mode: 'legacy_section_list',
    flatOptions,
    departments: [],
    sectionLetters: [],
  };
}

/** API / query section value from filter fields; undefined means no section filter. */
export function resolveFilterSectionValue(params: {
  grade: string;
  gradeSections: Record<string, string[]>;
  department?: string;
  sectionLetter?: string;
  group?: string;
}): string | undefined {
  const {
    grade,
    gradeSections,
    department = FILTER_ALL,
    sectionLetter = FILTER_ALL,
    group = FILTER_ALL,
  } = params;

  if (!grade.trim() || grade === FILTER_ALL) return undefined;

  const model = academicGroupFilterModel(grade, gradeSections);

  if (model.mode === 'department_only') {
    if (department === FILTER_ALL) return undefined;
    return department.trim() || undefined;
  }

  if (model.mode === 'department_and_section') {
    if (department === FILTER_ALL) return undefined;
    if (sectionLetter !== FILTER_ALL && sectionLetter.trim()) {
      const flat = sectionsForGrade(gradeSections, grade);
      const resolved = resolveSeniorEnrollmentValue(flat, department, sectionLetter);
      return resolved || undefined;
    }
    return department.trim() || undefined;
  }

  if (group === FILTER_ALL || !group.trim()) return undefined;
  return group.trim();
}

/** Match stored user.section against filter (supports senior department prefix). */
export function sectionMatchesFilter(
  storedSection: string | null | undefined,
  filterSection: string | undefined,
  grade: string,
): boolean {
  if (!filterSection?.trim()) return true;
  const stored = storedSection?.trim() ?? '';
  if (!stored) return false;
  const filter = filterSection.trim();

  if (
    inferGradeKind(grade) === 'senior_secondary' &&
    !filter.includes(SENIOR_COMPOSITE_SEP)
  ) {
    return stored === filter || stored.startsWith(`${filter}${SENIOR_COMPOSITE_SEP}`);
  }

  return stored === filter;
}

function quizAcademicHaystack(
  className: string | null | undefined,
  gradeLabel: string | null,
  sectionLabel: string | null,
): string {
  return [className, gradeLabel, sectionLabel].filter(Boolean).join(' ').toLowerCase();
}

/** Client-side quiz list match for grade + department/section filters. */
export function quizMatchesAcademicGroup(
  quiz: {
    grade?: string | null;
    className?: string | null;
    audienceTargets?: { grade: string; section?: string }[];
  },
  params: {
    grade: string;
    gradeSections: Record<string, string[]>;
    department?: string;
    sectionLetter?: string;
    group?: string;
  },
  resolveGrade: (q: typeof quiz) => string | null,
  resolveSection: (q: typeof quiz) => string | null,
): boolean {
  const { grade, gradeSections, department, sectionLetter, group } = params;

  if (grade !== FILTER_ALL && grade.trim()) {
    const label = resolveGrade(quiz);
    if (label !== grade && quiz.grade !== grade) return false;
  }

  const filterSection = resolveFilterSectionValue({
    grade: grade === FILTER_ALL ? '' : grade,
    gradeSections,
    department,
    sectionLetter,
    group,
  });

  if (!filterSection) return true;

  const sectionLabel = resolveSection(quiz);
  const haystack = quizAcademicHaystack(quiz.className, resolveGrade(quiz), sectionLabel);

  if (haystack.includes(filterSection.toLowerCase())) return true;

  if (
    inferGradeKind(grade) === 'senior_secondary' &&
    !filterSection.includes(SENIOR_COMPOSITE_SEP)
  ) {
    const prefix = `${filterSection}${SENIOR_COMPOSITE_SEP}`.toLowerCase();
    if (haystack.includes(prefix)) return true;
    if (quiz.audienceTargets?.some((t) => sectionMatchesFilter(t.section, filterSection, grade))) {
      return true;
    }
  }

  if (quiz.audienceTargets?.some((t) => t.section === filterSection)) return true;

  return false;
}

/** Parse stored section into department + letter for filter prefill. */
export function parseStoredSectionForFilters(
  grade: string,
  gradeSections: Record<string, string[]>,
  storedSection: string | null | undefined,
): { department: string; sectionLetter: string; group: string } {
  const empty = { department: FILTER_ALL, sectionLetter: FILTER_ALL, group: FILTER_ALL };
  const stored = storedSection?.trim();
  if (!stored || !grade.trim()) return empty;

  const model = academicGroupFilterModel(grade, gradeSections);
  if (model.mode === 'standard' || model.mode === 'legacy_section_list') {
    return { ...empty, group: stored };
  }

  if (stored.includes(SENIOR_COMPOSITE_SEP)) {
    const [dept, letter] = stored.split(SENIOR_COMPOSITE_SEP).map((p) => p.trim());
    return {
      department: dept || FILTER_ALL,
      sectionLetter: letter || FILTER_ALL,
      group: FILTER_ALL,
    };
  }

  return { department: stored, sectionLetter: FILTER_ALL, group: FILTER_ALL };
}

/** Limit school gradeSections to sections teachers published for a grade. */
export function publishedSectionsGradeSections(
  sectionsByGrade: Record<string, string[]>,
  grade: string,
  fullGradeSections: Record<string, string[]>,
): Record<string, string[]> {
  const g = grade.trim();
  if (!g) return {};
  const published = sectionsByGrade[g] ?? [];
  if (published.length === 0) return { [g]: [] };
  const configured = fullGradeSections[g] ?? [];
  const list =
    configured.length > 0
      ? published.filter((s) => configured.includes(s))
      : published;
  return { [g]: list };
}

export function buildStudentAudienceQueryParams(
  grade: string,
  gradeSections: Record<string, string[]>,
  academic: AcademicGroupFilterValues,
  scope: 'class' | 'section',
): { grade: string; scope: 'class' | 'section'; section?: string } {
  const section = resolveFilterSectionValue({
    grade,
    gradeSections,
    ...academic,
  });
  if (scope === 'section' && section) {
    return { grade: grade.trim(), scope: 'section', section };
  }
  return { grade: grade.trim(), scope: 'class' };
}

/** Quiz list: section filter when a specific group is selected, otherwise whole grade. */
export function buildStudentQuizzesQueryParams(
  grade: string,
  gradeSections: Record<string, string[]>,
  academic: AcademicGroupFilterValues,
): { grade: string; scope: 'class' | 'section'; section?: string } {
  const section = resolveFilterSectionValue({ grade, gradeSections, ...academic });
  if (section) {
    return { grade: grade.trim(), scope: 'section', section };
  }
  return { grade: grade.trim(), scope: 'class' };
}

export function formatStudentAudienceFilterLabel(
  grade: string,
  gradeSections: Record<string, string[]>,
  academic: AcademicGroupFilterValues,
  scope: 'class' | 'section',
): string {
  if (scope === 'class' || !grade.trim()) {
    return grade.trim();
  }
  const section = resolveFilterSectionValue({
    grade,
    gradeSections,
    ...academic,
  });
  if (!section) return grade.trim();
  if (inferGradeKind(grade) === 'senior_secondary' && section.includes(SENIOR_COMPOSITE_SEP)) {
    return `${grade} · ${section}`;
  }
  return `${grade} · Section ${section}`;
}
