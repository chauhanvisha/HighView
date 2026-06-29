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
    const { data: profileData } = await supabase
      .from('ai_coach_profiles')
      .select('weekly_checkin_enabled')
      .eq('user_email', userEmail)
      .single()

    const enabled = profileData?.weekly_checkin_enabled === true

    const { data: checkinData } = await supabase
      .from('ai_coach_checkins')
      .select('followed_through,confidence_rating,focus_this_week,created_at')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(1)

    const latest = checkinData?.[0] || null
    const ageDays = latest
      ? (Date.now() - new Date(latest.created_at).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity
    const isDue = enabled && ageDays >= 7

    return res.json({ enabled, isDue, latest })
  }

  if (req.method === 'POST') {
    const { followed_through, confidence_rating, focus_this_week } = req.body || {}
    await supabase.from('ai_coach_checkins').insert({
      user_email: userEmail,
      followed_through,
      confidence_rating,
      focus_this_week,
    })
    return res.json({ ok: true })
  }

  return res.status(405).json({ detail: 'Method not allowed' })
}
