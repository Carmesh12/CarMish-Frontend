import { useEffect, useRef, useState } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';

type Message = {
  id: string;
  senderAccountId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  senderAccount?: { email: string; role: string };
};

type ChatViewProps = {
  messages: Message[];
  currentAccountId: string;
  isClosed: boolean;
  loading: boolean;
  onSend: (body: string) => Promise<void>;
  onBack: () => void;
  title: string;
  subtitle?: string;
};

export function ChatView({ messages, currentAccountId, isClosed, loading, onSend, onBack, title, subtitle }: ChatViewProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || sending || isClosed) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      await onSend(text);
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-mesh-border/30 shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-mesh-sm hover:bg-mesh-surface/50 text-mesh-muted hover:text-mesh-text transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-mesh-text truncate">{title}</h2>
          {subtitle && <p className="text-xs text-mesh-muted truncate">{subtitle}</p>}
        </div>
        {isClosed && <Badge variant="default">Closed</Badge>}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8"><Spinner size={24} /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-mesh-muted text-sm py-8">No messages yet. Start the conversation.</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderAccountId === currentAccountId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-mesh-sm ${
                  isMe
                    ? 'bg-mesh-gold/15 border border-mesh-gold/20'
                    : 'bg-mesh-surface/50 border border-mesh-border/20'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-medium text-mesh-muted">
                      {isMe ? 'You' : (msg.senderAccount?.email?.split('@')[0] ?? 'Other')}
                    </span>
                    {msg.senderAccount?.role && (
                      <Badge variant={msg.senderAccount.role === 'ADMIN' ? 'gold' : msg.senderAccount.role === 'VENDOR' ? 'info' : 'default'} className="text-[9px]">
                        {msg.senderAccount.role}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-mesh-text whitespace-pre-wrap wrap-break-word">{msg.body}</p>
                  <p className="text-[10px] text-mesh-muted/60 mt-1 text-right">
                    {new Date(msg.createdAt).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isClosed ? (
        <form onSubmit={(e) => { e.preventDefault(); void handleSend(); }} className="flex gap-2 pt-3 border-t border-mesh-border/30 shrink-0">
          <div className="flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-3 py-2.5 text-sm bg-mesh-surface/40 border border-mesh-border/30 rounded-mesh-sm text-mesh-text placeholder:text-mesh-muted/60 focus:outline-none focus:border-mesh-gold/50"
              disabled={sending}
            />
          </div>
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="p-2.5 rounded-mesh-sm bg-mesh-gold text-black hover:bg-mesh-gold/80 disabled:opacity-40 transition-colors shrink-0"
          >
            {sending ? <Spinner size={16} /> : <Send size={16} />}
          </button>
        </form>
      ) : (
        <div className="pt-3 border-t border-mesh-border/30 text-center text-sm text-mesh-muted">
          This conversation is closed.
        </div>
      )}
    </div>
  );
}
