import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../_lib/db'
import { getUserFromRequest } from '../_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userEmail: string
  try { userEmail = await getUserFromRequest(req as any) }
  catch { return res.status(401).json({ detail: 'Unauthorized' }) }

  const supabase = db()

  if (req.method === 'GET') {
    const scenario = req.query.scenario as string || ''
    const { data } = await supabase
      .from('ai_coach_sessions')
      .select('id,name,scenario,created_at,updated_at')
      .eq('user_email', userEmail)
      .eq('scenario', scenario)
      .order('updated_at', { ascending: false })
      .limit(50)
    return res.json({ sessions: data || [] })
  }

  if (req.method === 'POST') {
    const { scenario, name } = req.body || {}
    const { data, error } = await supabase
      .from('ai_coach_sessions')
      .insert({ user_email: userEmail, scenario, name, messages: [] })
      .select()
      .single()
    if (error) return res.status(500).json({ detail: error.message })
    return res.json(data)
  }

  return res.status(405).json({ detail: 'Method not allowed' })
}
