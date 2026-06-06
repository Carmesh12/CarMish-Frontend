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
  type AdminThread,
  type Paginated,
} from '../api';
import { ChatView } from './ChatView';

export function AdminMessagesPage() {
  const accountId = useAuthStore((s) => s.user?.id) ?? '';
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
      setActiveThread(thread);
    } catch { /* silently fail */ }
    finally { setChatLoading(false); }
  };

  const handleReply = async (body: string) => {
    if (!activeThread) return;
    await replyToAdminThread(activeThread.id, body);
    const updated = await getAdminThread(activeThread.id);
    setActiveThread(updated);
  };

  if (activeThread) {
    const vendorName = activeThread.vendorAccount?.vendor?.businessName
      ?? activeThread.vendorAccount?.email ?? 'Vendor';
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
          subtitle={`Vendor: ${vendorName}`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <MessageSquare size={22} className="text-mesh-gold" />
        <h1 className="text-2xl font-bold text-mesh-text">Vendor Messages</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : !threads || threads.data.length === 0 ? (
        <Card padding><p className="text-mesh-muted text-sm text-center py-6">No vendor message threads.</p></Card>
      ) : (
        <div className="space-y-2">
          {threads.data.map((thread) => {
            const lastMsg = thread.messages[0];
            const unread = thread.messages.filter((m) => !m.isRead).length;
            const vendorName = thread.vendorAccount?.vendor?.businessName ?? thread.vendorAccount?.email ?? 'Vendor';

            return (
              <button key={thread.id} onClick={() => openThread(thread.id)} className="w-full text-left">
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
                      <p className="text-xs text-mesh-muted mt-0.5">{vendorName}</p>
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
