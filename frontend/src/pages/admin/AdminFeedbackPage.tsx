import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, RefreshCw, X } from 'lucide-react';
import { FilterPanel } from '@/components/layout/FilterPanel';
import { PageWithScrollBelowFilter } from '@/components/layout/PageWithScrollBelowFilter';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldSelect } from '@/components/ui/FieldSelect';
import { TableSearchInput } from '@/components/ui/TableSearchInput';
import {
  fetchAdminFeedback,
  updateAdminFeedback,
  type AdminFeedbackItem,
  type FeedbackStatus,
} from '@/api/feedback.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { formatDateTime } from '@/lib/formatDateTime';
import { matchesTableSearch } from '@/utils/tableFilters';
import type { UserRole } from '@/types/auth';

const STATUS_OPTIONS = ['All', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const;
const ROLE_OPTIONS = ['All', 'STUDENT', 'PARENT', 'SCHOOL_ADMIN'] as const;

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Student',
  PARENT: 'Parent',
  SCHOOL_ADMIN: 'School admin',
};

export function AdminFeedbackPage() {
  const [items, setItems] = useState<AdminFeedbackItem[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updateStatus, setUpdateStatus] = useState<FeedbackStatus>('OPEN');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchAdminFeedback({
      status: statusFilter === 'All' ? undefined : (statusFilter as FeedbackStatus),
      role: roleFilter === 'All' ? undefined : (roleFilter as UserRole),
    })
      .then((res) => {
        setItems(res.items);
        setOpenCount(res.openCount);
        if (selectedId && !res.items.some((i) => i.id === selectedId)) {
          setSelectedId(null);
        }
      })
      .catch((err) => {
        logApiError('Load admin feedback failed', err);
        setError(getApiErrorMessage(err, 'Could not load feedback.'));
      })
      .finally(() => setIsLoading(false));
  }, [statusFilter, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        matchesTableSearch(search, [
          item.userDisplayName,
          item.userEmail,
          item.schoolName,
          item.message,
          item.category,
          item.status,
          ROLE_LABELS[item.role] ?? item.role,
        ]),
      ),
    [items, search],
  );

  const selected = filteredItems.find((i) => i.id === selectedId) ?? items.find((i) => i.id === selectedId) ?? null;

  useEffect(() => {
    if (selected) {
      setAdminNotes(selected.adminNotes ?? '');
      setUpdateStatus(selected.status);
    }
  }, [selected]);

  const handleSave = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      await updateAdminFeedback(selected.id, {
        status: updateStatus,
        adminNotes: adminNotes.trim() || undefined,
      });
      load();
    } catch (err) {
      logApiError('Update feedback failed', err);
      setError(getApiErrorMessage(err, 'Could not save changes.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageWithScrollBelowFilter
      header={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">User feedback</h1>
            <p className="text-muted">
              Experience submissions from students, parents, and school admins
            </p>
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
            <p className="text-xs text-muted">
              {filteredItems.length} of {items.length} shown
              {search.trim() ? ' · search active' : ''}
            </p>
            {search.trim() && (
              <Button type="button" variant="outline" size="sm" onClick={() => setSearch('')}>
                <X className="h-4 w-4" />
                Clear search
              </Button>
            )}
          </div>
          <div className="mt-3">
            <TableSearchInput
              value={search}
              onChange={setSearch}
              placeholder="Message, user, school…"
              label="Search feedback"
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <FieldSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[...STATUS_OPTIONS]}
            />
            <FieldSelect
              label="Role"
              value={roleFilter}
              onChange={setRoleFilter}
              options={[...ROLE_OPTIONS]}
            />
          </div>
        </FilterPanel>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="!p-4">
          <p className="text-sm text-muted">Open items</p>
          <p className="text-2xl font-bold text-warning">{openCount}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-muted">Total shown</p>
          <p className="text-2xl font-bold">{filteredItems.length}</p>
        </Card>
      </div>

      {error && (
        <Card>
          <p className="text-danger">{error}</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden !p-0">
          <div className="border-b border-gray-100 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5" />
              Inbox
            </CardTitle>
          </div>
          {isLoading ? (
            <p className="p-4 text-sm text-muted">Loading…</p>
          ) : filteredItems.length === 0 ? (
            <p className="p-4 text-sm text-muted">No feedback matches your filters.</p>
          ) : (
            <ul className="max-h-[520px] divide-y divide-gray-100 overflow-y-auto">
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full px-4 py-3 text-left transition hover:bg-gray-50 ${
                      selectedId === item.id ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-ink">
                        {item.userDisplayName ?? item.userEmail}
                      </p>
                      <span className="text-xs text-muted">{item.status}</span>
                    </div>
                    <p className="text-xs text-muted">
                      {ROLE_LABELS[item.role] ?? item.role}
                      {item.schoolName ? ` · ${item.schoolName}` : ''}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{item.message}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          {selected ? (
            <div className="space-y-4">
              <div>
                <CardTitle>Review</CardTitle>
                <p className="mt-1 text-sm text-muted">
                  {selected.userDisplayName} ({selected.userEmail})
                </p>
                <p className="text-xs text-muted">
                  {ROLE_LABELS[selected.role]} · {selected.category}
                  {selected.rating != null ? ` · ${selected.rating}/5` : ''}
                </p>
              </div>
              <p className="rounded-xl bg-surface p-3 text-sm text-ink">{selected.message}</p>
              <p className="text-xs text-muted">Submitted {formatDateTime(selected.createdAt)}</p>

              <FieldSelect
                label="Status"
                value={updateStatus}
                onChange={(v) => setUpdateStatus(v as FeedbackStatus)}
                options={['OPEN', 'IN_PROGRESS', 'RESOLVED']}
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Internal notes
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Actions taken, follow-up plan…"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save review'}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted">Select a submission from the inbox to review.</p>
          )}
        </Card>
      </div>
    </PageWithScrollBelowFilter>
  );
}
