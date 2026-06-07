import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import { useAuthStore } from '../../../stores/authStore';
import { useNotificationStore } from '../../../stores/notificationStore';
import {
  countUnreadFromOthers,
  getAccountIdFromAccessToken,
  getMyAdminThreads,
  getAdminThread,
  markMessagesFromOthersRead,
  replyToAdminThread,
  type AdminThread,
  type Paginated,
} from '../api';
import { ChatView } from './ChatView';

export function AdminMessagesPage() {
  const { t } = useTranslation();
  const accountId = useAuthStore((s) => s.user?.id) ?? getAccountIdFromAccessToken() ?? '';
  const fetchNotifications = useNotificationStore((s) => s.fetch);
  const [threads, setThreads] = useState<Paginated<AdminThread> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<AdminThread | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyAdminThreads(1, 50).then((res: Paginated<AdminThread>) => {
      if (!cancelled) { setThreads(res); setLoading(false); }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const openThread = async (threadId: string) => {
    setChatLoading(true);
    try {
      const thread = await getAdminThread(threadId);
      setActiveThread(markMessagesFromOthersRead(thread, accountId));
      setThreads((current) => current
        ? {
            ...current,
            data: current.data.map((item) => (
              item.id === threadId ? markMessagesFromOthersRead(item, accountId) : item
            )),
          }
        : current);
      void fetchNotifications();
    } catch { /* silently fail */ }
    finally { setChatLoading(false); }
  };

  const handleReply = async (body: string) => {
    if (!activeThread) return;
    await replyToAdminThread(activeThread.id, body);
    const updated = await getAdminThread(activeThread.id);
    setActiveThread(markMessagesFromOthersRead(updated, accountId));
  };

  if (activeThread) {
    const participantName = activeThread.vendorAccount?.vendor?.businessName
      ?? (activeThread.vendorAccount?.user
        ? `${activeThread.vendorAccount.user.firstName} ${activeThread.vendorAccount.user.lastName}`
        : activeThread.vendorAccount?.email)
      ?? t('messages.requester');
    return (
      <div className="space-y-4">
        <ChatView
          messages={activeThread.messages}
          currentAccountId={accountId}
          isClosed={activeThread.isClosed}
          loading={chatLoading}
          onSend={handleReply}
          onBack={() => setActiveThread(null)}
          title={activeThread.subject}
          subtitle={`${t('messages.requester')}: ${participantName}`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <MessageSquare size={22} className="text-mesh-gold" />
        <h1 className="text-2xl font-bold text-mesh-text">{t('messages.accountMessages')}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : !threads || threads.data.length === 0 ? (
        <Card padding><p className="text-mesh-muted text-sm text-center py-6">{t('messages.noThreads')}</p></Card>
      ) : (
        <div className="space-y-2">
          {threads.data.map((thread) => {
            const lastMsg = thread.messages[0];
            const unread = countUnreadFromOthers(thread.messages, accountId);
            const participantName = thread.vendorAccount?.vendor?.businessName
              ?? (thread.vendorAccount?.user
                ? `${thread.vendorAccount.user.firstName} ${thread.vendorAccount.user.lastName}`
                : thread.vendorAccount?.email)
              ?? t('messages.requester');
            const contextLabel = thread.context === 'THREE_D_PRINT_REQUEST'
              ? t('messages.threeDPrint')
              : thread.context === 'VENDOR_VERIFICATION'
                ? t('messages.verification')
                : t('messages.report');

            return (
              <button key={thread.id} onClick={() => openThread(thread.id)} className="w-full text-left">
                <Card padding className="hover:border-mesh-gold/30 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-mesh-text truncate">{thread.subject}</span>
                        {thread.isClosed && <Badge variant="default" className="text-[10px]">{t('messages.closed')}</Badge>}
                        <Badge variant={thread.context === 'THREE_D_PRINT_REQUEST' ? 'gold' : thread.context === 'VENDOR_VERIFICATION' ? 'info' : 'warning'} className="text-[10px]">
                          {contextLabel}
                        </Badge>
                      </div>
                      <p className="text-xs text-mesh-muted mt-0.5">{participantName}</p>
                      {lastMsg && <p className="text-xs text-mesh-muted/70 mt-1 truncate">{lastMsg.body.slice(0, 100)}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-mesh-muted">{new Date(thread.updatedAt).toLocaleDateString()}</p>
                      {unread > 0 && (
                        <span className="inline-flex items-center justify-center mt-1 min-w-5 h-5 px-1.5 bg-mesh-gold text-black text-[10px] font-bold rounded-full">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
