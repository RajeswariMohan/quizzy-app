import { create } from 'zustand';
import type { ActivityEvent } from '@/types/dashboard';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  activityFeed: ActivityEvent[];
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  setActivityFeed: (events: ActivityEvent[]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  activityFeed: [],

  addNotification: (n) =>
    set((state) => ({
      notifications: [
        {
          ...n,
          id: crypto.randomUUID(),
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ].slice(0, 50),
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    })),

  setActivityFeed: (events) => set({ activityFeed: events }),
}));
