import { authJson } from '../../../lib/api';
import type { ChatSession, SendMessageResponse } from '../types';

export const chatApi = {
  createSession: () =>
    authJson<ChatSession>('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  listSessions: () => authJson<ChatSession[]>('/chat/sessions'),

  getSession: (sessionId: string) =>
    authJson<ChatSession>(`/chat/sessions/${sessionId}`),

  sendMessage: (sessionId: string, message: string) =>
    authJson<SendMessageResponse>(`/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  deleteSession: (sessionId: string) =>
    authJson<{ message: string }>(`/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
};

