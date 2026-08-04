// Supabase Edge Function: generate-counseling-case
//
// Generates one new Counseling Simulator case using Gemini and inserts it
// into the counseling_cases (+ counseling_case_questions) tables. Meant to
// be invoked two ways:
//   1. On a daily schedule (Supabase Cron / pg_cron + pg_net), authenticated
//      via a shared secret sent as the `x-cron-secret` header.
//   2. Manually, from the Admin Panel's "Generate with AI" button, using
//      the signed-in admin's own session.
//
// Deploy via the Supabase Dashboard -> Edge Functions -> New Function,
// or `supabase functions deploy generate-counseling-case` with the CLI.
// Requires the GEMINI_API_KEY secret (already set up for counseling-chat)
// and a new CRON_SECRET secret (any string you choose) for the scheduled
// call. Also needs SUPABASE_SERVICE_ROLE_KEY, which Supabase sets
// automatically for every Edge Function.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GEMINI_MODEL = 'gemini-flash-latest'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const caseSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Short case title, e.g. "New inhaler technique"' },
    patient_name: { type: 'string' },
    patient_age: { type: 'integer' },
    patient_gender: { type: 'string', description: 'e.g. "male" or "female"' },
    medication: { type: 'string', description: 'The medication(s) being counseled on' },
    scenario: {
      type: 'string',
      description: 'Two to four sentences setting up the counseling encounter, written for a pharmacy intern to read.',
    },
    difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
    learning_objectives: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4 },
    key_counseling_points: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Short label, e.g. "Administration technique"' },
          detail: { type: 'string', description: 'One sentence a pharmacist should actually say to the patient.' },
        },
        required: ['label', 'detail'],
      },
    },
    common_pitfalls: { type: 'string', description: 'One or two sentences on mistakes interns commonly make with this case.' },
    questions: {
      type: 'array',
      minItems: 2,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          choices: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 4 },
          correct_index: { type: 'integer' },
          explanation: { type: 'string' },
        },
        required: ['question', 'choices', 'correct_index', 'explanation'],
      },
    },
  },
  required: [
    'title',
    'patient_name',
    'patient_age',
    'patient_gender',
    'medication',
    'scenario',
    'difficulty',
    'learning_objectives',
    'key_counseling_points',
    'common_pitfalls',
    'questions',
  ],
}

function buildPrompt(recentMedications: string[]) {
  const avoidLine =
    recentMedications.length > 0
      ? `Avoid reusing these medications, which were covered in recent cases: ${recentMedications.join(', ')}.`
      : ''

  return `Write one realistic, fictional pharmacy patient-counseling case for a pharmacy intern training platform. It should read like a real outpatient community or hospital pharmacy encounter.

Vary the therapeutic area and difficulty from case to case — draw from areas like cardiovascular, respiratory (inhaler technique), diabetes, pain management, antibiotics, mental health, contraception, dermatology, pediatric dosing, or anticoagulation, not just the most common textbook examples. ${avoidLine}

The scenario, key counseling points, and MCQ questions must be clinically accurate and safe to teach from. Do not include any real patient's information — the patient must be entirely fictional. Keep the tone practical and specific, the way a real preceptor would write a case, not generic filler.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) return json({ error: 'GEMINI_API_KEY is not set in Edge Function secrets.' }, 500)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const cronSecret = Deno.env.get('CRON_SECRET')

    const providedCronSecret = req.headers.get('x-cron-secret')
    const isTrustedCron = !!cronSecret && !!providedCronSecret && providedCronSecret === cronSecret

    if (!isTrustedCron) {
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

      const { data: callerProfile, error: profileError } = await callerClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profileError || callerProfile?.role !== 'admin') {
        return json({ error: 'Admin role required' }, 403)
      }
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: recentCases } = await admin
      .from('counseling_cases')
      .select('medication')
      .order('created_at', { ascending: false })
      .limit(15)
    const recentMedications = Array.from(new Set((recentCases ?? []).map((c) => c.medication).filter(Boolean)))

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: buildPrompt(recentMedications) }] }],
          generationConfig: {
            temperature: 1,
            responseMimeType: 'application/json',
            responseSchema: caseSchema,
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('Gemini API error', geminiResponse.status, errText)
      return json({ error: 'Could not generate a case right now.' }, 502)
    }

    const data = await geminiResponse.json()
    const candidate = data.candidates?.[0]
    const rawText = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('')

    if (!rawText) {
      console.error('Gemini returned no case JSON', JSON.stringify(data))
      return json({ error: 'The generator returned nothing usable.' }, 502)
    }

    let generated: Record<string, unknown>
    try {
      generated = JSON.parse(rawText)
    } catch (e) {
      console.error('Failed to parse generated case JSON', rawText)
      return json({ error: 'The generator returned malformed JSON.' }, 502)
    }

    const keyPoints = (generated.key_counseling_points as { label: string; detail: string }[]).map((p, idx) => ({
      id: `p${idx + 1}`,
      label: p.label,
      detail: p.detail,
    }))

    const { data: created, error: insertError } = await admin
      .from('counseling_cases')
      .insert({
        title: generated.title,
        patient_name: generated.patient_name,
        patient_age: generated.patient_age,
        patient_gender: generated.patient_gender,
        medication: generated.medication,
        scenario: generated.scenario,
        difficulty: generated.difficulty,
        learning_objectives: generated.learning_objectives,
        key_counseling_points: keyPoints,
        common_pitfalls: generated.common_pitfalls,
        is_active: true,
        generated_by_ai: true,
        created_by: null,
      })
      .select()
      .single()

    if (insertError || !created) {
      console.error('Insert error', insertError)
      return json({ error: insertError?.message ?? 'Could not save the generated case.' }, 500)
    }

    const questions = (generated.questions as { question: string; choices: string[]; correct_index: number; explanation: string }[]) ?? []
    if (questions.length > 0) {
      const { error: qError } = await admin.from('counseling_case_questions').insert(
        questions.map((q, idx) => ({
          case_id: created.id,
          question: q.question,
          choices: q.choices,
          correct_index: q.correct_index,
          explanation: q.explanation ?? null,
          order_index: idx,
        }))
      )
      if (qError) console.error('Question insert error', qError)
    }

    return json({ case_id: created.id, title: created.title })
  } catch (err) {
    console.error('generate-counseling-case error', err)
    return json({ error: (err as Error).message ?? 'Unexpected error' }, 500)
  }
})
