/**
 * ROAR AI CHAT SERVICE
 *
 * Handles chat sessions, Server-Sent Events (SSE) streaming responses,
 * memory persistence, and consent preferences.
 */

import { apiUrl } from '../config/api';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
  createdAt?: string;
  isStreaming?: boolean;
}

export interface UserPreferenceItem {
  key: string;
  value: string;
  source: string;
  confidence: number;
}

const SESSION_STORAGE_KEY = 'roar_ai_session_id';
const VISITOR_STORAGE_KEY = 'roar_ai_visitor_id';

function getOrCreateVisitorId(): string {
  let vid = localStorage.getItem(VISITOR_STORAGE_KEY);
  if (!vid) {
    vid = 'v_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem(VISITOR_STORAGE_KEY, vid);
  }
  return vid;
}

export class ChatService {
  private static sessionId: string | null = null;

  public static getVisitorId(): string {
    return getOrCreateVisitorId();
  }

  public static async getOrCreateSession(language: string = 'en'): Promise<string> {
    if (this.sessionId) return this.sessionId;

    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      this.sessionId = stored;
      return stored;
    }

    try {
      const res = await fetch(apiUrl('/api/chat/session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          visitorId: this.getVisitorId(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const id = data.sessionId || data.session?.sessionId || 'sess_' + Date.now();
        this.sessionId = id;
        localStorage.setItem(SESSION_STORAGE_KEY, id);
        return id;
      }
    } catch (e) {
      console.warn('Failed to initialize session with backend, creating local session:', e);
    }

    const fallbackId = 'sess_' + Date.now();
    this.sessionId = fallbackId;
    localStorage.setItem(SESSION_STORAGE_KEY, fallbackId);
    return fallbackId;
  }

  public static async streamMessage({
    message,
    language = 'en',
    onDelta,
    onToolCall,
    onComplete,
    onError,
  }: {
    message: string;
    language?: string;
    onDelta: (delta: string) => void;
    onToolCall?: (tool: { name: string; arguments: Record<string, unknown> }) => void;
    onComplete: (fullText: string) => void;
    onError: (err: Error) => void;
  }): Promise<void> {
    const sessionId = await this.getOrCreateSession(language);
    const visitorId = this.getVisitorId();

    try {
      const response = await fetch(apiUrl('/api/chat/message'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          sessionId,
          visitorId,
          content: message,
          message,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser or empty body returned.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.replace(/^data:\s*/, '').trim();
          if (jsonStr === '[DONE]') {
            onComplete(fullText);
            return;
          }

          try {
            const data = JSON.parse(jsonStr);
            const eventType = data.type;
            const textDelta = data.content || data.text || '';

            if ((eventType === 'text_delta' || eventType === 'text-delta') && textDelta) {
              fullText += textDelta;
              onDelta(textDelta);
            } else if (eventType === 'tool_result' || eventType === 'tool_call') {
              if (onToolCall) {
                onToolCall({
                  name: data.tool || data.name || '',
                  arguments: data.result || data.args || {},
                });
              }
            } else if (eventType === 'message_complete' || eventType === 'done') {
              const final = data.fullResponse || data.content || fullText;
              onComplete(final);
              return;
            } else if (eventType === 'error') {
              onError(new Error(data.error || 'Unknown error occurred in chat stream'));
              return;
            }
          } catch {
            // Partial JSON chunk, continue accumulation
          }
        }
      }

      onComplete(fullText);
    } catch (err) {
      console.error('Chat stream failed:', err);
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  public static async getPreferences(): Promise<{ consentGiven: boolean; preferences: UserPreferenceItem[] }> {
    const sessionId = await this.getOrCreateSession();
    const visitorId = this.getVisitorId();

    try {
      const res = await fetch(apiUrl(`/api/preferences?sessionId=${encodeURIComponent(sessionId)}&visitorId=${encodeURIComponent(visitorId)}`));
      if (res.ok) {
        const data = await res.json();
        return {
          consentGiven: Boolean(data.consentGiven),
          preferences: data.preferences || [],
        };
      }
    } catch (err) {
      console.warn('Failed to load user preferences:', err);
    }

    return { consentGiven: false, preferences: [] };
  }

  public static async updateConsent(consentGiven: boolean): Promise<boolean> {
    const sessionId = await this.getOrCreateSession();
    const visitorId = this.getVisitorId();

    try {
      const res = await fetch(apiUrl('/api/preferences'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          visitorId,
          consentGiven,
          key: 'consentStatus',
          value: consentGiven ? 'granted' : 'declined',
        }),
      });
      return res.ok;
    } catch (err) {
      console.warn('Failed to save consent:', err);
      return false;
    }
  }

  public static async clearPreferences(): Promise<boolean> {
    const sessionId = await this.getOrCreateSession();
    const visitorId = this.getVisitorId();

    try {
      const res = await fetch(apiUrl('/api/preferences'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, visitorId }),
      });
      return res.ok;
    } catch (err) {
      console.warn('Failed to clear preferences:', err);
      return false;
    }
  }
}

