import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../_lib/db'
import { getUserFromRequest } from '../../_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userEmail: string
  try { userEmail = await getUserFromRequest(req as any) }
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
