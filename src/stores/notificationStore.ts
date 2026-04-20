import { create } from 'zustand';
import { authJson } from '../lib/api';

export interface Notification {
  id: string;
  accountId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const data = await authJson<Notification[]>('/notifications/me');
      set({
        notifications: data,
        unreadCount: data.filter((n) => !n.isRead).length,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  markRead: async (id: string) => {
    try {
      await authJson(`/notifications/${id}/read`, { method: 'PATCH' });
      const notifications = get().notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      );
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      });
    } catch {
      /* silently fail */
    }
  },
}));
