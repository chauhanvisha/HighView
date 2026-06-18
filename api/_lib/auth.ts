/**
 * Auth helper for Vercel serverless functions.
 * Validates the user from the request using one of:
 *  1. Supabase auth token (Authorization: Bearer <supabase-jwt>)
 *  2. Simple email header (x-user-email) — for local dev / internal calls
 *
 * Returns the user's email (used as the identity key for all AI coach data).
 */

import { db } from './db'

export async function getUserFromRequest(req: any): Promise<string> {
  let auth = ''
  if (typeof req.headers?.get === 'function') {
    auth = req.headers.get('authorization') || ''
  } else {
    auth = (req.headers?.['authorization'] || req.headers?.['Authorization'] || '') as string
  }

  const token = auth.replace(/^Bearer\s+/i, '').trim()

  if (token) {
    // Validate with Supabase — getUser() verifies the JWT
    const supabase = db()
    const { data, error } = await supabase.auth.getUser(token)
    if (!error && data.user?.email) {
      return data.user.email
    }
  }

  // Fallback: check x-user-email header (set by frontend from localStorage)
  const emailHeader = typeof req.headers?.get === 'function'
    ? req.headers.get('x-user-email')
    : req.headers?.['x-user-email']

  if (emailHeader) return emailHeader as string

  throw new Error('Unauthorized')
}
