export interface StatCard {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  xp?: number;
  isCurrentUser?: boolean;
}

export type LeaderboardScope = 'class' | 'school' | 'global';

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progress?: number;
  icon: 'star' | 'flame' | 'trophy' | 'book' | 'zap';
}

export interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'quiz' | 'badge' | 'score' | 'alert';
}

export interface TopicMastery {
  topic: string;
  percentage: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}
