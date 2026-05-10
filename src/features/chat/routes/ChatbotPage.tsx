import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquareText, Plus, Send, Trash2 } from 'lucide-react';
import { chatApi } from '../api/chatApi';
import type { ChatMessage, ChatSession, SendMessageResponse } from '../types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Spinner } from '../../../components/ui/Spinner';
import { Input } from '../../../components/ui/Input';
import { resolveMediaUrl } from '../../../lib/api';

function formatSessionTitle(session: ChatSession): string {
  const dt = new Date(session.createdAt);
  if (Number.isNaN(dt.getTime())) return 'Chat';
  return `Chat • ${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMessageTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  const now = new Date();
  if (isSameDay(dt, now)) return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return dt.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function ChatbotPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recommendations, setRecommendations] = useState<SendMessageResponse['recommendations']>([]);

  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [selectedSessionId, sessions],
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    setError(null);
    try {
      const data = await chatApi.listSessions();
      setSessions(data);
      if (!selectedSessionId && data.length > 0) {
        setSelectedSessionId(data[0].id);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  }, [selectedSessionId]);

  const loadSession = useCallback(async (sessionId: string) => {
    setLoadingSession(true);
    setError(null);
    try {
      const session = await chatApi.getSession(sessionId);
      setMessages(session.messages ?? []);
      setRecommendations([]);
      queueMicrotask(scrollToBottom);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load chat session');
    } finally {
      setLoadingSession(false);
    }
  }, [scrollToBottom]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (selectedSessionId) loadSession(selectedSessionId);
  }, [selectedSessionId, loadSession]);

  useEffect(() => {
    if (messages.length) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleNewChat = async () => {
    setCreatingSession(true);
    setError(null);
    try {
      const created = await chatApi.createSession();
      setSessions((prev) => [created, ...prev]);
      setSelectedSessionId(created.id);
      setMessages([]);
      setRecommendations([]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create session');
    } finally {
      setCreatingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const confirmed = window.confirm('Delete this chat session?');
    if (!confirmed) return;

    setDeletingSessionId(sessionId);
    setError(null);

    try {
      await chatApi.deleteSession(sessionId);

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
        setMessages([]);
        setRecommendations([]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete session');
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleSend = async () => {
    if (!selectedSessionId) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const nowIso = new Date().toISOString();
    const optimisticUserId = `temp-user-${Date.now()}`;
    const optimisticBotId = `temp-bot-${Date.now()}`;

    const optimisticUserMessage: ChatMessage = {
      id: optimisticUserId,
      sessionId: selectedSessionId,
      senderType: 'USER',
      message: trimmed,
      createdAt: nowIso,
    };

    const optimisticBotMessage: ChatMessage = {
      id: optimisticBotId,
      sessionId: selectedSessionId,
      senderType: 'BOT',
      message: 'Thinking...',
      createdAt: nowIso,
    };

    setSending(true);
    setError(null);
    setInput('');
    setMessages((prev) => [...prev, optimisticUserMessage, optimisticBotMessage]);
    queueMicrotask(scrollToBottom);

    try {
      const res = await chatApi.sendMessage(selectedSessionId, trimmed);
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === optimisticUserId) return res.userMessage;
          if (m.id === optimisticBotId) return res.assistantMessage;
          return m;
        }),
      );
      setRecommendations(res.recommendations ?? []);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSessionId ? { ...s, updatedAt: new Date().toISOString() } : s,
        ),
      );
    } catch (e: unknown) {
      const errorText = e instanceof Error ? e.message : 'Failed to send message';
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== optimisticBotId) return m;
          return {
            ...m,
            message: `Error: ${errorText}`,
          };
        }),
      );
      setInput(trimmed);
    } finally {
      setSending(false);
    }
  };

  if (loadingSessions) return <Spinner label="Loading chats..." />;

  const hasSessions = sessions.length > 0;

  return (
    <div className="h-[calc(100vh-132px)] flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MessageSquareText size={22} className="text-mesh-gold" />
          <h1 className="text-2xl font-bold text-mesh-text">Chatbot</h1>
        </div>
        <Button
          variant="primary"
          size="sm"
          loading={creatingSession}
          onClick={handleNewChat}
        >
          <Plus size={16} />
          New Chat
        </Button>
      </div>

      {error && (
        <Card>
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        </Card>
      )}

      {!hasSessions ? (
        <EmptyState
          icon={<MessageSquareText size={48} />}
          title="No chats yet"
          description="Start a new chat to get vehicle recommendations."
          action={<Button onClick={handleNewChat}>New Chat</Button>}
        />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 min-h-0 grid gap-4 lg:grid-cols-[280px_1fr] overflow-hidden">
            {/* Sessions sidebar */}
            <Card padding={false} className="overflow-hidden flex flex-col min-h-0">
            <div className="p-4 border-b border-white/[0.06]">
              <p className="text-sm font-semibold text-mesh-text">Sessions</p>
              <p className="text-xs text-mesh-muted">{sessions.length} total</p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {sessions.map((s) => {
                const active = s.id === selectedSessionId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    className={`w-full text-left px-4 py-3 border-b border-white/[0.06] transition-colors cursor-pointer ${
                      active
                        ? 'bg-mesh-gold/[0.08] text-mesh-text'
                        : 'hover:bg-white/[0.04] text-mesh-muted hover:text-mesh-text'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">
                        {formatSessionTitle(s)}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        {typeof s._count?.messages === 'number' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
                            {s._count.messages}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteSession(s.id);
                          }}
                          disabled={deletingSessionId === s.id}
                          className="p-1 rounded-md hover:bg-white/[0.06] text-mesh-muted hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          aria-label="Delete session"
                          title="Delete"
                        >
                          <Trash2 size={16} className={deletingSessionId === s.id ? 'opacity-50' : ''} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs opacity-70">
                      Updated {formatMessageTime(s.updatedAt)}
                    </p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Chat panel */}
          <Card padding={false} className="overflow-hidden flex flex-col min-h-0">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-mesh-text truncate">
                  {selectedSession ? formatSessionTitle(selectedSession) : 'Chat'}
                </p>
                <p className="text-xs text-mesh-muted">
                  Ask for recommendations like “Toyota for sale in Amman”
                </p>
              </div>
            </div>

            <div className="flex-1 min-h-0 p-4 space-y-3 overflow-y-auto">
              {loadingSession ? (
                <Spinner label="Loading messages..." />
              ) : messages.length === 0 ? (
                <div className="text-sm text-mesh-muted">
                  No messages yet. Send a message to begin.
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.senderType === 'USER';
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-[var(--radius-mesh)] px-4 py-3 border ${
                          isUser
                            ? 'bg-mesh-gold/[0.14] border-mesh-gold/[0.25] text-mesh-text'
                            : m.message.startsWith('Error:')
                              ? 'bg-red-500/[0.08] border-red-500/20 text-red-300'
                              : 'bg-white/[0.04] border-white/[0.08] text-mesh-text'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                        <p className="text-[11px] text-mesh-muted mt-1 text-right">
                          {formatMessageTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/[0.06]">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    disabled={!selectedSessionId || sending}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                </div>
                <Button
                  variant="primary"
                  loading={sending}
                  disabled={!selectedSessionId || input.trim() === ''}
                  onClick={handleSend}
                >
                  <Send size={16} />
                  Send
                </Button>
              </div>
              {!selectedSessionId && (
                <p className="text-xs text-mesh-muted mt-2">
                  Create a chat session to start messaging.
                </p>
              )}
            </div>
          </Card>
          </div>

          {/* Recommendations */}
          {hasSessions && selectedSessionId && recommendations.length > 0 && (
            <Card
              padding={false}
              className="shrink-0 max-h-[220px] overflow-hidden flex flex-col min-h-0"
            >
              <div className="shrink-0 p-4 border-b border-white/[0.06]">
                <h2 className="text-lg font-semibold text-mesh-text">
                  Recommendations
                </h2>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recommendations.map((v) => {
                    const firstImageUrl = v.images?.[0]?.imageUrl ?? null;
                    const thumbSrc = firstImageUrl ? resolveMediaUrl(firstImageUrl) : null;

                    return (
                      <Card key={v.id} className="space-y-2">
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-16 shrink-0 rounded-[var(--radius-mesh)] overflow-hidden border border-white/[0.08] bg-white/[0.04]">
                            {thumbSrc ? (
                              <img
                                src={thumbSrc}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-mesh-text truncate text-base">
                              {v.title}
                            </p>
                            <p className="text-sm text-mesh-muted">
                              {v.brand} {v.model} • {v.year}
                            </p>
                          </div>
                        </div>

                        <div className="text-sm">
                          {v.price && (
                            <span className="text-mesh-gold font-semibold">
                              ${Number(v.price).toLocaleString()}
                            </span>
                          )}
                          {v.rentalPricePerDay && (
                            <span className="text-mesh-muted text-sm ms-2">
                              ${Number(v.rentalPricePerDay).toLocaleString()}/day
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-mesh-muted flex flex-wrap gap-2">
                          {v.locationCity && (
                            <span className="px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
                              {v.locationCity}
                            </span>
                          )}
                          <span className="px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
                            {v.listingType}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

