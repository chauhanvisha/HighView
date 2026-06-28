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
