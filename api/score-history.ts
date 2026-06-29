import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

function db() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  return createClient(url, key)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userEmail = req.headers['x-user-email'] as string
  if (!userEmail) return res.status(401).json({ detail: 'Unauthorized' })

  const supabase = db()
  const { data } = await supabase
    .from('ai_coach_score_snapshots')
    .select('scenario,scores,created_at')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: true })
    .limit(30)

  return res.json({ snapshots: data || [] })
}
