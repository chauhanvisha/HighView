import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
    
    let dbTest = 'not tested'
    if (url && key) {
      const supabase = createClient(url, key)
      const { error } = await supabase.from('ai_coach_sessions').select('id').limit(1)
      dbTest = error ? `error: ${error.message}` : 'connected'
    }

    res.json({
      ok: true,
      dbTest,
      env: {
        AI_PROVIDER: process.env.AI_PROVIDER || 'not set',
        AWS_REGION: process.env.AWS_REGION || 'not set',
        HAS_BEDROCK_KEY: !!process.env.AWS_BEDROCK_API_KEY,
        HAS_SUPABASE_URL: !!url,
        HAS_SUPABASE_KEY: !!key,
        SUPABASE_URL_PREFIX: url.slice(0, 30),
      }
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message, stack: e.stack?.split('\n').slice(0, 5) })
  }
}
