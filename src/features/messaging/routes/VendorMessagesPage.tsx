import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import { useAuthStore } from '../../../stores/authStore';
import {
  getMyAdminThreads,
  getAdminThread,
  replyToAdminThread,
  getMyConversations,
  getConversation,
  sendConversationMessage,
  type AdminThread,
  type Conversation,
  type Paginated,
} from '../api';
import { ChatView } from './ChatView';

export function VendorMessagesPage() {
  const accountId = useAuthStore((s) => s.user?.id) ?? '';
  const [tab, setTab] = useState<'customers' | 'admin'>('customers');

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
      setActiveThread(thread);
    } catch { /* silently fail */ }
    finally { setChatLoading(false); }
  };

  const openConversation = async (convoId: string) => {
    setChatLoading(true);
    try {
      const convo = await getConversation(convoId);
      setActiveConvo(convo);
    } catch { /* silently fail */ }
    finally { setChatLoading(false); }
  };

  const handleAdminReply = async (body: string) => {
    if (!activeThread) return;
    await replyToAdminThread(activeThread.id, body);
    const updated = await getAdminThread(activeThread.id);
    setActiveThread(updated);
  };

  const handleConvoReply = async (body: string) => {
    if (!activeConvo) return;
    await sendConversationMessage(activeConvo.id, body);
    const updated = await getConversation(activeConvo.id);
    setActiveConvo(updated);
  };

  if (activeThread) {
    const adminName = activeThread.adminAccount?.admin
      ? `${activeThread.adminAccount.admin.firstName} ${activeThread.adminAccount.admin.lastName}`
      : (activeThread.adminAccount?.email ?? 'Admin');
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
          subtitle={`Admin: ${adminName}`}
        />
      </div>
    );
  }

  if (activeConvo) {
    const userName = activeConvo.userAccount?.user
      ? `${activeConvo.userAccount.user.firstName} ${activeConvo.userAccount.user.lastName}`
      : (activeConvo.userAccount?.email ?? 'Customer');
    const vehicleLabel = activeConvo.vehicle ? `${activeConvo.vehicle.title}` : '';
    const ctxLabel = activeConvo.context === 'GENERAL' ? 'General inquiry' : activeConvo.context.replace('_', ' ').toLowerCase();
    return (
      <div className="space-y-4">
        <ChatView
          messages={activeConvo.messages}
          currentAccountId={accountId}
          isClosed={activeConvo.isClosed}
          loading={chatLoading}
          onSend={handleConvoReply}
          onBack={() => setActiveConvo(null)}
          title={`${userName}${vehicleLabel ? ` - ${vehicleLabel}` : ''}`}
          subtitle={ctxLabel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <MessageSquare size={22} className="text-mesh-gold" />
        <h1 className="text-2xl font-bold text-mesh-text">Messages</h1>
      </div>

      <div className="flex gap-1 bg-mesh-surface/40 rounded-mesh-sm p-1 w-fit">
        <button onClick={() => { setTab('customers'); }} className={`px-4 py-1.5 text-sm font-medium rounded-mesh-sm transition-colors ${tab === 'customers' ? 'bg-mesh-gold text-black' : 'text-mesh-muted hover:text-mesh-text'}`}>
          Customer Messages
        </button>
        <button onClick={() => { setTab('admin'); }} className={`px-4 py-1.5 text-sm font-medium rounded-mesh-sm transition-colors ${tab === 'admin' ? 'bg-mesh-gold text-black' : 'text-mesh-muted hover:text-mesh-text'}`}>
          Admin Messages
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : tab === 'admin' ? (
        <ThreadList
          threads={adminThreads?.data ?? []}
          onOpen={openThread}
          emptyText="No messages from admin."
          type="admin"
        />
      ) : (
        <ConversationList
          conversations={conversations?.data ?? []}
          onOpen={openConversation}
          emptyText="No customer messages yet."
          viewAs="vendor"
        />
      )}
    </div>
  );
}

function ThreadList({ threads, onOpen, emptyText, type }: {
  threads: AdminThread[];
  onOpen: (id: string) => void;
  emptyText: string;
  type: 'admin' | 'vendor';
}) {
  if (threads.length === 0) {
    return <Card padding><p className="text-mesh-muted text-sm text-center py-6">{emptyText}</p></Card>;
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => {
        const lastMsg = thread.messages[0];
        const unread = thread.messages.filter((m) => !m.isRead).length;
        const otherParty = type === 'admin'
          ? (thread.vendorAccount?.vendor?.businessName ?? thread.vendorAccount?.email ?? 'Vendor')
          : (thread.adminAccount?.email ?? 'Admin');

        return (
          <button key={thread.id} onClick={() => onOpen(thread.id)} className="w-full text-left">
            <Card padding className="hover:border-mesh-gold/30 transition-colors cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-mesh-text truncate">{thread.subject}</span>
                    {thread.isClosed && <Badge variant="default" className="text-[10px]">Closed</Badge>}
                    <Badge variant={thread.context === 'VENDOR_VERIFICATION' ? 'info' : 'warning'} className="text-[10px]">
                      {thread.context === 'VENDOR_VERIFICATION' ? 'Verification' : 'Report'}
                    </Badge>
                  </div>
                  <p className="text-xs text-mesh-muted mt-0.5">{otherParty}</p>
                  {lastMsg && (
                    <p className="text-xs text-mesh-muted/70 mt-1 truncate">{lastMsg.body.slice(0, 100)}</p>
                  )}
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

function ConversationList({ conversations, onOpen, emptyText, viewAs }: {
  conversations: Conversation[];
  onOpen: (id: string) => void;
  emptyText: string;
  viewAs: 'user' | 'vendor';
}) {
  if (conversations.length === 0) {
    return <Card padding><p className="text-mesh-muted text-sm text-center py-6">{emptyText}</p></Card>;
  }

  return (
    <div className="space-y-2">
      {conversations.map((convo) => {
        const lastMsg = convo.messages[0];
        const unread = convo.messages.filter((m) => !m.isRead).length;
        const otherParty = viewAs === 'vendor'
          ? (convo.userAccount?.user ? `${convo.userAccount.user.firstName} ${convo.userAccount.user.lastName}` : convo.userAccount?.email ?? 'Customer')
          : (convo.vendorAccount?.vendor?.businessName ?? convo.vendorAccount?.email ?? 'Vendor');
        const ctxLabel = convo.context === 'GENERAL' ? 'General' : convo.context === 'PURCHASE_REQUEST' ? 'Purchase' : 'Rental';

        return (
          <button key={convo.id} onClick={() => onOpen(convo.id)} className="w-full text-left">
            <Card padding className="hover:border-mesh-gold/30 transition-colors cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-mesh-text truncate">{otherParty}</span>
                    <Badge variant={convo.context === 'GENERAL' ? 'info' : convo.context === 'PURCHASE_REQUEST' ? 'gold' : 'warning'} className="text-[10px]">
                      {ctxLabel}
                    </Badge>
                    {convo.isClosed && <Badge variant="default" className="text-[10px]">Closed</Badge>}
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
  );
}
