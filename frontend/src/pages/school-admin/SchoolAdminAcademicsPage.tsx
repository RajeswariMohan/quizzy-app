import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, X } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  fetchSchoolAcademicConfig,
  updateSchoolAcademicConfig,
  type SchoolAcademicConfig,
} from '@/api/schoolAdmin.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { useSchoolAcademicsStore } from '@/store/schoolAcademicsStore';

type AcademicField = 'grades' | 'sections' | 'subjects';

function OptionEditor({
  title,
  description,
  items,
  draft,
  onDraftChange,
  onAdd,
  onRemove,
}: {
  title: string;
  description: string;
  items: string[];
  draft: string;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="text-sm text-muted">{description}</p>
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
          placeholder={`Add ${title.toLowerCase()}…`}
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
  const [gradeDraft, setGradeDraft] = useState('');
  const [sectionDraft, setSectionDraft] = useState('');
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

  const addItem = (field: AcademicField, value: string) => {
    if (!config) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    const exists = config[field].some((item) => item.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;
    setConfig({ ...config, [field]: [...config[field], trimmed] });
    if (field === 'grades') setGradeDraft('');
    else if (field === 'sections') setSectionDraft('');
    else setSubjectDraft('');
  };

  const removeItem = (field: AcademicField, value: string) => {
    if (!config) return;
    setConfig({ ...config, [field]: config[field].filter((item) => item !== value) });
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    setError(null);
    try {
      const saved = await updateSchoolAcademicConfig(config);
      setConfig(saved);
      publishAcademics(saved);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      logApiError('Save academic config failed', err);
      setError(getApiErrorMessage(err, 'Could not save configuration.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">School academics</h1>
          <p className="text-muted">
            Configure grades, sections, and subjects for your school — used in quizzes, filters,
            and student onboarding
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={isSaving || !config}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {savedAt && !error && (
        <p className="text-sm text-success">Saved at {savedAt}</p>
      )}

      <Card>
        <CardTitle>Academic structure</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Teachers see these subjects when creating quizzes. Students use grades and sections when
          added by an admin.
        </p>
        {config ? (
          <div className="mt-6 space-y-8">
            <OptionEditor
              title="Grades"
              description="e.g. Class 5, UKG, Grade 10"
              items={config.grades}
              draft={gradeDraft}
              onDraftChange={setGradeDraft}
              onAdd={() => addItem('grades', gradeDraft)}
              onRemove={(value) => removeItem('grades', value)}
            />
            <OptionEditor
              title="Sections"
              description="e.g. A, B, C, D"
              items={config.sections}
              draft={sectionDraft}
              onDraftChange={setSectionDraft}
              onAdd={() => addItem('sections', sectionDraft)}
              onRemove={(value) => removeItem('sections', value)}
            />
            <OptionEditor
              title="Subjects"
              description="e.g. Mathematics, Science, Hindi — used in quiz creation and filters"
              items={config.subjects}
              draft={subjectDraft}
              onDraftChange={setSubjectDraft}
              onAdd={() => addItem('subjects', subjectDraft)}
              onRemove={(value) => removeItem('subjects', value)}
            />
          </div>
        ) : (
          !isLoading && <p className="mt-4 text-sm text-muted">No configuration loaded.</p>
        )}
      </Card>

      <p className="text-sm text-muted">
        <Link to="/school-admin/users" className="font-medium text-primary hover:underline">
          Go to Users
        </Link>{' '}
        to onboard students, or{' '}
        <Link to="/teacher/quizzes" className="font-medium text-primary hover:underline">
          Quizzes
        </Link>{' '}
        to create content with your subject list.
      </p>
    </div>
  );
}
