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

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('ai_coach_profiles')
      .select('field,target_role,school,student_model,weekly_checkin_enabled')
      .eq('user_email', userEmail)
      .single()

    if (!data) return res.json(null)
    return res.json(data)
  }

  if (req.method === 'POST') {
    const { field, target_role, school, weekly_checkin_enabled } = req.body || {}
    const update: any = { user_email: userEmail, updated_at: new Date().toISOString() }
    if (field !== undefined) update.field = field
    if (target_role !== undefined) update.target_role = target_role
    if (school !== undefined) update.school = school
    if (weekly_checkin_enabled !== undefined) update.weekly_checkin_enabled = weekly_checkin_enabled

    await supabase.from('ai_coach_profiles').upsert(update)
    return res.json({ ok: true })
  }

  return res.status(405).json({ detail: 'Method not allowed' })
}
