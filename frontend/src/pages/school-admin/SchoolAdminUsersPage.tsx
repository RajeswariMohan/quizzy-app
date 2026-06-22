import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, RefreshCw, Pencil, UserX, UserCheck, Trash2, X } from 'lucide-react';
import { FilterPanel } from '@/components/layout/FilterPanel';
import { PageWithScrollBelowFilter } from '@/components/layout/PageWithScrollBelowFilter';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FieldSelect } from '@/components/ui/FieldSelect';
import { TableSearchInput } from '@/components/ui/TableSearchInput';
import {
  createSchoolUser,
  fetchSchoolAcademicConfig,
  fetchSchoolAdminOverview,
  fetchSchoolUsers,
  setSchoolUserActive,
  deleteSchoolUser,
  type CreateSchoolUserPayload,
  type SchoolAcademicConfig,
  type SchoolUserRow,
  type SchoolUserStatusFilter,
} from '@/api/schoolAdmin.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { BulkUserUpload } from '@/components/school-admin/BulkUserUpload';
import { AcademicGroupFilterFields } from '@/components/academics/AcademicGroupFilterFields';
import {
  isSchoolUserOnboardValid,
  SchoolUserOnboardFields,
  type SchoolUserOnboardValues,
} from '@/components/school-admin/SchoolUserOnboardFields';
import {
  childGroupLabel,
  DEFAULT_ACADEMIC_GROUP_FILTER,
  departmentLabel,
  inferGradeKind,
  resolveFilterSectionValue,
  type AcademicGroupFilterValues,
} from '@/utils/gradeStructure';
import {
  EditSchoolUserDialog,
  isEditableSchoolUser,
} from '@/components/school-admin/EditSchoolUserDialog';
import { useClientPagination } from '@/hooks/useClientPagination';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import { useSchoolFeatures } from '@/hooks/useSchoolFeatures';
import { useAuthStore } from '@/store/authStore';
import { publicJoinUrl } from '@/config/publicSite';
import { TablePagination } from '@/components/ui/TablePagination';

const EMPTY_ONBOARD_VALUES: SchoolUserOnboardValues = {
  firstName: '',
  lastName: '',
  role: 'STUDENT',
  username: '',
  email: '',
  parentEmail: '',
  password: '',
  grade: '',
  section: '',
};

export function SchoolAdminUsersPage() {
  const { features } = useSchoolFeatures();
  const schoolId = useAuthStore((s) => s.user?.schoolId ?? null);
  const { gradeSections: schoolGradeSections } = useSchoolAcademics();
  const [users, setUsers] = useState<SchoolUserRow[]>([]);
  const [academics, setAcademics] = useState<SchoolAcademicConfig | null>(null);
  const [isUnlistedSchool, setIsUnlistedSchool] = useState(false);
  const [filterRole, setFilterRole] = useState<'ALL' | 'STUDENT' | 'TEACHER' | 'PARENT'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'PENDING'>(
    'ACTIVE',
  );
  const [schoolSlug, setSchoolSlug] = useState<string | null>(null);
  const [joinLinkCopied, setJoinLinkCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('All');
  const [filterAcademicGroup, setFilterAcademicGroup] = useState<AcademicGroupFilterValues>({
    ...DEFAULT_ACADEMIC_GROUP_FILTER,
  });
  const debouncedSearch = useDebouncedValue(search, 300);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [onboardValues, setOnboardValues] = useState<SchoolUserOnboardValues>(EMPTY_ONBOARD_VALUES);
  const [usernameSubmitBlocked, setUsernameSubmitBlocked] = useState(false);
  const [editingUser, setEditingUser] = useState<SchoolUserRow | null>(null);

  const setOnboardField = <K extends keyof SchoolUserOnboardValues>(
    field: K,
    value: SchoolUserOnboardValues[K],
  ) => {
    setOnboardValues((prev) => {
      if (field === 'role') {
        return {
          ...prev,
          role: value as SchoolUserOnboardValues['role'],
          username: '',
          email: '',
          parentEmail: '',
          grade: '',
          section: '',
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const status: SchoolUserStatusFilter | undefined =
      filterStatus === 'ALL'
        ? 'all'
        : filterStatus === 'INACTIVE'
          ? 'inactive'
          : filterStatus === 'PENDING'
            ? 'pending'
            : 'active';
    const gradeSections = schoolGradeSections;
    const sectionFilter =
      filterGrade !== 'All'
        ? resolveFilterSectionValue({
            grade: filterGrade,
            gradeSections,
            ...filterAcademicGroup,
          })
        : undefined;

    Promise.all([
      fetchSchoolUsers({
        role: filterRole === 'ALL' ? undefined : filterRole,
        status,
        search: debouncedSearch,
        grade: filterGrade === 'All' ? undefined : filterGrade,
        section: sectionFilter,
      }),
      fetchSchoolAcademicConfig(),
      fetchSchoolAdminOverview(),
    ])
      .then(([userRows, academicConfig, overview]) => {
        setUsers(userRows);
        setAcademics(academicConfig);
        setIsUnlistedSchool(overview.school.slug === 'unlisted');
        setSchoolSlug(overview.school.slug === 'unlisted' ? null : overview.school.slug);
      })
      .catch((err) => {
        logApiError('Load school users failed', err);
        setError(getApiErrorMessage(err, 'Could not load users.'));
      })
      .finally(() => setIsLoading(false));
  }, [
    filterRole,
    filterStatus,
    debouncedSearch,
    filterGrade,
    filterAcademicGroup,
    schoolGradeSections,
  ]);

  const filterGroupColumnLabel =
    filterGrade !== 'All' && inferGradeKind(filterGrade) === 'senior_secondary'
      ? departmentLabel()
      : childGroupLabel();

  const hasActiveFilters =
    search.trim() !== '' ||
    filterRole !== 'ALL' ||
    filterStatus !== 'ACTIVE' ||
    filterGrade !== 'All' ||
    filterAcademicGroup.department !== 'All' ||
    filterAcademicGroup.sectionLetter !== 'All' ||
    filterAcademicGroup.group !== 'All';

  const clearFilters = () => {
    setSearch('');
    setFilterRole('ALL');
    setFilterStatus('ACTIVE');
    setFilterGrade('All');
    setFilterAcademicGroup({ ...DEFAULT_ACADEMIC_GROUP_FILTER });
  };

  const joinLink = schoolSlug ? publicJoinUrl(schoolSlug) : null;

  const copyJoinLink = async () => {
    if (!joinLink) return;
    try {
      await navigator.clipboard.writeText(joinLink);
      setJoinLinkCopied(true);
      window.setTimeout(() => setJoinLinkCopied(false), 2000);
    } catch {
      setError('Could not copy link. Select and copy it manually.');
    }
  };

  const handleApprovePending = async (user: SchoolUserRow) => {
    const name = `${user.firstName} ${user.lastName}`.trim();
    if (!window.confirm(`Approve ${name}? They will be able to sign in.`)) return;
    setActionUserId(user.id);
    setError(null);
    try {
      await setSchoolUserActive(user.id, true);
      setFormSuccess(`${name} approved.`);
      load();
    } catch (err) {
      logApiError('Approve pending user failed', err);
      setError(getApiErrorMessage(err, 'Could not approve user.'));
    } finally {
      setActionUserId(null);
    }
  };

  const handleSetActive = async (user: SchoolUserRow, isActive: boolean) => {
    const action = isActive ? 'reactivate' : 'deactivate';
    const name = `${user.firstName} ${user.lastName}`.trim();
    if (
      !window.confirm(
        isActive
          ? `Reactivate ${name}? They will be able to sign in again.`
          : `Deactivate ${name}? They will not be able to sign in until reactivated.`,
      )
    ) {
      return;
    }
    setActionUserId(user.id);
    setError(null);
    try {
      await setSchoolUserActive(user.id, isActive);
      setFormSuccess(isActive ? `${name} reactivated.` : `${name} deactivated.`);
      load();
    } catch (err) {
      logApiError('Set user status failed', err);
      setError(getApiErrorMessage(err, `Could not ${action} user.`));
    } finally {
      setActionUserId(null);
    }
  };

  const handleDelete = async (user: SchoolUserRow) => {
    const name = `${user.firstName} ${user.lastName}`.trim();
    if (
      !window.confirm(
        `Permanently delete ${name}? This cannot be undone. Users with quizzes or student responses must be deactivated instead.`,
      )
    ) {
      return;
    }
    setActionUserId(user.id);
    setError(null);
    try {
      await deleteSchoolUser(user.id);
      setFormSuccess(`${name} removed.`);
      load();
    } catch (err) {
      logApiError('Delete school user failed', err);
      setError(getApiErrorMessage(err, 'Could not delete user.'));
    } finally {
      setActionUserId(null);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const { firstName, lastName, password, role, username, email, parentEmail, grade, section } =
        onboardValues;
      const payload: CreateSchoolUserPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        role,
      };
      if (role === 'STUDENT') {
        payload.username = username.trim();
        payload.parentEmail = parentEmail.trim();
        payload.grade = grade;
        payload.section = section;
      } else {
        payload.email = email.trim();
      }
      await createSchoolUser(payload);
      setOnboardValues(EMPTY_ONBOARD_VALUES);
      setFormSuccess('User created successfully.');
      load();
    } catch (err) {
      logApiError('Create school user failed', err);
      setFormError(getApiErrorMessage(err, 'Could not create user.'));
    } finally {
      setIsSaving(false);
    }
  };

  const canSubmit =
    isSchoolUserOnboardValid(onboardValues, { academicsRequired: true }) &&
    !usernameSubmitBlocked &&
    !(onboardValues.role === 'STUDENT' && !academics);

  const usersPagination = useClientPagination(users, {
    resetKey: `${filterRole}|${filterStatus}|${debouncedSearch}|${filterGrade}|${filterAcademicGroup.department}|${filterAcademicGroup.group}|${users.length}`,
  });

  return (
    <PageWithScrollBelowFilter
      header={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Users</h1>
            <p className="text-muted">Onboard teachers, students, and parents for your school</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      }
      filter={
        <FilterPanel>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle>School directory</CardTitle>
              <p className="mt-0.5 text-xs text-muted">
                {isLoading ? 'Loading…' : `${users.length} user${users.length === 1 ? '' : 's'} found`}
                {hasActiveFilters ? ' · filters active' : ''}
              </p>
            </div>
            {hasActiveFilters && (
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4" />
                Clear filters
              </Button>
            )}
          </div>
          <div className="mt-3">
            <TableSearchInput
              value={search}
              onChange={setSearch}
              placeholder="Name, email, or username…"
              label="Search users"
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FieldSelect
              label="Role"
              value={filterRole}
              onChange={(v) => setFilterRole(v as typeof filterRole)}
              options={['ALL', 'STUDENT', 'TEACHER', 'PARENT']}
            />
            <FieldSelect
              label="Status"
              value={filterStatus}
              onChange={(v) => setFilterStatus(v as typeof filterStatus)}
              options={['ACTIVE', 'PENDING', 'INACTIVE', 'ALL']}
            />
            <FieldSelect
              label="Grade"
              value={filterGrade}
              onChange={(v) => {
                setFilterGrade(v);
                setFilterAcademicGroup({ ...DEFAULT_ACADEMIC_GROUP_FILTER });
              }}
              options={academics ? ['All', ...academics.grades] : ['All']}
              disabled={!academics}
            />
            {filterGrade !== 'All' && academics && (
              <div className="sm:col-span-2 lg:col-span-3">
                <AcademicGroupFilterFields
                  grade={filterGrade}
                  gradeSections={academics.gradeSections}
                  values={filterAcademicGroup}
                  onChange={setFilterAcademicGroup}
                  disabled={!academics}
                />
              </div>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </FilterPanel>
      }
    >
      {joinLink && (
        <Card>
          <CardTitle>School join link</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Share this link so students and teachers can request access to your school.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-surface px-3 py-2 text-xs text-ink">
              {joinLink}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={() => void copyJoinLink()}>
              {joinLinkCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Add user</CardTitle>
        <form onSubmit={(e) => void handleCreate(e)} className="mt-4">
          <SchoolUserOnboardFields
            values={onboardValues}
            onChange={setOnboardField}
            academics={academics}
            schoolId={schoolId}
            parentPortalEnabled={features.parentPortalEnabled}
            disabled={isSaving}
            onSubmitBlockedChange={setUsernameSubmitBlocked}
          />
          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" disabled={isSaving || !canSubmit}>
              {isSaving ? 'Creating…' : 'Create account'}
            </Button>
          </div>
        </form>
        {onboardValues.role === 'STUDENT' && (
          <p className="mt-3 text-sm text-muted">
            Grade and section options are managed on the{' '}
            <Link to="/school-admin/academics" className="font-medium text-primary hover:underline">
              School academics
            </Link>{' '}
            page.
          </p>
        )}
        {formError && <p className="mt-2 text-sm text-danger">{formError}</p>}
        {formSuccess && <p className="mt-2 text-sm text-success">{formSuccess}</p>}
        <BulkUserUpload
          academics={academics}
          disabled={isSaving}
          importEnabled={features.bulkUserImportEnabled}
          onImported={(count) => {
            setFormSuccess(`Imported ${count} user${count === 1 ? '' : 's'} successfully.`);
            load();
          }}
        />
      </Card>

      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-muted">
                <th className="pb-2 pr-3 font-medium">Name</th>
                <th className="pb-2 pr-3 font-medium">Login</th>
                <th className="pb-2 pr-3 font-medium">Grade</th>
                <th className="pb-2 pr-3 font-medium">{filterGroupColumnLabel}</th>
                {isUnlistedSchool && (
                  <th className="pb-2 pr-3 font-medium">School note</th>
                )}
                <th className="pb-2 pr-3 font-medium">Role</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersPagination.pageItems.map((u) => {
                const busy = actionUserId === u.id;
                const editable = isEditableSchoolUser(u.role);
                return (
                  <tr
                    key={u.id}
                    className={`border-b border-gray-50 ${!u.isActive ? 'bg-gray-50/80' : ''}`}
                  >
                    <td className="py-2.5 pr-3 font-medium">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="py-2.5 pr-3">
                      {u.role === 'STUDENT' && u.username ? (
                        <span title={u.email}>{u.username}</span>
                      ) : (
                        u.email
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      {u.role === 'STUDENT' ? (u.grade ?? '—') : '—'}
                    </td>
                    <td className="py-2.5 pr-3">
                      {u.role === 'STUDENT' ? (u.section ?? '—') : '—'}
                    </td>
                    {isUnlistedSchool && (
                      <td className="max-w-[220px] truncate py-2.5 pr-3 text-muted">
                        {u.role === 'STUDENT' ? (u.signupSchoolNote ?? '—') : '—'}
                      </td>
                    )}
                    <td className="py-2.5 pr-3">{u.role.replace('_', ' ')}</td>
                    <td className="py-2.5 pr-3">
                      {u.signupPendingAt ? (
                        <Badge className="bg-amber-100 text-amber-800">Pending approval</Badge>
                      ) : u.isActive ? (
                        <Badge className="bg-success/15 text-success">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-200 text-muted">Inactive</Badge>
                      )}
                    </td>
                    <td className="py-2.5">
                      {editable ? (
                        <div className="flex flex-wrap gap-1.5">
                          {u.signupPendingAt && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => void handleApprovePending(u)}
                              disabled={busy}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser(u)}
                            disabled={busy}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          {u.isActive ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void handleSetActive(u, false)}
                              disabled={busy || Boolean(u.signupPendingAt)}
                            >
                              <UserX className="h-3.5 w-3.5" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void handleSetActive(u, true)}
                              disabled={busy}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              Reactivate
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-danger hover:border-danger/40 hover:bg-danger/5"
                            onClick={() => void handleDelete(u)}
                            disabled={busy}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!isLoading && users.length === 0 && (
            <p className="px-4 py-4 text-sm text-muted">No users found.</p>
          )}
        </div>
        {!isLoading && users.length > 0 && (
          <TablePagination
            page={usersPagination.page}
            totalPages={usersPagination.totalPages}
            pageSize={usersPagination.pageSize}
            totalItems={usersPagination.totalItems}
            rangeStart={usersPagination.rangeStart}
            rangeEnd={usersPagination.rangeEnd}
            onPageChange={usersPagination.setPage}
            onPageSizeChange={usersPagination.setPageSize}
          />
        )}
      </Card>

      {editingUser && (
        <EditSchoolUserDialog
          user={editingUser}
          academics={academics}
          onClose={() => setEditingUser(null)}
          onSaved={load}
        />
      )}
    </PageWithScrollBelowFilter>
  );
}
