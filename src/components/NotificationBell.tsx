import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  type Notification,
  useNotificationStore,
} from '../stores/notificationStore';
import { useAuthStore } from '../stores/authStore';

function formatNotificationTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getNotificationPath(notification: Notification, role: string | null) {
  if (notification.relatedEntityType === 'PURCHASE_REQUEST') {
    return role === 'VENDOR' ? '/vendor/purchases' : '/user/purchases';
  }

  if (notification.relatedEntityType === 'RENTAL_REQUEST') {
    return role === 'VENDOR' ? '/vendor/rentals' : '/user/rentals';
  }

  if (notification.relatedEntityType === 'VEHICLE') {
    return notification.relatedEntityId
      ? `/vehicles/${notification.relatedEntityId}`
      : '/vehicles';
  }

  if (notification.relatedEntityType === 'REPORT') {
    return role === 'ADMIN' ? '/admin/reports' : null;
  }

  return null;
}

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const fetchNotifications = useNotificationStore((s) => s.fetch);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const latestNotifications = useMemo(
    () => notifications.slice(0, 10),
    [notifications],
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    void fetchNotifications();
    const intervalId = window.setInterval(() => {
      void fetchNotifications();
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [fetchNotifications, isAuthenticated]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  if (!isAuthenticated) return null;

  const openMenu = () => {
    setOpen((current) => !current);
    void fetchNotifications();
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markRead(notification.id);
    }

    const path = getNotificationPath(notification, role);
    if (path) {
      navigate(path);
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={openMenu}
        aria-label={t('notifications.title')}
        title={t('notifications.title')}
        className="relative text-mesh-muted hover:text-mesh-text transition-colors duration-200 cursor-pointer"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -inset-e-1.5 min-w-4 h-4 px-1 bg-linear-to-r from-mesh-gold to-mesh-gold-hover text-mesh-bg text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(212,168,83,0.3)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute inset-e-0 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-mesh border border-white/8 bg-mesh-surface/95 backdrop-blur-xl shadow-[0_24px_70px_rgba(0,0,0,0.45)] z-50 overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-white/6">
            <div>
              <p className="font-semibold text-mesh-text">
                {t('notifications.title')}
              </p>
              <p className="text-xs text-mesh-muted">
                {unreadCount} {t('notifications.unread')}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs text-mesh-gold hover:text-mesh-gold-hover transition-colors cursor-pointer"
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="p-4 text-sm text-mesh-muted">
                {t('common.loading')}
              </div>
            ) : latestNotifications.length === 0 ? (
              <div className="p-5 text-center text-sm text-mesh-muted">
                {t('notifications.empty')}
              </div>
            ) : (
              latestNotifications.map((notification) => {
                const path = getNotificationPath(notification, role);

                return (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() => void handleNotificationClick(notification)}
                    className={`w-full text-start p-4 border-b border-white/6 last:border-b-0 transition-colors cursor-pointer ${
                      notification.isRead
                        ? 'bg-transparent hover:bg-white/4'
                        : 'bg-mesh-gold/8 hover:bg-mesh-gold/12'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                          notification.isRead
                            ? 'bg-mesh-muted/30'
                            : 'bg-mesh-gold'
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-mesh-text">
                          {notification.title}
                        </span>
                        <span className="block text-sm text-mesh-muted mt-1">
                          {notification.body}
                        </span>
                        <span className="mt-2 flex items-center justify-between gap-3 text-xs text-mesh-muted">
                          <span>{formatNotificationTime(notification.createdAt)}</span>
                          {path && (
                            <span className="text-mesh-gold">
                              {t('notifications.open')}
                            </span>
                          )}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
