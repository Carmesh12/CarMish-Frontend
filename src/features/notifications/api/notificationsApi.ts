import { authJson } from '../../../lib/api';
import type { Notification } from '../../../stores/notificationStore';

export const notificationsApi = {
  getMyNotifications: () => authJson<Notification[]>('/notifications/me'),
  markAsRead: (id: string) => authJson(`/notifications/${id}/read`, { method: 'PATCH' }),
};
