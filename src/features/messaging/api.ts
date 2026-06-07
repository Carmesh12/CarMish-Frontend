import { authJson } from '../../lib/api';

type ReadableMessage = {
  senderAccountId: string;
  isRead: boolean;
};

export type MessageSenderAccount = {
  email: string;
  role: string;
  user?: {
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  } | null;
  vendor?: {
    businessName: string;
    logoUrl: string | null;
  } | null;
  admin?: {
    firstName: string;
    lastName: string;
  } | null;
};

export type ThreadMessage = {
  id: string;
  threadId: string;
  senderAccountId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  senderAccount?: MessageSenderAccount;
};

export type AdminThread = {
  id: string;
  adminAccountId: string;
  vendorAccountId: string;
  subject: string;
  context: string;
  contextEntityId: string | null;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
  messages: ThreadMessage[];
  vendorAccount?: {
    email: string;
    role?: string;
    user?: { firstName: string; lastName: string } | null;
    vendor?: { businessName: string } | null;
  };
  adminAccount?: { email: string; admin?: { firstName: string; lastName: string } | null };
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderAccountId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  senderAccount?: MessageSenderAccount;
};

export type Conversation = {
  id: string;
  userAccountId: string;
  vendorAccountId: string;
  context: string;
  contextEntityId: string | null;
  vehicleId: string | null;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
  userAccount?: { email: string; user?: { firstName: string; lastName: string } | null };
  vendorAccount?: { email: string; vendor?: { businessName: string } | null };
  vehicle?: { id: string; title: string; brand: string; model: string } | null;
};

export type Paginated<T> = {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export function getAccountIdFromAccessToken(): string | null {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string };
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export function countUnreadFromOthers(
  messages: ReadableMessage[],
  currentAccountId: string,
): number {
  return messages.filter((message) => (
    !message.isRead &&
    (!currentAccountId || message.senderAccountId !== currentAccountId)
  )).length;
}

export function markMessagesFromOthersRead<
  TMessage extends ReadableMessage,
  TItem extends { messages: TMessage[] },
>(item: TItem, currentAccountId: string): TItem {
  if (!currentAccountId) return item;

  return {
    ...item,
    messages: item.messages.map((message) => (
      !message.isRead && message.senderAccountId !== currentAccountId
        ? { ...message, isRead: true }
        : message
    )),
  };
}

export function getMyAdminThreads(page = 1, limit = 20) {
  return authJson<Paginated<AdminThread>>(`/admin/messaging/threads?page=${page}&limit=${limit}`);
}

export function getAdminThread(threadId: string) {
  return authJson<AdminThread>(`/admin/messaging/threads/${threadId}`);
}

export function replyToAdminThread(threadId: string, body: string) {
  return authJson<ThreadMessage>(`/admin/messaging/threads/${threadId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export function getMyConversations(page = 1, limit = 20) {
  return authJson<Paginated<Conversation>>(`/conversations/me?page=${page}&limit=${limit}`);
}

export function getConversation(conversationId: string) {
  return authJson<Conversation>(`/conversations/${conversationId}`);
}

export function sendConversationMessage(conversationId: string, body: string) {
  return authJson<ConversationMessage>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export function createConversation(data: {
  vendorAccountId: string;
  context: string;
  contextEntityId?: string;
  vehicleId?: string;
  message: string;
}) {
  return authJson<Conversation>('/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function findOrCreateRequestConversation(data: {
  vendorAccountId: string;
  userAccountId?: string;
  context: 'PURCHASE_REQUEST' | 'RENTAL_REQUEST';
  contextEntityId: string;
  message?: string;
}) {
  return authJson<Conversation>('/conversations/find-or-create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
