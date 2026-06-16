import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, RefreshCw, Star } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  fetchMyFeedback,
  submitFeedback,
  type FeedbackCategory,
  type FeedbackItem,
} from '@/api/feedback.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { formatDateTime } from '@/lib/formatDateTime';
import { useAuthStore } from '@/store/authStore';

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: 'GENERAL', label: 'General experience' },
  { value: 'BUG', label: 'Bug or issue' },
  { value: 'FEATURE', label: 'Feature idea' },
  { value: 'UX', label: 'Usability / design' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Received',
  IN_PROGRESS: 'Under review',
  RESOLVED: 'Resolved',
};

export function FeedbackPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [category, setCategory] = useState<FeedbackCategory>('GENERAL');
  const [rating, setRating] = useState<number | ''>('');
  const [message, setMessage] = useState('');
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    fetchMyFeedback()
      .then((res) => setItems(res.items))
      .catch((err) => {
        logApiError('Load feedback failed', err);
        setError(getApiErrorMessage(err, 'Could not load your feedback.'));
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) {
      setError('Please write at least 10 characters.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await submitFeedback({
        category,
        rating: rating === '' ? undefined : Number(rating),
        message: message.trim(),
      });
      setMessage('');
      setRating('');
      setSuccess('Thank you — your feedback was sent to the platform team.');
      load();
    } catch (err) {
      logApiError('Submit feedback failed', err);
      setError(getApiErrorMessage(err, 'Could not submit feedback.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabel =
    role === 'STUDENT' ? 'student' : role === 'PARENT' ? 'parent' : 'school admin';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Share feedback</h1>
        <p className="text-muted">
          Tell us about your experience as a {roleLabel}. The platform team reviews all
          submissions.
        </p>
      </div>

      <Card>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Submit feedback
        </CardTitle>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4" data-testid="feedback-form">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Category</label>
            <select
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Rating <span className="font-normal text-muted">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(rating === n ? '' : n)}
                  className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-sm transition ${
                    rating === n
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 hover:border-primary/40'
                  }`}
                >
                  <Star
                    className={`h-4 w-4 ${rating === n ? 'fill-primary text-primary' : 'text-muted'}`}
                  />
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Your experience</label>
            <textarea
              required
              minLength={10}
              rows={5}
              data-testid="feedback-message"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="What went well? What was confusing or frustrating?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {success && (
            <p className="text-sm text-success" data-testid="feedback-success">
              {success}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} data-testid="feedback-submit">
            {isSubmitting ? 'Sending…' : 'Send feedback'}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Your submissions</CardTitle>
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {isLoading ? (
          <p className="mt-4 text-sm text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-muted">You have not submitted feedback yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-gray-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">
                    {item.category.replace('_', ' ')}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.status === 'RESOLVED'
                        ? 'bg-success/10 text-success'
                        : item.status === 'IN_PROGRESS'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                </div>
                {item.rating != null && (
                  <p className="mt-1 text-xs text-muted">Rating: {item.rating}/5</p>
                )}
                <p className="mt-2 text-sm text-ink">{item.message}</p>
                <p className="mt-2 text-xs text-muted">{formatDateTime(item.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
