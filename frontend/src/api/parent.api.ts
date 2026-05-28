import { apiClient } from './client';

export interface LinkedChild {
  userId: string;
  email: string;
  displayName: string;
  xpPoints: number;
  currentStreak: number;
}

export interface ParentChildSummary {
  child: {
    userId: string;
    displayName: string;
    xpPoints: number;
    currentStreak: number;
    level: number;
    xpInLevel: number;
    xpToNextLevel: number;
  };
  stats: {
    quizzesTaken: number;
    accuracy: number;
    totalAnswers: number;
    pointsEarned: number;
    pointsAvailable: number;
  };
  recentActivity: {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: string;
  }[];
}

export async function fetchLinkedChildren(): Promise<LinkedChild[]> {
  const { data } = await apiClient.get<LinkedChild[]>('/parent/children');
  return data;
}

export async function linkStudentByEmail(studentEmail: string): Promise<LinkedChild> {
  const { data } = await apiClient.post<LinkedChild>('/parent/link', { studentEmail });
  return data;
}

export async function fetchParentChildSummary(
  studentId?: string,
): Promise<ParentChildSummary> {
  const { data } = await apiClient.get<ParentChildSummary>('/parent/child-summary', {
    params: studentId ? { studentId } : undefined,
  });
  return data;
}
