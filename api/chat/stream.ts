import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime'
import Anthropic from '@anthropic-ai/sdk'

// ── Inline helpers (Vercel can't resolve relative _lib imports in nested folders) ──

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

const BEDROCK_MODEL_MAP: Record<string, string> = {
  'claude-haiku-4-5': 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
  'claude-opus-4-7': 'us.anthropic.claude-opus-4-5-20251101-v1:0',
  'claude-sonnet-4-5': 'us.anthropic.claude-sonnet-4-5-20250514-v1:0',
}

function resolveModel(model: string): string {
  if (model.startsWith('us.') || model.startsWith('arn:')) return model
  return BEDROCK_MODEL_MAP[model] || model
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' })

  let userEmail: string
  try { userEmail = getUserEmail(req) }
  catch { return res.status(401).json({ detail: 'Unauthorized' }) }

  const { messages, scenario, nudge_limit = 2 } = req.body || {}
  const CHAT_MODEL = process.env.ANTHROPIC_CHAT_MODEL || 'claude-haiku-4-5'
  const CHAT_MAX_TOKENS = parseInt(process.env.CHAT_MAX_TOKENS || '2048', 10)
  const provider = (process.env.AI_PROVIDER || 'anthropic').toLowerCase()

  // Build a simple system prompt with scenario context
  const supabase = db()
  const { data: profileData } = await supabase
    .from('ai_coach_profiles')
    .select('field,target_role,school')
    .eq('user_email', userEmail)
    .single()

  let systemPrompt = `You are an AI coach for college students. You are running the ${scenario || 'interview'} coaching scenario. Be encouraging, specific, and practical. One question at a time.`
  if (profileData) {
    const { field, target_role, school } = profileData
    if (field || target_role || school) {
      systemPrompt += `\n\nStudent profile: ${[field && `studying ${field}`, target_role && `targeting ${target_role}`, school && `at ${school}`].filter(Boolean).join(', ')}.`
    }
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('X-Accel-Buffering', 'no')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    if (provider === 'bedrock') {
      const apiKey = process.env.AWS_BEDROCK_API_KEY
      const region = process.env.AWS_REGION || 'us-east-1'
      if (apiKey) process.env.AWS_BEARER_TOKEN_BEDROCK = apiKey

      const client = new BedrockRuntimeClient({ region })
      const modelId = resolveModel(CHAT_MODEL)

      const body = JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: CHAT_MAX_TOKENS,
        system: systemPrompt,
        messages,
      })

      const cmd = new InvokeModelWithResponseStreamCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: Buffer.from(body),
      })

      const response = await client.send(cmd)
      if (response.body) {
        for await (const event of response.body) {
          if (event.chunk?.bytes) {
            try {
              const parsed = JSON.parse(new TextDecoder().decode(event.chunk.bytes))
              if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`)
              }
            } catch {}
          }
        }
      }
    } else {
      // Anthropic direct
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const stream = anthropic.messages.stream({
        model: CHAT_MODEL,
        max_tokens: CHAT_MAX_TOKENS,
        system: systemPrompt,
        messages,
      })
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
        }
      }
    }

    res.write('data: [DONE]\n\n')
  } catch (e: any) {
    console.error('[stream] error:', e.message)
    res.write(`data: ${JSON.stringify({ error: e.message || 'Stream failed' })}\n\n`)
    res.write('data: [DONE]\n\n')
  } finally {
    res.end()
  }
}
