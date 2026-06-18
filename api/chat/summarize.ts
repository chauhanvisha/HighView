import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../_lib/db'
import { getUserFromRequest } from '../_lib/auth'
import { SESSION_SUMMARY_PROMPT, buildExtractionPrompt, mergeStudentModel, StudentModel, SCENARIO_SKILLS, SkillEvidence } from '../_lib/prompts'
import { createMessage } from '../_lib/ai'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' })

  let userEmail: string
  try { userEmail = await getUserFromRequest(req as any) }
  catch { return res.status(401).json({ detail: 'Unauthorized' }) }

  const { messages, scenario } = req.body || {}
  const MIN_MESSAGES = parseInt(process.env.MIN_MESSAGES_TO_SUMMARIZE || '4', 10)
  if (!messages || messages.length < MIN_MESSAGES) return res.json({ ok: false, reason: 'not enough messages' })

  const supabase = db()
  const SUMMARY_MODEL = process.env.ANTHROPIC_CHAT_MODEL || 'claude-haiku-4-5'
  const EXTRACTION_MODEL = process.env.ANTHROPIC_EXTRACT_MODEL || 'claude-haiku-4-5'
  const SUMMARY_MAX_TOKENS = parseInt(process.env.SUMMARY_MAX_TOKENS || '512', 10)
  const EXTRACTION_MAX_TOKENS = parseInt(process.env.EXTRACTION_MAX_TOKENS || '512', 10)
  const EVIDENCE_MAX_TOKENS = parseInt(process.env.EVIDENCE_MAX_TOKENS || '400', 10)

  try {
    // 1. Summary
    const summary = await createMessage({
      model: SUMMARY_MODEL, maxTokens: SUMMARY_MAX_TOKENS,
      system: 'You are a concise note-taker summarizing a coaching session.',
      messages: [...messages, { role: 'user', content: SESSION_SUMMARY_PROMPT }],
    })
    await supabase.from('ai_coach_notes').insert({ user_email: userEmail, scenario, notes: summary })

    // 2. Memory extraction
    const { data: profileData } = await supabase.from('ai_coach_profiles').select('student_model').eq('user_email', userEmail).single()
    const existingModel: StudentModel = (profileData?.student_model as StudentModel) || {}
    const conversation = messages
      .filter((m: any) => !m.content.startsWith('[The student') && !m.content.startsWith('Error:'))
      .map((m: any) => `${m.role === 'user' ? 'STUDENT' : 'COACH'}: ${m.content}`).join('\n\n')

    const rawExtraction = await createMessage({
      model: EXTRACTION_MODEL, maxTokens: EXTRACTION_MAX_TOKENS,
      system: 'You extract structured observations from coaching conversations. Return only valid JSON.',
      messages: [{ role: 'user', content: buildExtractionPrompt(existingModel, conversation, scenario) }],
    })

    let extracted: any = {}
    try { extracted = JSON.parse(rawExtraction.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim()) } catch {}
    const updatedModel = mergeStudentModel(existingModel, extracted)

    // 2b. Evidence
    const currentSkillKeys = (SCENARIO_SKILLS[scenario] || []).map(s => s.key)
    const skillsToExplain = Object.entries(updatedModel.skill_scores || {}).filter(([k]) => !currentSkillKeys.length || currentSkillKeys.includes(k))
    if (skillsToExplain.length > 0) {
      try {
        const skillList = skillsToExplain.map(([k]) => k).join(', ')
        const rawEv = await createMessage({
          model: EXTRACTION_MODEL, maxTokens: EVIDENCE_MAX_TOKENS,
          system: 'You explain skill assessments. Return ONLY valid JSON, no markdown.',
          messages: [{ role: 'user', content: `Here is a coaching conversation:\n\n${conversation}\n\nFor EACH of these skills: ${skillList}\nwrite ONE specific sentence (max 18 words) explaining what the student did. Return a JSON object mapping each skill key to its sentence.` }],
        })
        const whyMap = JSON.parse(rawEv.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim()) as Record<string, string>
        const today = new Date().toISOString().slice(0, 10)
        const evidence = { ...(updatedModel.skill_evidence || {}) } as Record<string, SkillEvidence[]>
        for (const [skill, score] of skillsToExplain) {
          const why = whyMap[skill]
          if (typeof why === 'string' && why.trim()) {
            const prev = evidence[skill] || []
            evidence[skill] = [...prev, { date: today, note: why.trim(), score }].slice(-6)
          }
        }
        if (Object.keys(evidence).length > 0) updatedModel.skill_evidence = evidence
      } catch {}
    }

    await supabase.from('ai_coach_profiles').upsert({ user_email: userEmail, student_model: updatedModel })

    // 3. Score snapshot
    if (updatedModel.skill_scores && Object.keys(updatedModel.skill_scores).length > 0) {
      await supabase.from('ai_coach_score_snapshots').insert({ user_email: userEmail, scenario, scores: updatedModel.skill_scores }).catch(() => {})
    }

    return res.json({ ok: true, summary, studentModel: updatedModel })
  } catch (e: any) {
    return res.json({ ok: false, reason: e.message })
  }
}
