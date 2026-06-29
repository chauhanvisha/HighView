/**
 * API client for the AI Coach features — full port from the original AI Companion.
 */

const BASE = ''

function getAuthHeaders(): Record<string, string> {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return { 'Content-Type': 'application/json', 'x-user-email': user.email || '' }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Message { role: 'user' | 'assistant'; content: string }

export interface ChatSession {
  id: string
  name: string
  scenario: string
  created_at: string
  updated_at: string
}

export interface SessionNote {
  scenario: string
  notes: string
  created_at: string
}

export interface SkillEvidence {
  date: string
  note: string
  score: number
}

export interface StudentModel {
  communication_style?: string
  confidence_level?: string
  recurring_strengths?: string[]
  recurring_weaknesses?: string[]
  what_resonates?: string[]
  trajectory?: string
  preferred_feedback_style?: string
  skill_scores?: Record<string, number>
  skill_evidence?: Record<string, SkillEvidence[]>
  sessions_total?: number
  last_updated?: string
}

export interface Profile {
  field?: string
  target_role?: string
  school?: string
  student_model?: StudentModel
  weekly_checkin_enabled?: boolean
}

export interface CheckinData {
  followed_through?: string
  confidence_rating?: number
  focus_this_week?: string
  created_at?: string
}

export interface CheckinStatus {
  enabled: boolean
  isDue: boolean
  latest: CheckinData | null
}

export interface ScoreSnapshot {
  scenario: string
  scores: Record<string, number>
  created_at: string
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

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<Profile | null> {
  const res = await fetch(`${BASE}/api/profile`, { headers: getAuthHeaders() })
  if (!res.ok) return null
  return res.json().catch(() => null)
}

export async function saveProfile(field: string, target_role: string, school: string) {
  const res = await fetch(`${BASE}/api/profile`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ field, target_role, school }),
  })
  return res.json()
}

export async function saveWeeklyCheckinToggle(enabled: boolean) {
  const res = await fetch(`${BASE}/api/profile`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ weekly_checkin_enabled: enabled }),
  })
  return res.json()
}

// ── Session notes ─────────────────────────────────────────────────────────────

export async function getSessionNotes(): Promise<SessionNote[]> {
  const res = await fetch(`${BASE}/api/session-notes`, { headers: getAuthHeaders() })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({}))
  return (data.notes || []) as SessionNote[]
}

// ── Check-in ──────────────────────────────────────────────────────────────────

export async function getCheckinStatus(): Promise<CheckinStatus> {
  const res = await fetch(`${BASE}/api/checkin`, { headers: getAuthHeaders() })
  if (!res.ok) return { enabled: false, isDue: false, latest: null }
  return res.json().catch(() => ({ enabled: false, isDue: false, latest: null }))
}

export async function saveCheckin(data: Omit<CheckinData, 'created_at'>) {
  const res = await fetch(`${BASE}/api/checkin`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  return res.json()
}

// ── Score history ─────────────────────────────────────────────────────────────

export async function getScoreHistory(): Promise<ScoreSnapshot[]> {
  const res = await fetch(`${BASE}/api/score-history`, { headers: getAuthHeaders() })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({}))
  return data.snapshots || []
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function parseSessionNotes(raw: string): { bullets: string[]; action: string } {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  const bullets: string[] = []
  let action = ''
  for (const line of lines) {
    if (line.startsWith('NEXT:')) {
      action = line.replace(/^NEXT:\s*/i, '').trim()
    } else if (line.startsWith('•') || line.startsWith('-')) {
      bullets.push(line.replace(/^[•\-]\s*/, '').trim())
    }
  }
  return { bullets, action }
}
