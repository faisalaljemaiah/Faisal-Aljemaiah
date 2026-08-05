// Supabase Edge Function: op-ai-chat
//
// Powers "OP AI", a general Q&A assistant available to any signed-in user
// (intern, preceptor, or admin) from a floating chat bubble across the app.
// Unlike counseling-chat (which roleplays a patient for practice), this is a
// straight assistant: it can answer general pharmacy/clinical education
// questions and questions about how to use the OP Interns platform. It has
// no tool access to the caller's actual data (schedule, grades, etc.) — it
// only knows the caller's name and role, fetched server-side after verifying
// their session, and whatever they type.
//
// Deploy via the Supabase Dashboard -> Edge Functions -> New Function,
// or `supabase functions deploy op-ai-chat` with the CLI. Requires the
// GEMINI_API_KEY secret (already set for counseling-chat / generate-counseling-case
// — this function reuses the same one).

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GEMINI_MODEL = 'gemini-flash-latest'
const MAX_MESSAGE_LENGTH = 4000
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

function buildSystemInstruction(user: { full_name: string; role: string }) {
  return `You are "OP AI", a friendly assistant built into OP Interns, a pharmacy internship platform for scheduling, clinical learning, and gamification. You're talking with ${user.full_name}, who is signed in as a${user.role === 'admin' ? 'n' : ''} ${user.role}.

What you help with:
- General pharmacy and clinical education questions: drug classes, mechanisms, counseling points, calculations, study help for pharmacy interns.
- Questions about how to use the OP Interns platform itself: Schedule, Drug of the Day, Counseling Simulator, Reflections, Leaderboard, Announcements.

Hard limits — follow these strictly:
- This is for EDUCATION ONLY. You are not a substitute for a licensed pharmacist, the intern's preceptor, or official clinical references (package inserts, Lexicomp, Micromedex, etc.). For anything touching real patient care — actual doses, actual interactions, actual contraindications for a real person — give general educational information and clearly tell them to verify with a supervising pharmacist and official references before acting on it. Never present yourself as making a real clinical decision.
- You have no access to the user's actual account data — their real schedule, grades, points, or submissions. If asked about "my schedule" or similar, say you can't see their personal data and point them to the relevant page in the app instead of guessing.
- If someone describes what sounds like a real medical emergency, tell them to seek immediate in-person care or call emergency services — don't try to handle it in chat.
- Never diagnose or give a treatment plan as if for a real patient in front of you.

Style: keep answers concise and conversational, like a helpful colleague. Use plain text — short paragraphs and simple "-" bullet lists are fine, but no headings or heavy markdown since this renders as plain chat bubbles.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) return json({ error: 'OP AI is not configured yet. Set GEMINI_API_KEY in Edge Function secrets.' }, 500)

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

    const { data: profile } = await callerClient.from('profiles').select('full_name, role').eq('id', user.id).single()

    const body = await req.json()
    const { history, message } = body as { history?: ChatTurn[]; message?: string }

    if (!message || typeof message !== 'string' || !message.trim()) {
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
          system_instruction: {
            parts: [{ text: buildSystemInstruction({ full_name: profile?.full_name ?? 'there', role: profile?.role ?? 'intern' }) }],
          },
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 500 },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('Gemini API error', geminiResponse.status, errText)
      if (geminiResponse.status === 429) {
        return json({ error: 'OP AI is busy right now — try again in a moment.' }, 429)
      }
      return json({ error: 'Could not reach OP AI right now.' }, 502)
    }

    const data = await geminiResponse.json()
    const candidate = data.candidates?.[0]
    const reply = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('').trim()

    if (!reply) {
      const blockReason = candidate?.finishReason ?? data.promptFeedback?.blockReason
      console.error('Gemini returned no text', blockReason, JSON.stringify(data))
      return json({ error: "OP AI didn't have a reply for that — try rephrasing." }, 502)
    }

    return json({ reply })
  } catch (err) {
    console.error('op-ai-chat error', err)
    return json({ error: (err as Error).message ?? 'Unexpected error' }, 500)
  }
})
