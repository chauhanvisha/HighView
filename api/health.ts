import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Test imports
    require('@supabase/supabase-js')
    require('@aws-sdk/client-bedrock-runtime')
    
    res.json({
      ok: true,
      env: {
        AI_PROVIDER: process.env.AI_PROVIDER || 'not set',
        AWS_REGION: process.env.AWS_REGION || 'not set',
        HAS_BEDROCK_KEY: !!process.env.AWS_BEDROCK_API_KEY,
        HAS_SUPABASE_URL: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
        HAS_SUPABASE_KEY: !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
      }
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message, stack: e.stack?.split('\n').slice(0, 5) })
  }
}
