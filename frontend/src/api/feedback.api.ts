import { apiClient } from './client';
import type { UserRole } from '@/types/auth';

export type FeedbackCategory = 'GENERAL' | 'BUG' | 'FEATURE' | 'UX' | 'OTHER';
export type FeedbackStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface FeedbackItem {
  id: string;
  category: FeedbackCategory;
  rating: number | null;
  message: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFeedbackItem extends FeedbackItem {
  schoolId: string | null;
  schoolName: string | null;
  userId: string;
  userEmail: string | null;
  userDisplayName: string | null;
  role: UserRole;
  adminNotes: string | null;
}

export interface CreateFeedbackPayload {
  category?: FeedbackCategory;
  rating?: number;
  message: string;
}

export interface UpdateFeedbackPayload {
  status?: FeedbackStatus;
  adminNotes?: string;
}

export interface AdminFeedbackList {
  openCount: number;
  total: number;
  items: AdminFeedbackItem[];
}

export async function submitFeedback(payload: CreateFeedbackPayload): Promise<FeedbackItem> {
  const { data } = await apiClient.post<FeedbackItem>('/feedback', payload);
  return data;
}

export async function fetchMyFeedback(): Promise<{ items: FeedbackItem[] }> {
  const { data } = await apiClient.get<{ items: FeedbackItem[] }>('/feedback/mine');
  return data;
}

export async function fetchAdminFeedback(params?: {
  status?: FeedbackStatus;
  role?: UserRole;
  schoolId?: string;
}): Promise<AdminFeedbackList> {
  const { data } = await apiClient.get<AdminFeedbackList>('/admin/feedback', { params });
  return data;
}

export async function updateAdminFeedback(
  feedbackId: string,
  payload: UpdateFeedbackPayload,
): Promise<AdminFeedbackItem> {
  const { data } = await apiClient.patch<AdminFeedbackItem>(
    `/admin/feedback/${feedbackId}`,
    payload,
  );
  return data;
}
