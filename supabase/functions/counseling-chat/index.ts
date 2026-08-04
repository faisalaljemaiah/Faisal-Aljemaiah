// Supabase Edge Function: counseling-chat
//
// Lets a signed-in intern hold a live practice conversation with an
// AI-roleplayed "patient" for a Counseling Simulator case. The Gemini API
// key is a server-side secret and never reaches the browser; this function
// only checks that the caller has a valid session before spending it.
//
// Deploy via the Supabase Dashboard -> Edge Functions -> New Function,
// or `supabase functions deploy counseling-chat` with the CLI. Requires the
// GEMINI_API_KEY secret (Dashboard -> Edge Functions -> Secrets, or
// `supabase secrets set GEMINI_API_KEY=...`).

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GEMINI_MODEL = 'gemini-flash-latest'
const MAX_MESSAGE_LENGTH = 2000
const MAX_HISTORY_TURNS = 40

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface ChatTurn {
  role: 'user' | 'model'
  text: string
}

function buildSystemInstruction(c: {
  patient_name: string
  patient_age: number | null
  patient_gender: string | null
  medication: string
  scenario: string
}) {
  const ageGender = [c.patient_age ? `${c.patient_age} years old` : null, c.patient_gender].filter(Boolean).join(', ')

  return `You are role-playing as a patient in a pharmacy counseling training simulation for a pharmacy intern. Stay fully in character as the patient described below. Never break character, never reveal that you are an AI, and never refer to this as a simulation.

Patient: ${c.patient_name}${ageGender ? ` (${ageGender})` : ''}
Medication being discussed: ${c.medication}
Situation: ${c.scenario}

Behave like a real patient would: voice your genuine concerns, ask the questions a real patient would ask, and react naturally to what the intern says. If they explain something clearly, show understanding and relief. If they're vague, skip something important, or use jargon you wouldn't know, react with confusion or a follow-up question, the way a real patient would.

You are the patient, not a teacher or evaluator. Do not state which counseling points are "correct," do not give clinical advice yourself, and do not grade the intern. Keep replies conversational and brief, like real spoken dialogue — a sentence or two, occasionally a bit more, never a lecture.

Text wrapped in parentheses, like "(the intern approaches you)", is a stage direction describing what is physically happening. React to it naturally as the patient would; don't repeat or acknowledge it as spoken text.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) return json({ error: 'Chat is not configured yet. Set GEMINI_API_KEY in Edge Function secrets.' }, 500)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser()
    if (userError || !user) return json({ error: 'Not authenticated' }, 401)

    const body = await req.json()
    const { case: c, history, message } = body as {
      case?: {
        patient_name: string
        patient_age: number | null
        patient_gender: string | null
        medication: string
        scenario: string
      }
      history?: ChatTurn[]
      message?: string
    }

    if (!c?.patient_name || !c?.medication || !c?.scenario) {
      return json({ error: 'Missing case details' }, 400)
    }
    if (!message || typeof message !== 'string') {
      return json({ error: 'Missing message' }, 400)
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return json({ error: 'Message is too long' }, 400)
    }

    const trimmedHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY_TURNS) : []
    const contents = [
      ...trimmedHistory
        .filter((t) => t && (t.role === 'user' || t.role === 'model') && typeof t.text === 'string')
        .map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
      { role: 'user', parts: [{ text: message }] },
    ]

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: buildSystemInstruction(c) }] },
          contents,
          generationConfig: { temperature: 0.9, maxOutputTokens: 220 },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('Gemini API error', geminiResponse.status, errText)
      if (geminiResponse.status === 429) {
        return json({ error: 'The practice patient is busy right now — try again in a moment.' }, 429)
      }
      return json({ error: 'Could not reach the practice patient right now.' }, 502)
    }

    const data = await geminiResponse.json()
    const candidate = data.candidates?.[0]
    const reply = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('').trim()

    if (!reply) {
      const blockReason = candidate?.finishReason ?? data.promptFeedback?.blockReason
      console.error('Gemini returned no text', blockReason, JSON.stringify(data))
      return json({ error: 'The practice patient had nothing to say — try rephrasing.' }, 502)
    }

    return json({ reply })
  } catch (err) {
    console.error('counseling-chat error', err)
    return json({ error: (err as Error).message ?? 'Unexpected error' }, 500)
  }
})
