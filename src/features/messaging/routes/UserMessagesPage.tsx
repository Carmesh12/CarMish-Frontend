import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import { useAuthStore } from '../../../stores/authStore';
import {
  countUnreadFromOthers,
  getAccountIdFromAccessToken,
  getAdminThread,
  getMyAdminThreads,
  getMyConversations,
  getConversation,
  markMessagesFromOthersRead,
  replyToAdminThread,
  sendConversationMessage,
  type AdminThread,
  type Conversation,
  type Paginated,
} from '../api';
import { ChatView } from './ChatView';
import { useNotificationStore } from '../../../stores/notificationStore';

export function UserMessagesPage() {
  const { t } = useTranslation();
  const accountId = useAuthStore((s) => s.user?.id) ?? getAccountIdFromAccessToken() ?? '';
  const fetchNotifications = useNotificationStore((s) => s.fetch);
  const [tab, setTab] = useState<'vendors' | 'admin'>('vendors');
  const [adminThreads, setAdminThreads] = useState<Paginated<AdminThread> | null>(null);
  const [conversations, setConversations] = useState<Paginated<Conversation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<AdminThread | null>(null);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (tab === 'admin') {
      getMyAdminThreads(1, 50).then((res: Paginated<AdminThread>) => {
        if (!cancelled) { setAdminThreads(res); setLoading(false); }
      }).catch(() => { if (!cancelled) setLoading(false); });
    } else {
      getMyConversations(1, 50).then((res: Paginated<Conversation>) => {
        if (!cancelled) { setConversations(res); setLoading(false); }
      }).catch(() => { if (!cancelled) setLoading(false); });
    }
    return () => { cancelled = true; };
  }, [tab]);

  const openThread = async (threadId: string) => {
    setChatLoading(true);
    try {
      const thread = await getAdminThread(threadId);
      setActiveThread(markMessagesFromOthersRead(thread, accountId));
      setAdminThreads((current) => current
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

  const openConversation = async (convoId: string) => {
    setChatLoading(true);
    try {
      const convo = await getConversation(convoId);
      setActiveConvo(markMessagesFromOthersRead(convo, accountId));
      setConversations((current) => current
        ? {
            ...current,
            data: current.data.map((item) => (
              item.id === convoId ? markMessagesFromOthersRead(item, accountId) : item
            )),
          }
        : current);
      void fetchNotifications();
    } catch { /* silently fail */ }
    finally { setChatLoading(false); }
  };

  const handleReply = async (body: string) => {
    if (!activeConvo) return;
    await sendConversationMessage(activeConvo.id, body);
    const updated = await getConversation(activeConvo.id);
    setActiveConvo(markMessagesFromOthersRead(updated, accountId));
  };

  const handleAdminReply = async (body: string) => {
    if (!activeThread) return;
    await replyToAdminThread(activeThread.id, body);
    const updated = await getAdminThread(activeThread.id);
    setActiveThread(markMessagesFromOthersRead(updated, accountId));
  };

  if (activeThread) {
    const adminName = activeThread.adminAccount?.admin
      ? `${activeThread.adminAccount.admin.firstName} ${activeThread.adminAccount.admin.lastName}`
      : (activeThread.adminAccount?.email ?? t('messages.admin'));
    return (
      <div className="space-y-4">
        <ChatView
          messages={activeThread.messages}
          currentAccountId={accountId}
          isClosed={activeThread.isClosed}
          loading={chatLoading}
          onSend={handleAdminReply}
          onBack={() => setActiveThread(null)}
          title={activeThread.subject}
          subtitle={`${t('messages.admin')}: ${adminName}`}
        />
      </div>
    );
  }

  if (activeConvo) {
    const vendorName = activeConvo.vendorAccount?.vendor?.businessName
      ?? activeConvo.vendorAccount?.email ?? t('messages.vendor');
    const vehicleLabel = activeConvo.vehicle ? activeConvo.vehicle.title : '';
    const ctxLabel = activeConvo.context === 'GENERAL' ? t('messages.generalInquiry') : activeConvo.context.replace('_', ' ').toLowerCase();
    return (
      <div className="space-y-4">
        <ChatView
          messages={activeConvo.messages}
          currentAccountId={accountId}
          isClosed={activeConvo.isClosed}
          loading={chatLoading}
          onSend={handleReply}
          onBack={() => setActiveConvo(null)}
          title={`${vendorName}${vehicleLabel ? ` - ${vehicleLabel}` : ''}`}
          subtitle={ctxLabel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <MessageSquare size={22} className="text-mesh-gold" />
        <h1 className="text-2xl font-bold text-mesh-text">{t('messages.myMessages')}</h1>
      </div>

      <div className="flex gap-1 bg-mesh-surface/40 rounded-mesh-sm p-1 w-fit">
        <button onClick={() => setTab('vendors')} className={`px-4 py-1.5 text-sm font-medium rounded-mesh-sm transition-colors ${tab === 'vendors' ? 'bg-mesh-gold text-black' : 'text-mesh-muted hover:text-mesh-text'}`}>
          {t('messages.vendorMessages')}
        </button>
        <button onClick={() => setTab('admin')} className={`px-4 py-1.5 text-sm font-medium rounded-mesh-sm transition-colors ${tab === 'admin' ? 'bg-mesh-gold text-black' : 'text-mesh-muted hover:text-mesh-text'}`}>
          {t('messages.adminMessages')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : tab === 'admin' ? (
        <AdminThreadList
          threads={adminThreads?.data ?? []}
          onOpen={openThread}
          currentAccountId={accountId}
        />
      ) : !conversations || conversations.data.length === 0 ? (
        <Card padding><p className="text-mesh-muted text-sm text-center py-6">{t('messages.noConversations')}</p></Card>
      ) : (
        <div className="space-y-2">
          {conversations.data.map((convo) => {
            const lastMsg = convo.messages[0];
            const unread = countUnreadFromOthers(convo.messages, accountId);
            const vendorName = convo.vendorAccount?.vendor?.businessName ?? convo.vendorAccount?.email ?? t('messages.vendor');
            const ctxLabel = convo.context === 'GENERAL' ? t('messages.general') : convo.context === 'PURCHASE_REQUEST' ? t('messages.purchase') : t('messages.rental');

            return (
              <button key={convo.id} onClick={() => openConversation(convo.id)} className="w-full text-left">
                <Card padding className="hover:border-mesh-gold/30 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-mesh-text truncate">{vendorName}</span>
                        <Badge variant={convo.context === 'GENERAL' ? 'info' : convo.context === 'PURCHASE_REQUEST' ? 'gold' : 'warning'} className="text-[10px]">
                          {ctxLabel}
                        </Badge>
                        {convo.isClosed && <Badge variant="default" className="text-[10px]">{t('messages.closed')}</Badge>}
                      </div>
                      {convo.vehicle && <p className="text-xs text-mesh-muted mt-0.5">{convo.vehicle.title} ({convo.vehicle.brand})</p>}
                      {lastMsg && <p className="text-xs text-mesh-muted/70 mt-1 truncate">{lastMsg.body.slice(0, 100)}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-mesh-muted">{new Date(convo.updatedAt).toLocaleDateString()}</p>
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

function AdminThreadList({ threads, onOpen, currentAccountId }: {
  threads: AdminThread[];
  onOpen: (id: string) => void;
  currentAccountId: string;
}) {
  const { t } = useTranslation();

  if (threads.length === 0) {
    return <Card padding><p className="text-mesh-muted text-sm text-center py-6">{t('messages.noAdminMessages')}</p></Card>;
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => {
        const lastMsg = thread.messages[0];
        const unread = countUnreadFromOthers(thread.messages, currentAccountId);
        const contextLabel = thread.context === 'THREE_D_PRINT_REQUEST'
          ? t('messages.threeDPrint')
          : thread.context === 'VENDOR_VERIFICATION'
            ? t('messages.verification')
            : t('messages.report');
        return (
          <button key={thread.id} onClick={() => onOpen(thread.id)} className="w-full text-left">
            <Card padding className="hover:border-mesh-gold/30 transition-colors cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-mesh-text truncate">{thread.subject}</span>
                    <Badge variant={thread.context === 'THREE_D_PRINT_REQUEST' ? 'gold' : 'info'} className="text-[10px]">
                      {contextLabel}
                    </Badge>
                    {thread.isClosed && <Badge variant="default" className="text-[10px]">{t('messages.closed')}</Badge>}
                  </div>
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
  );
}
