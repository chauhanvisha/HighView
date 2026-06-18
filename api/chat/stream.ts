import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../_lib/db'
import { getUserFromRequest } from '../_lib/auth'
import { buildSystemPrompt } from '../_lib/prompts'
import { streamChat } from '../_lib/ai'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' })

  let userEmail: string
  try { userEmail = await getUserFromRequest(req as any) }
  catch { return res.status(401).json({ detail: 'Unauthorized' }) }

  const DEFAULT_NUDGE_LIMIT = parseInt(process.env.DEFAULT_NUDGE_LIMIT || '2', 10)
  const { messages, scenario, nudge_limit = DEFAULT_NUDGE_LIMIT } = req.body || {}

  const supabase = db()

  const [profileRes, checkinRes] = await Promise.all([
    supabase.from('ai_coach_profiles').select('field,target_role,school,weekly_checkin_enabled').eq('user_email', userEmail),
    supabase.from('ai_coach_checkins').select('followed_through,confidence_rating,focus_this_week,created_at').eq('user_email', userEmail).order('created_at', { ascending: false }).limit(1),
  ])

  const profileRow = profileRes.data?.[0] || null
  const profile = profileRow ? { field: profileRow.field, target_role: profileRow.target_role, school: profileRow.school } : null

  const CHECKIN_WINDOW_DAYS = parseInt(process.env.CHECKIN_WINDOW_DAYS || '7', 10)
  const checkinEnabled = profileRow?.weekly_checkin_enabled === true
  const latestCheckin = checkinRes.data?.[0] || null
  const checkinAgeDays = latestCheckin
    ? (Date.now() - new Date(latestCheckin.created_at).getTime()) / (1000 * 60 * 60 * 24)
    : Infinity
  const checkin = checkinEnabled && checkinAgeDays < CHECKIN_WINDOW_DAYS ? latestCheckin : null

  const systemPrompt = buildSystemPrompt({ nudgeLimit: nudge_limit, scenario, profile, checkin })
  const CHAT_MODEL = process.env.ANTHROPIC_CHAT_MODEL || 'claude-haiku-4-5'
  const CHAT_MAX_TOKENS = parseInt(process.env.CHAT_MAX_TOKENS || '2048', 10)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('X-Accel-Buffering', 'no')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  await streamChat({
    model: CHAT_MODEL,
    maxTokens: CHAT_MAX_TOKENS,
    system: systemPrompt,
    messages,
    callbacks: {
      onChunk: (text) => res.write(`data: ${JSON.stringify({ text })}\n\n`),
      onDone: () => { res.write('data: [DONE]\n\n'); res.end() },
      onError: (err) => { res.write(`data: ${JSON.stringify({ error: err })}\n\n`); res.write('data: [DONE]\n\n'); res.end() },
    },
  })
}
