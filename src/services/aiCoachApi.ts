/**
 * API client for the AI Coach features.
 * All calls use the user's email from localStorage for auth.
 */

const BASE = ''  // same-origin on Vercel

function getAuthHeaders(): Record<string, string> {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return {
    'Content-Type': 'application/json',
    'x-user-email': user.email || '',
  }
}

export interface Message { role: 'user' | 'assistant'; content: string }

export interface ChatSession {
  id: string
  name: string
  scenario: string
  created_at: string
  updated_at: string
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function getChatSessions(scenario: string): Promise<ChatSession[]> {
  const res = await fetch(`${BASE}/api/chat/sessions?scenario=${scenario}`, { headers: getAuthHeaders() })
  const data = await res.json()
  return data.sessions || []
}

export async function createChatSession(scenario: string, name: string): Promise<ChatSession> {
  const res = await fetch(`${BASE}/api/chat/sessions`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ scenario, name }),
  })
  return res.json()
}

export async function getChatSessionMessages(id: string): Promise<Message[]> {
  const res = await fetch(`${BASE}/api/chat/session/${id}`, { headers: getAuthHeaders() })
  const data = await res.json()
  return data.messages || []
}

export async function updateChatSession(id: string, messages: Message[]): Promise<void> {
  await fetch(`${BASE}/api/chat/session/${id}`, {
    method: 'PUT', headers: getAuthHeaders(),
    body: JSON.stringify({ messages }),
  })
}

export async function deleteChatSession(id: string): Promise<void> {
  await fetch(`${BASE}/api/chat/session/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
}

// ── Streaming chat ────────────────────────────────────────────────────────────

export function streamChat(
  messages: Message[], scenario: string, nudgeLimit: number,
  onChunk: (text: string) => void, onDone: () => void, onError: (err: string) => void,
) {
  fetch(`${BASE}/api/chat/stream`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ messages, scenario, nudge_limit: nudgeLimit }),
  }).then(async (res) => {
    if (!res.ok) { onError('Stream failed'); return }
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') { onDone(); return }
          try {
            const parsed = JSON.parse(payload)
            if (parsed.error) { onError(parsed.error); return }
            if (parsed.text) onChunk(parsed.text)
          } catch {}
        }
      }
    }
    onDone()
  }).catch((e) => onError(e.message))
}

// ── Summarize ─────────────────────────────────────────────────────────────────

export async function summarizeSession(messages: Message[], scenario: string) {
  const res = await fetch(`${BASE}/api/chat/summarize`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ messages, scenario }),
  })
  if (!res.ok) return null
  return res.json().catch(() => null)
}
