import { apiClient } from './client';
import type { UserRole } from '@/types/auth';

export interface EngagementOverview {
  days: number;
  dateFrom: string;
  dateTo: string;
  since: string;
  until: string;
  byRole: {
    role: UserRole;
    activeUsers: number;
    sessionCount: number;
    totalActiveSeconds: number;
    avgSessionSeconds: number;
  }[];
  dailyTrend: {
    date: string;
    activeSeconds: number;
    activeUsers: number;
  }[];
  users: EngagementUserRow[];
}

export interface EngagementUserRow {
  userId: string;
  email: string;
  role: UserRole;
  displayName: string;
  grade: string | null;
  section: string | null;
  totalActiveSeconds: number;
  sessionCount: number;
  lastLoginAt: string | null;
}

export interface MySessionStats {
  totalActiveSeconds: number;
  sessionCount: number;
  lastLoginAt: string | null;
  currentSessionStartedAt: string | null;
  currentSessionActiveSeconds: number;
}

export interface EngagementQuery {
  days?: number;
  dateFrom?: string;
  dateTo?: string;
  role?: UserRole;
  search?: string;
}

export async function fetchEngagementOverview(
  query: EngagementQuery = {},
): Promise<EngagementOverview> {
  const { data } = await apiClient.get<EngagementOverview>('/engagement/overview', {
    params: query,
  });
  return data;
}

export async function fetchMySessionStats(): Promise<MySessionStats> {
  const { data } = await apiClient.get<MySessionStats>('/engagement/me');
  return data;
}
