import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Building2, Building } from 'lucide-react';
import { PageWithScrollBelowFilter } from '@/components/layout/PageWithScrollBelowFilter';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FieldSelect } from '@/components/ui/FieldSelect';
import {
  createSchool,
  fetchPlatformOverview,
  updateSchool,
  type SchoolPlatformStats,
  type AdminSchoolsStatusFilter,
} from '@/api/admin.api';
import { SchoolAdminPanel } from '@/components/admin/SchoolAdminPanel';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { getApiErrorMessage, logApiError } from '@/api/client';

function limitText(used: number, max: number | null | undefined): string {
  if (max == null) return `${used}`;
  return `${used} / ${max}`;
}

export function AdminSchoolsPage() {
  const [schools, setSchools] = useState<SchoolPlatformStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [schoolsStatus, setSchoolsStatus] = useState<AdminSchoolsStatusFilter>('active');
  const [actionSchoolId, setActionSchoolId] = useState<string | null>(null);
  const [totals, setTotals] = useState<{
    activeSchools: number;
    inactiveSchools: number;
  } | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [board, setBoard] = useState('');
  const [maxStudents, setMaxStudents] = useState('500');
  const [maxTeachers, setMaxTeachers] = useState('50');
  const [maxParents, setMaxParents] = useState('200');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchPlatformOverview({ schoolsStatus })
      .then((d) => {
        setSchools(d.schools);
        setTotals({
          activeSchools: d.totals.activeSchools,
          inactiveSchools: d.totals.inactiveSchools ?? 0,
        });
      })
      .catch((err) => {
        logApiError('Load schools failed', err);
        setError(getApiErrorMessage(err, 'Could not load schools.'));
      })
      .finally(() => setIsLoading(false));
  }, [schoolsStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setFormError(null);
    try {
      await createSchool({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        board: board.trim() || undefined,
        maxStudents: Number(maxStudents) || undefined,
        maxTeachers: Number(maxTeachers) || undefined,
        maxParents: Number(maxParents) || undefined,
        adminEmail: adminEmail.trim(),
        adminPassword,
        adminFirstName: adminFirstName.trim(),
        adminLastName: adminLastName.trim(),
      });
      setName('');
      setSlug('');
      setBoard('');
      setAdminFirstName('');
      setAdminLastName('');
      setAdminEmail('');
      setAdminPassword('');
      load();
    } catch (err) {
      logApiError('Create school failed', err);
      setFormError(getApiErrorMessage(err, 'Could not onboard school.'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleSetSchoolActive = async (school: SchoolPlatformStats, isActive: boolean) => {
    const action = isActive ? 'reactivate' : 'deactivate';
    if (
      !window.confirm(
        isActive
          ? `Reactivate ${school.name}? Users at this school can sign in again.`
          : `Deactivate ${school.name}? All users at this school will be blocked from signing in until the school is reactivated.`,
      )
    ) {
      return;
    }
    setActionSchoolId(school.id);
    setError(null);
    try {
      await updateSchool(school.id, { isActive });
      load();
    } catch (err) {
      logApiError('Update school status failed', err);
      setError(getApiErrorMessage(err, `Could not ${action} school.`));
    } finally {
      setActionSchoolId(null);
    }
  };

  const handleLimitSave = async (
    school: SchoolPlatformStats,
    field: 'maxStudents' | 'maxTeachers' | 'maxParents',
    raw: string,
  ) => {
    if (!school.isActive) return;
    const value = raw.trim() === '' ? null : Number(raw);
    try {
      await updateSchool(school.id, { [field]: value });
      load();
    } catch (err) {
      logApiError('Update school limits failed', err);
      setError(getApiErrorMessage(err, 'Could not update limits.'));
    }
  };

  return (
    <PageWithScrollBelowFilter
      header={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Schools</h1>
            <p className="text-muted">Onboard schools and control user capacity per tenant</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FieldSelect
              label="Schools shown"
              value={
                schoolsStatus === 'inactive'
                  ? 'Inactive'
                  : schoolsStatus === 'all'
                    ? 'All'
                    : 'Active'
              }
              onChange={(v) => {
                const next: AdminSchoolsStatusFilter =
                  v === 'Inactive' ? 'inactive' : v === 'All' ? 'all' : 'active';
                setSchoolsStatus(next);
              }}
              options={['Active', 'Inactive', 'All']}
            />
            <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      }
    >
      {totals && (
        <p className="text-sm text-muted">
          Platform: {totals.activeSchools} active school{totals.activeSchools === 1 ? '' : 's'}
          {totals.inactiveSchools > 0
            ? ` · ${totals.inactiveSchools} inactive`
            : ''}
        </p>
      )}

      <Card>
        <CardTitle>Onboard new school</CardTitle>
        <form onSubmit={(e) => void handleCreate(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="School name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="slug (e.g. greenwood-high)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
          <input
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="Board (optional)"
            value={board}
            onChange={(e) => setBoard(e.target.value)}
          />
          <input
            type="number"
            min={1}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="Max students"
            value={maxStudents}
            onChange={(e) => setMaxStudents(e.target.value)}
          />
          <input
            type="number"
            min={1}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="Max teachers"
            value={maxTeachers}
            onChange={(e) => setMaxTeachers(e.target.value)}
          />
          <input
            type="number"
            min={1}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="Max parents"
            value={maxParents}
            onChange={(e) => setMaxParents(e.target.value)}
          />
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium text-ink">Initial school admin</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Admin first name"
                value={adminFirstName}
                onChange={(e) => setAdminFirstName(e.target.value)}
                required
              />
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Admin last name"
                value={adminLastName}
                onChange={(e) => setAdminLastName(e.target.value)}
                required
              />
              <input
                type="email"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm sm:col-span-2"
                placeholder="Admin email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
              <PasswordInput
                wrapperClassName="sm:col-span-2"
                placeholder="Admin password (min 8 chars)"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating…' : 'Create school'}
            </Button>
          </div>
        </form>
        {formError && <p className="mt-2 text-sm text-danger">{formError}</p>}
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {schools.map((s) => {
          const busy = actionSchoolId === s.id;
          return (
          <Card
            key={s.id}
            className={`!p-4 ${!s.isActive ? 'border-gray-200 bg-gray-50/90 opacity-90' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div
                className="h-10 w-10 shrink-0 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${s.primaryColor}, ${s.secondaryColor})`,
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink">{s.name}</p>
                  {s.isActive ? (
                    <Badge className="bg-success/15 text-success">Active</Badge>
                  ) : (
                    <Badge className="bg-gray-200 text-muted">Inactive</Badge>
                  )}
                </div>
                <p className="text-xs text-muted">
                  {s.slug}
                  {s.board ? ` · ${s.board}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {s.isActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleSetSchoolActive(s, false)}
                      disabled={busy}
                    >
                      <Building className="h-3.5 w-3.5" />
                      Deactivate school
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleSetSchoolActive(s, true)}
                      disabled={busy}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      Reactivate school
                    </Button>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted">Students</span>
                  <span className="font-medium">
                    {limitText(s.students, s.limits?.maxStudents)}
                  </span>
                  <span className="text-muted">Teachers</span>
                  <span className="font-medium">
                    {limitText(s.teachers, s.limits?.maxTeachers)}
                  </span>
                  <span className="text-muted">Parents</span>
                  <span className="font-medium">{limitText(s.parents, s.limits?.maxParents)}</span>
                  <span className="text-muted">Quizzes</span>
                  <span className="font-medium">{s.publishedQuizzes}</span>
                </div>
                {s.isActive ? (
                  <>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <input
                        type="number"
                        min={1}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                        defaultValue={s.limits?.maxStudents ?? ''}
                        placeholder="Max students"
                        onBlur={(e) => void handleLimitSave(s, 'maxStudents', e.target.value)}
                      />
                      <input
                        type="number"
                        min={1}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                        defaultValue={s.limits?.maxTeachers ?? ''}
                        placeholder="Max teachers"
                        onBlur={(e) => void handleLimitSave(s, 'maxTeachers', e.target.value)}
                      />
                      <input
                        type="number"
                        min={1}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                        defaultValue={s.limits?.maxParents ?? ''}
                        placeholder="Max parents"
                        onBlur={(e) => void handleLimitSave(s, 'maxParents', e.target.value)}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted">Blur a field to save limits</p>
                    <SchoolAdminPanel schoolId={s.id} schoolName={s.name} />
                  </>
                ) : (
                  <p className="mt-3 text-xs text-muted">
                    Reactivate this school to edit limits or manage admins.
                  </p>
                )}
              </div>
            </div>
          </Card>
          );
        })}
      </div>

      {!isLoading && schools.length === 0 && (
        <Card>
          <p className="text-sm text-muted">
            {schoolsStatus === 'inactive'
              ? 'No inactive schools.'
              : schoolsStatus === 'all'
                ? 'No schools onboarded yet.'
                : 'No active schools in the current filter.'}
          </p>
        </Card>
      )}
    </PageWithScrollBelowFilter>
  );
}
