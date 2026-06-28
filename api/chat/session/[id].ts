import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

function db() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  return createClient(url, key)
}

function getUserEmail(req: VercelRequest): string {
  const email = req.headers['x-user-email'] as string
  if (!email) throw new Error('Unauthorized')
  return email
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userEmail: string
  try { userEmail = getUserEmail(req) }
  catch { return res.status(401).json({ detail: 'Unauthorized' }) }

  const id = req.query.id as string
  const supabase = db()

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('ai_coach_sessions')
      .select('messages')
      .eq('id', id)
      .eq('user_email', userEmail)
      .single()
    return res.json({ messages: data?.messages || [] })
  }

  if (req.method === 'PUT') {
    const { messages, name } = req.body || {}
    const update: any = { messages, updated_at: new Date().toISOString() }
    if (name) update.name = name
    await supabase.from('ai_coach_sessions').update(update).eq('id', id).eq('user_email', userEmail)
    return res.json({ ok: true })
  }

  if (req.method === 'DELETE') {
    await supabase.from('ai_coach_sessions').delete().eq('id', id).eq('user_email', userEmail)
    return res.json({ ok: true })
  }

  return res.status(405).json({ detail: 'Method not allowed' })
}
