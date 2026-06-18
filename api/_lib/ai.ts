/**
 * Unified AI client — Anthropic direct or AWS Bedrock (API key auth).
 * AI_PROVIDER=anthropic (default) | AI_PROVIDER=bedrock
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'

export type Provider = 'anthropic' | 'bedrock'

export function getProvider(): Provider {
  const p = (process.env.AI_PROVIDER || 'anthropic').toLowerCase()
  return p === 'bedrock' ? 'bedrock' : 'anthropic'
}

const BEDROCK_MODEL_MAP: Record<string, string> = {
  'claude-haiku-4-5':           'us.anthropic.claude-haiku-4-5-20251001-v1:0',
  'claude-opus-4-7':            'us.anthropic.claude-opus-4-5-20251101-v1:0',
  'claude-sonnet-4-5':          'us.anthropic.claude-sonnet-4-5-20250514-v1:0',
  'claude-3-5-haiku-20241022':  'us.anthropic.claude-3-5-haiku-20241022-v1:0',
  'claude-3-haiku-20240307':    'us.anthropic.claude-3-haiku-20240307-v1:0',
}

function resolveModel(model: string): string {
  if (getProvider() !== 'bedrock') return model
  if (model.startsWith('us.') || model.startsWith('global.') || model.startsWith('arn:')) return model
  return BEDROCK_MODEL_MAP[model] || model
}

export interface AIMessage { role: 'user' | 'assistant'; content: string }
export interface StreamCallbacks { onChunk: (text: string) => void; onDone: () => void; onError: (err: string) => void }

// ── Anthropic
let _anthropic: Anthropic | null = null
function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY required')
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _anthropic
}

// ── Bedrock
let _bedrock: BedrockRuntimeClient | null = null
function getBedrockClient(): BedrockRuntimeClient {
  if (!_bedrock) {
    const apiKey = process.env.AWS_BEDROCK_API_KEY
    const region = process.env.AWS_REGION || 'us-east-1'
    if (!apiKey) throw new Error('AWS_BEDROCK_API_KEY required')
    process.env.AWS_BEARER_TOKEN_BEDROCK = apiKey
    _bedrock = new BedrockRuntimeClient({ region })
  }
  return _bedrock
}

// ── Stream
export async function streamChat(opts: { model: string; maxTokens: number; system: string; messages: AIMessage[]; callbacks: StreamCallbacks }): Promise<void> {
  const provider = getProvider()
  const model = resolveModel(opts.model)
  console.log(`[ai/stream] provider=${provider} model=${model}`)
  provider === 'bedrock' ? await streamBedrock(model, opts) : await streamAnthropic(model, opts)
}

async function streamAnthropic(model: string, opts: { maxTokens: number; system: string; messages: AIMessage[]; callbacks: StreamCallbacks }) {
  try {
    const stream = getAnthropicClient().messages.stream({ model, max_tokens: opts.maxTokens, system: opts.system, messages: opts.messages })
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') opts.callbacks.onChunk(event.delta.text)
    }
    opts.callbacks.onDone()
  } catch (e: any) { opts.callbacks.onError(e.message || 'Stream failed') }
}

async function streamBedrock(model: string, opts: { maxTokens: number; system: string; messages: AIMessage[]; callbacks: StreamCallbacks }) {
  try {
    const body = JSON.stringify({ anthropic_version: 'bedrock-2023-05-31', max_tokens: opts.maxTokens, system: opts.system, messages: opts.messages })
    const resp = await getBedrockClient().send(new InvokeModelWithResponseStreamCommand({ modelId: model, contentType: 'application/json', accept: 'application/json', body: Buffer.from(body) }))
    if (!resp.body) { opts.callbacks.onError('No response body'); return }
    for await (const event of resp.body) {
      if (event.chunk?.bytes) {
        try {
          const parsed = JSON.parse(new TextDecoder().decode(event.chunk.bytes))
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') opts.callbacks.onChunk(parsed.delta.text)
        } catch {}
      }
    }
    opts.callbacks.onDone()
  } catch (e: any) { opts.callbacks.onError(e.message || 'Bedrock stream failed') }
}

// ── Non-streaming
export async function createMessage(opts: { model: string; maxTokens: number; system: string; messages: AIMessage[] }): Promise<string> {
  const provider = getProvider()
  const model = resolveModel(opts.model)
  console.log(`[ai/create] provider=${provider} model=${model}`)
  return provider === 'bedrock' ? createBedrock(model, opts) : createAnthropic(model, opts)
}

async function createAnthropic(model: string, opts: { maxTokens: number; system: string; messages: AIMessage[] }): Promise<string> {
  const res = await getAnthropicClient().messages.create({ model, max_tokens: opts.maxTokens, system: opts.system, messages: opts.messages })
  return (res.content[0] as any).text
}

async function createBedrock(model: string, opts: { maxTokens: number; system: string; messages: AIMessage[] }): Promise<string> {
  const body = JSON.stringify({ anthropic_version: 'bedrock-2023-05-31', max_tokens: opts.maxTokens, system: opts.system, messages: opts.messages })
  const resp = await getBedrockClient().send(new InvokeModelCommand({ modelId: model, contentType: 'application/json', accept: 'application/json', body: Buffer.from(body) }))
  const parsed = JSON.parse(new TextDecoder().decode(resp.body))
  return parsed.content?.[0]?.text
}
