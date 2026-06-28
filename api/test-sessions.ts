import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
    const supabase = createClient(url, key)

    const userEmail = req.headers['x-user-email'] as string || 'unknown'

    const { data, error } = await supabase
      .from('ai_coach_sessions')
      .select('id,name,scenario,created_at,updated_at')
      .eq('user_email', userEmail)
      .eq('scenario', 'interview')
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ sessions: data || [], userEmail })
  } catch (e: any) {
    return res.status(500).json({ error: e.message, stack: e.stack?.split('\n').slice(0, 5) })
  }
}
