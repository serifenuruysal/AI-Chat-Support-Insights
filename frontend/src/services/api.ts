import type { AnalyticsOverview, Conversation, Message } from '../types';

const BASE = '/api';

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  sendMessage: (userId: string, content: string, conversationId?: string) =>
    request<{ conversationId: string; content: string; provider: string; latency: number }>('/chat/message', {
      method: 'POST',
      body: JSON.stringify(conversationId ? { userId, content, conversationId } : { userId, content }),
    }),

  getConversations: (userId: string) =>
    request<{ conversations: Conversation[] }>(`/chat/conversations?userId=${userId}`),

  getMessages: (conversationId: string, userId: string) =>
    request<{ messages: Message[] }>(`/chat/messages/${conversationId}?userId=${userId}`),

  getAnalytics: (days = 30) =>
    request<AnalyticsOverview>(`/analytics/overview?days=${days}`),
};

// ─── WebSocket client ──────────────────────────────────────────────────────
type WSMessage =
  | { type: 'typing'; conversationId: string }
  | { type: 'reply'; conversationId: string; content: string; provider: string; latency: number }
  | { type: 'error'; error: string };

export class ChatSocket {
  private ws: WebSocket | null = null;
  private handlers: ((msg: WSMessage) => void)[] = [];

  connect() {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    this.ws = new WebSocket(`${proto}://${window.location.host}/ws`);

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WSMessage;
        this.handlers.forEach(h => h(msg));
      } catch {}
    };

    this.ws.onclose = () => setTimeout(() => this.connect(), 2000);
    this.ws.onerror = (err) => console.error('WS error', err);
  }

  send(userId: string, content: string, conversationId?: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'message', userId, content, conversationId }));
    }
  }

  onMessage(handler: (msg: WSMessage) => void) {
    this.handlers.push(handler);
    return () => { this.handlers = this.handlers.filter(h => h !== handler); };
  }

  disconnect() { this.ws?.close(); }
}
