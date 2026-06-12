import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, X } from 'lucide-react';
import { PageWithScrollBelowFilter } from '@/components/layout/PageWithScrollBelowFilter';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { BulkAcademicsUpload } from '@/components/school-admin/BulkAcademicsUpload';
import {
  fetchSchoolAcademicConfig,
  updateSchoolAcademicConfig,
  type SchoolAcademicConfig,
} from '@/api/schoolAdmin.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { useSchoolAcademicsStore } from '@/store/schoolAcademicsStore';
import {
  childGroupAddLabel,
  childGroupLabel,
  childGroupPlaceholder,
  defaultSectionsForGrade,
  departmentAddLabel,
  departmentLabel,
  expandSeniorEnrollmentOptions,
  EARLY_YEARS_GRADE_PRESET,
  inferGradeKind,
  mergeDepartmentSuggestions,
  mergeGradePresets,
  parseSeniorEnrollmentOptions,
  SENIOR_SECONDARY_DEPARTMENT_SUGGESTIONS,
  SENIOR_SECONDARY_GRADE_PRESET,
  seniorStructureHint,
  SENIOR_COMPOSITE_SEP,
  type GradeKind,
} from '@/utils/gradeStructure';

const GRADE_KIND_BADGE: Record<GradeKind, string> = {
  early_years: 'Early years',
  standard: 'Standard',
  senior_secondary: 'Senior secondary',
};

function ChipList({
  items,
  onRemove,
  onRename,
  emptyText,
}: {
  items: string[];
  onRemove: (item: string) => void;
  onRename?: (oldName: string, newName: string) => void;
  emptyText: string;
}) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const startRename = (item: string) => {
    setRenaming(item);
    setRenameDraft(item);
  };

  const commitRename = () => {
    if (!renaming || !onRename) {
      setRenaming(null);
      return;
    }
    const next = renameDraft.trim();
    if (next && next !== renaming) onRename(renaming, next);
    setRenaming(null);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        if (renaming === item) {
          return (
            <div
              key={item}
              className="inline-flex flex-wrap items-center gap-1 rounded-full border border-primary/30 bg-white py-1 pl-2 pr-1"
            >
              <input
                className="w-28 rounded-md border border-gray-200 px-2 py-0.5 text-sm"
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitRename();
                  }
                  if (e.key === 'Escape') setRenaming(null);
                }}
                autoFocus
              />
              <button
                type="button"
                className="rounded-md px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/10"
                onClick={commitRename}
              >
                Save
              </button>
              <button
                type="button"
                className="rounded-md px-2 py-0.5 text-xs text-muted hover:bg-gray-100"
                onClick={() => setRenaming(null)}
              >
                Cancel
              </button>
            </div>
          );
        }

        return (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
          >
            {item}
            {onRename && (
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-primary/20"
                aria-label={`Rename ${item}`}
                onClick={() => startRename(item)}
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-primary/20"
              aria-label={`Remove ${item}`}
              onClick={() => onRemove(item)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        );
      })}
      {items.length === 0 && <span className="text-xs text-muted">{emptyText}</span>}
    </div>
  );
}

function AddRow({
  placeholder,
  addLabel,
  value,
  onChange,
  onAdd,
  ariaLabel,
}: {
  placeholder: string;
  addLabel: string;
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <input
        className="min-w-[140px] flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onAdd();
          }
        }}
      />
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}

function SeniorGradeEditor({
  grade,
  flatSections,
  onFlatChange,
}: {
  grade: string;
  flatSections: string[];
  onFlatChange: (next: string[]) => void;
}) {
  const parsed = parseSeniorEnrollmentOptions(flatSections);
  const [deptDraft, setDeptDraft] = useState('');
  const [sectionDraft, setSectionDraft] = useState('');

  const sync = (departments: string[], sectionLetters: string[]) => {
    onFlatChange(expandSeniorEnrollmentOptions(departments, sectionLetters));
  };

  const addDepartment = () => {
    const label = deptDraft.trim();
    if (!label) return;
    if (parsed.departments.some((d) => d.toLowerCase() === label.toLowerCase())) return;
    sync([...parsed.departments, label], parsed.sectionLetters);
    setDeptDraft('');
  };

  const addSectionLetter = () => {
    const label = sectionDraft.trim();
    if (!label) return;
    if (parsed.sectionLetters.some((s) => s.toLowerCase() === label.toLowerCase())) return;
    sync(parsed.departments, [...parsed.sectionLetters, label]);
    setSectionDraft('');
  };

  const missingDepartments = SENIOR_SECONDARY_DEPARTMENT_SUGGESTIONS.filter(
    (d) => !parsed.departments.some((x) => x.toLowerCase() === d.toLowerCase()),
  );

  const enrollmentPreview = expandSeniorEnrollmentOptions(
    parsed.departments,
    parsed.sectionLetters,
  );

  return (
    <div className="mt-3 space-y-4">
      <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
        <p className="text-xs font-medium text-ink">{departmentLabel()}s (streams)</p>
        <p className="mt-0.5 text-xs text-muted">
          e.g. Science, Commerce, Arts — required for Class 11 &amp; 12.
        </p>
        <div className="mt-2">
          <ChipList
            items={parsed.departments}
            emptyText={`No ${departmentLabel().toLowerCase()}s yet.`}
            onRemove={(d) =>
              sync(
                parsed.departments.filter((x) => x !== d),
                parsed.sectionLetters,
              )
            }
            onRename={(oldName, newName) =>
              sync(
                parsed.departments.map((x) => (x === oldName ? newName : x)),
                parsed.sectionLetters,
              )
            }
          />
        </div>
        {missingDepartments.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Quick add:</span>
            {missingDepartments.map((dept) => (
              <button
                key={dept}
                type="button"
                className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-ink hover:border-primary hover:text-primary"
                onClick={() => sync([...parsed.departments, dept], parsed.sectionLetters)}
              >
                + {dept}
              </button>
            ))}
          </div>
        )}
        <div className="mt-3">
          <AddRow
            placeholder="e.g. Science, Commerce"
            addLabel={departmentAddLabel()}
            value={deptDraft}
            onChange={setDeptDraft}
            onAdd={addDepartment}
            ariaLabel={`New ${departmentLabel().toLowerCase()} for ${grade}`}
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
        <p className="text-xs font-medium text-ink">{childGroupLabel()} letters (optional)</p>
        <p className="mt-0.5 text-xs text-muted">
          e.g. A, B, C — when set, students choose {departmentLabel().toLowerCase()}
          {SENIOR_COMPOSITE_SEP}section (Science{SENIOR_COMPOSITE_SEP}A).
        </p>
        <div className="mt-2">
          <ChipList
            items={parsed.sectionLetters}
            emptyText="No section letters — students pick a department only."
            onRemove={(s) =>
              sync(
                parsed.departments,
                parsed.sectionLetters.filter((x) => x !== s),
              )
            }
            onRename={(oldName, newName) =>
              sync(
                parsed.departments,
                parsed.sectionLetters.map((x) => (x === oldName ? newName : x)),
              )
            }
          />
        </div>
        <div className="mt-3">
          <AddRow
            placeholder={childGroupPlaceholder('senior_secondary')}
            addLabel={childGroupAddLabel()}
            value={sectionDraft}
            onChange={setSectionDraft}
            onAdd={addSectionLetter}
            ariaLabel={`New section letter for ${grade}`}
          />
        </div>
      </div>

      {enrollmentPreview.length > 0 && (
        <div className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-ink">
          <p className="font-medium">Student signup &amp; filters will offer:</p>
          <p className="mt-1 text-muted">{enrollmentPreview.join(', ')}</p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => sync(mergeDepartmentSuggestions(parsed.departments), parsed.sectionLetters)}
      >
        Add standard departments
      </Button>
    </div>
  );
}

function StandardGradeSectionsEditor({
  grade,
  sections,
  kind,
  onChange,
}: {
  grade: string;
  sections: string[];
  kind: GradeKind;
  onChange: (sections: string[]) => void;
}) {
  const [sectionDraft, setSectionDraft] = useState('');

  const addSection = () => {
    const label = sectionDraft.trim();
    if (!label) return;
    if (sections.some((s) => s.toLowerCase() === label.toLowerCase())) return;
    onChange([...sections, label]);
    setSectionDraft('');
  };

  return (
    <div className="mt-3 space-y-3">
      <ChipList
        items={sections}
        emptyText={`No ${childGroupLabel().toLowerCase()}s yet — add one below.`}
        onRemove={(s) => onChange(sections.filter((x) => x !== s))}
        onRename={(oldName, newName) =>
          onChange(sections.map((x) => (x === oldName ? newName : x)))
        }
      />
      <AddRow
        placeholder={childGroupPlaceholder(kind)}
        addLabel={childGroupAddLabel()}
        value={sectionDraft}
        onChange={setSectionDraft}
        onAdd={addSection}
        ariaLabel={`New ${childGroupLabel().toLowerCase()} for ${grade}`}
      />
    </div>
  );
}

function GradeSectionEditor({
  gradeSections,
  onChange,
}: {
  gradeSections: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
}) {
  const [gradeDraft, setGradeDraft] = useState('');
  const [renamingGrade, setRenamingGrade] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const addGrade = () => {
    const label = gradeDraft.trim();
    if (!label || gradeSections[label]) return;
    onChange({ ...gradeSections, [label]: defaultSectionsForGrade(label) });
    setGradeDraft('');
  };

  const removeGrade = (grade: string) => {
    const next = { ...gradeSections };
    delete next[grade];
    onChange(next);
  };

  const startRename = (grade: string) => {
    setRenamingGrade(grade);
    setRenameDraft(grade);
  };

  const commitRename = () => {
    if (!renamingGrade) return;
    const nextLabel = renameDraft.trim();
    if (!nextLabel || nextLabel === renamingGrade) {
      setRenamingGrade(null);
      return;
    }
    if (gradeSections[nextLabel]) return;
    const sections = gradeSections[renamingGrade] ?? [];
    const next = { ...gradeSections };
    delete next[renamingGrade];
    next[nextLabel] = sections;
    onChange(next);
    setRenamingGrade(null);
  };

  const applyEarlyYearsPreset = () => {
    onChange(mergeGradePresets(gradeSections, EARLY_YEARS_GRADE_PRESET));
  };

  const applySeniorSecondaryPreset = () => {
    onChange(mergeGradePresets(gradeSections, SENIOR_SECONDARY_GRADE_PRESET));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-ink">Grades &amp; sections</h3>
        <p className="text-sm text-muted">
          Configure each grade level and the sections students belong to. Class 11 &amp; 12 can
          use departments (streams) plus optional section letters (A, B). Everywhere in the app,
          choosing a grade shows only that grade&apos;s sections.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={applyEarlyYearsPreset}>
          + Early years preset
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={applySeniorSecondaryPreset}>
          + Class 11 &amp; 12 (departments)
        </Button>
      </div>
      <p className="text-xs text-muted">
        Presets add missing levels only — they won&apos;t overwrite grades you already configured.
      </p>

      {Object.entries(gradeSections).map(([grade, sections]) => {
        const kind = inferGradeKind(grade);
        const isSenior = kind === 'senior_secondary';

        return (
          <div key={grade} className="rounded-xl border border-gray-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {renamingGrade === grade ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className="rounded-lg border border-gray-200 px-2 py-1 text-sm font-medium"
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitRename();
                        }
                        if (e.key === 'Escape') setRenamingGrade(null);
                      }}
                      autoFocus
                    />
                    <Button type="button" size="sm" variant="outline" onClick={commitRename}>
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setRenamingGrade(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-ink">{grade}</p>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-muted">
                      {GRADE_KIND_BADGE[kind]}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={() => startRename(grade)}
                    >
                      <Pencil className="h-3 w-3" />
                      Rename grade
                    </button>
                  </>
                )}
              </div>
              <button
                type="button"
                className="text-xs text-danger hover:underline"
                onClick={() => removeGrade(grade)}
              >
                Remove grade
              </button>
            </div>

            <p className="mt-2 text-xs text-muted">{seniorStructureHint(kind)}</p>

            {isSenior ? (
              <SeniorGradeEditor
                grade={grade}
                flatSections={sections}
                onFlatChange={(next) => onChange({ ...gradeSections, [grade]: next })}
              />
            ) : (
              <StandardGradeSectionsEditor
                grade={grade}
                sections={sections}
                kind={kind}
                onChange={(next) => onChange({ ...gradeSections, [grade]: next })}
              />
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2">
        <input
          className="min-w-[160px] flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
          placeholder="Add grade e.g. Class 1, Toddler, Class 11"
          value={gradeDraft}
          onChange={(e) => setGradeDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addGrade();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={addGrade}>
          <Plus className="h-4 w-4" />
          Add grade
        </Button>
      </div>
    </div>
  );
}

function SubjectEditor({
  items,
  draft,
  onDraftChange,
  onAdd,
  onRemove,
}: {
  items: string[];
  draft: string;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-ink">Subjects</h3>
        <p className="text-sm text-muted">Used when teachers create quizzes and filters.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
          >
            {item}
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-primary/20"
              aria-label={`Remove ${item}`}
              onClick={() => onRemove(item)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          className="min-w-[160px] flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
          placeholder="Add subject…"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}

export function SchoolAdminAcademicsPage() {
  const publishAcademics = useSchoolAcademicsStore((s) => s.publish);
  const [config, setConfig] = useState<SchoolAcademicConfig | null>(null);
  const [subjectDraft, setSubjectDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchSchoolAcademicConfig()
      .then(setConfig)
      .catch((err) => {
        logApiError('Load academic config failed', err);
        setError(getApiErrorMessage(err, 'Could not load school configuration.'));
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addSubject = () => {
    if (!config) return;
    const trimmed = subjectDraft.trim();
    if (!trimmed) return;
    if (config.subjects.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    setConfig({ ...config, subjects: [...config.subjects, trimmed] });
    setSubjectDraft('');
  };

  const removeSubject = (value: string) => {
    if (!config) return;
    setConfig({ ...config, subjects: config.subjects.filter((s) => s !== value) });
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    setError(null);
    try {
      const saved = await updateSchoolAcademicConfig({
        gradeSections: config.gradeSections,
        subjects: config.subjects,
      });
      setConfig(saved);
      publishAcademics({
        ...saved,
        subscriptionTier: saved.subscriptionTier ?? 'STANDARD',
      });
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      logApiError('Save academic config failed', err);
      setError(getApiErrorMessage(err, 'Could not save configuration.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageWithScrollBelowFilter
      header={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-ink">School academics</h1>
              <p className="text-muted">
                Configure grades and sections for quizzes, filters, and student signup
              </p>
              {config?.board && (
                <p className="mt-1 text-sm text-muted">
                  School board: <span className="font-medium text-ink">{config.board}</span>
                  <span className="text-xs">
                    {' '}
                    · shown to students at signup (set when school was onboarded)
                  </span>
                </p>
              )}
            </div>
            <Button size="sm" onClick={() => void handleSave()} disabled={isSaving || !config}>
              {isSaving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          {savedAt && !error && <p className="text-sm text-success">Saved at {savedAt}</p>}
        </div>
      }
    >
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <Card>
          <CardTitle>Academic structure</CardTitle>
          {config ? (
            <div className="mt-6 space-y-8">
              <BulkAcademicsUpload
                gradeSections={config.gradeSections}
                disabled={isSaving}
                onApply={(gradeSections) =>
                  setConfig({
                    ...config,
                    gradeSections,
                    grades: Object.keys(gradeSections),
                    sections: [...new Set(Object.values(gradeSections).flat())],
                  })
                }
              />
              <GradeSectionEditor
                gradeSections={config.gradeSections}
                onChange={(gradeSections) =>
                  setConfig({
                    ...config,
                    gradeSections,
                    grades: Object.keys(gradeSections),
                    sections: [...new Set(Object.values(gradeSections).flat())],
                  })
                }
              />
              <SubjectEditor
                items={config.subjects}
                draft={subjectDraft}
                onDraftChange={setSubjectDraft}
                onAdd={addSubject}
                onRemove={removeSubject}
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">No configuration loaded.</p>
          )}
        </Card>
      )}
    </PageWithScrollBelowFilter>
  );
}
