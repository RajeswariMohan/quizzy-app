import { useEffect, useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';
import { logApiError } from '@/api/client';

export function SuperAdminSchoolFilter() {
  const [open, setOpen] = useState(false);
  const {
    mode,
    selectedSchoolIds,
    schools,
    schoolsLoaded,
    loadSchools,
    setModeAll,
    selectOnlySchool,
    toggleSchool,
    getFilterLabel,
  } = useSchoolFilterStore();

  useEffect(() => {
    loadSchools().catch((err) => logApiError('Load schools failed', err));
  }, [loadSchools]);

  const selectedCount = mode === 'selected' ? selectedSchoolIds.length : schools.length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-ink hover:bg-primary/10"
      >
        <Building2 className="h-4 w-4 text-primary" />
        <span className="max-w-[180px] truncate">{getFilterLabel()}</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close school filter"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
            <p className="text-xs font-medium text-muted">Filter data by school</p>
            <p className="mt-1 text-[11px] text-muted">
              Check one or more schools, or click a name to select only that school.
            </p>

            <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-surface">
              <input
                type="radio"
                name="schoolScope"
                checked={mode === 'all'}
                onChange={() => setModeAll()}
              />
              <span className="text-sm font-medium text-ink">All schools</span>
            </label>

            <p className="mt-2 border-t border-gray-100 pt-2 text-xs font-medium text-muted">
              Select schools
            </p>

            {!schoolsLoaded ? (
              <p className="py-2 text-xs text-muted">Loading schools…</p>
            ) : schools.length === 0 ? (
              <p className="py-2 text-xs text-muted">No schools onboarded yet.</p>
            ) : (
              <ul className="mt-1 max-h-52 space-y-0.5 overflow-y-auto">
                {schools.map((school) => {
                  const checked =
                    mode === 'selected' && selectedSchoolIds.includes(school.id);
                  const isSingleSelected =
                    mode === 'selected' &&
                    selectedSchoolIds.length === 1 &&
                    selectedSchoolIds[0] === school.id;

                  return (
                    <li key={school.id}>
                      <div
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface',
                          checked && 'bg-primary/5',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="shrink-0"
                          checked={checked}
                          aria-label={`Include ${school.name}`}
                          onChange={() => toggleSchool(school.id)}
                        />
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => selectOnlySchool(school.id)}
                          title={`Show only ${school.name}`}
                        >
                          <span
                            className={cn(
                              'block truncate text-sm',
                              isSingleSelected ? 'font-semibold text-primary' : 'text-ink',
                            )}
                          >
                            {school.name}
                          </span>
                          <span className="block truncate text-[11px] text-muted">{school.slug}</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {schoolsLoaded && schools.length > 0 && (
              <p className="mt-2 border-t border-gray-100 pt-2 text-[11px] text-muted">
                {mode === 'all'
                  ? `Showing aggregated data for all ${schools.length} schools`
                  : selectedSchoolIds.length === 1
                    ? 'Single school selected'
                    : `${selectedCount} schools selected`}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
