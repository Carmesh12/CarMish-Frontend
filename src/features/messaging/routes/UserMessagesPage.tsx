import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import { useAuthStore } from '../../../stores/authStore';
import {
  getMyConversations,
  getConversation,
  sendConversationMessage,
  type Conversation,
  type Paginated,
} from '../api';
import { ChatView } from './ChatView';

export function UserMessagesPage() {
  const accountId = useAuthStore((s) => s.user?.id) ?? '';
  const [conversations, setConversations] = useState<Paginated<Conversation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyConversations(1, 50).then((res: Paginated<Conversation>) => {
      if (!cancelled) { setConversations(res); setLoading(false); }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const openConversation = async (convoId: string) => {
    setChatLoading(true);
    try {
      const convo = await getConversation(convoId);
      setActiveConvo(convo);
    } catch { /* silently fail */ }
    finally { setChatLoading(false); }
  };

  const handleReply = async (body: string) => {
    if (!activeConvo) return;
    await sendConversationMessage(activeConvo.id, body);
    const updated = await getConversation(activeConvo.id);
    setActiveConvo(updated);
  };

  if (activeConvo) {
    const vendorName = activeConvo.vendorAccount?.vendor?.businessName
      ?? activeConvo.vendorAccount?.email ?? 'Vendor';
    const vehicleLabel = activeConvo.vehicle ? activeConvo.vehicle.title : '';
    const ctxLabel = activeConvo.context === 'GENERAL' ? 'General inquiry' : activeConvo.context.replace('_', ' ').toLowerCase();
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
        <h1 className="text-2xl font-bold text-mesh-text">My Messages</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : !conversations || conversations.data.length === 0 ? (
        <Card padding><p className="text-mesh-muted text-sm text-center py-6">No conversations yet. Message a vendor from a vehicle listing or purchase request.</p></Card>
      ) : (
        <div className="space-y-2">
          {conversations.data.map((convo) => {
            const lastMsg = convo.messages[0];
            const unread = convo.messages.filter((m) => !m.isRead).length;
            const vendorName = convo.vendorAccount?.vendor?.businessName ?? convo.vendorAccount?.email ?? 'Vendor';
            const ctxLabel = convo.context === 'GENERAL' ? 'General' : convo.context === 'PURCHASE_REQUEST' ? 'Purchase' : 'Rental';

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
      )}
    </div>
  );
}
