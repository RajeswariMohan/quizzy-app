import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Pencil, UserX, UserCheck, Trash2 } from 'lucide-react';
import { FilterPanel } from '@/components/layout/FilterPanel';
import { PageWithScrollBelowFilter } from '@/components/layout/PageWithScrollBelowFilter';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FieldSelect } from '@/components/ui/FieldSelect';
import { PasswordInput } from '@/components/ui/PasswordInput';
import {
  createSchoolUser,
  fetchSchoolAcademicConfig,
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
import {
  EditSchoolUserDialog,
  isEditableSchoolUser,
} from '@/components/school-admin/EditSchoolUserDialog';
import { useClientPagination } from '@/hooks/useClientPagination';
import { TablePagination } from '@/components/ui/TablePagination';

export function SchoolAdminUsersPage() {
  const [users, setUsers] = useState<SchoolUserRow[]>([]);
  const [academics, setAcademics] = useState<SchoolAcademicConfig | null>(null);
  const [filterRole, setFilterRole] = useState<'ALL' | 'STUDENT' | 'TEACHER' | 'PARENT'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<CreateSchoolUserPayload['role']>('STUDENT');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [editingUser, setEditingUser] = useState<SchoolUserRow | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const status: SchoolUserStatusFilter | undefined =
      filterStatus === 'ALL'
        ? 'all'
        : filterStatus === 'INACTIVE'
          ? 'inactive'
          : 'active';
    Promise.all([
      fetchSchoolUsers({
        role: filterRole === 'ALL' ? undefined : filterRole,
        status,
      }),
      fetchSchoolAcademicConfig(),
    ])
      .then(([userRows, academicConfig]) => {
        setUsers(userRows);
        setAcademics(academicConfig);
      })
      .catch((err) => {
        logApiError('Load school users failed', err);
        setError(getApiErrorMessage(err, 'Could not load users.'));
      })
      .finally(() => setIsLoading(false));
  }, [filterRole, filterStatus]);

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
      const payload: CreateSchoolUserPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role,
      };
      if (role === 'STUDENT') {
        payload.grade = grade;
        payload.section = section;
      }
      await createSchoolUser(payload);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setGrade('');
      setSection('');
      load();
    } catch (err) {
      logApiError('Create school user failed', err);
      setFormError(getApiErrorMessage(err, 'Could not create user.'));
    } finally {
      setIsSaving(false);
    }
  };

  const isStudent = role === 'STUDENT';

  const usersPagination = useClientPagination(users, {
    resetKey: `${filterRole}|${filterStatus}|${users.length}`,
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
            <CardTitle>School directory</CardTitle>
            <div className="flex flex-wrap gap-3">
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
                options={['ACTIVE', 'INACTIVE', 'ALL']}
              />
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </FilterPanel>
      }
    >
      <Card>
        <CardTitle>Add user</CardTitle>
        <form onSubmit={(e) => void handleCreate(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <input
            type="email"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm sm:col-span-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <PasswordInput
            wrapperClassName="sm:col-span-2"
            placeholder="Temporary password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <FieldSelect
            label="Role"
            value={role}
            onChange={(v) => setRole(v as CreateSchoolUserPayload['role'])}
            options={['STUDENT', 'TEACHER', 'PARENT']}
          />
          {isStudent && academics && (
            <>
              <FieldSelect
                label="Grade / standard"
                value={grade}
                onChange={setGrade}
                options={academics.grades}
                placeholder="Select grade"
                required
              />
              <FieldSelect
                label="Section"
                value={section}
                onChange={setSection}
                options={academics.sections}
                placeholder="Select section"
                required
              />
            </>
          )}
          <div className={`flex items-end ${isStudent ? 'sm:col-span-2' : ''}`}>
            <Button type="submit" disabled={isSaving || (isStudent && !academics)}>
              {isSaving ? 'Creating…' : 'Create account'}
            </Button>
          </div>
        </form>
        {isStudent && (
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
          disabled={isSaving || isLoading}
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
                <th className="pb-2 pr-3 font-medium">Email</th>
                <th className="pb-2 pr-3 font-medium">Grade</th>
                <th className="pb-2 pr-3 font-medium">Section</th>
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
                    <td className="py-2.5 pr-3">{u.email}</td>
                    <td className="py-2.5 pr-3">
                      {u.role === 'STUDENT' ? (u.grade ?? '—') : '—'}
                    </td>
                    <td className="py-2.5 pr-3">
                      {u.role === 'STUDENT' ? (u.section ?? '—') : '—'}
                    </td>
                    <td className="py-2.5 pr-3">{u.role.replace('_', ' ')}</td>
                    <td className="py-2.5 pr-3">
                      {u.isActive ? (
                        <Badge className="bg-success/15 text-success">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-200 text-muted">Inactive</Badge>
                      )}
                    </td>
                    <td className="py-2.5">
                      {editable ? (
                        <div className="flex flex-wrap gap-1.5">
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
                              disabled={busy}
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
        {usersPagination.showPagination && !isLoading && users.length > 0 && (
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
