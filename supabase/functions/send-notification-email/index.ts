// Supabase Edge Function: send-notification-email
//
// Called by a Database Webhook whenever a row is inserted into
// public.notifications (see supabase/migrations/0010_notification_broadcasts.sql
// for what creates those rows). Emails the recipient for the notification
// types that should reach an inbox: new Drug of the Day, new counseling
// case, and shift assignments/updates. Other notification types (in-app
// only, e.g. reflection reviewed, badges) are ignored.
//
// Deploy via the Supabase Dashboard -> Edge Functions -> New Function,
// or `supabase functions deploy send-notification-email` with the CLI.
// Requires these secrets:
//   RESEND_API_KEY        - from resend.com
//   NOTIFY_WEBHOOK_SECRET  - any string you choose; must match the header
//                            configured on the Database Webhook
//   NOTIFICATIONS_FROM_EMAIL - optional, defaults to onboarding@resend.dev
//                              (only deliverable to your own Resend signup
//                              email until you verify a domain)
//   APP_URL                - optional, defaults to the production app URL

import { createClient } from 'jsr:@supabase/supabase-js@2'

const EMAILED_TYPES = new Set(['drug_of_day', 'counseling', 'shift'])
const DEFAULT_APP_URL = 'https://faisal-aljemaiah.vercel.app'
const DEFAULT_FROM = 'OP Interns <onboarding@resend.dev>'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const webhookSecret = Deno.env.get('NOTIFY_WEBHOOK_SECRET')
    if (!webhookSecret) return json({ error: 'NOTIFY_WEBHOOK_SECRET is not set in Edge Function secrets.' }, 500)
    if (req.headers.get('x-webhook-secret') !== webhookSecret) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) return json({ error: 'RESEND_API_KEY is not set in Edge Function secrets.' }, 500)

    const payload = await req.json()
    const record = payload?.record as
      | { user_id: string; type: string; title: string; body: string | null; link: string | null }
      | undefined

    if (!record || !EMAILED_TYPES.has(record.type)) {
      return json({ skipped: true })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('email, full_name, is_active')
      .eq('id', record.user_id)
      .single()

    if (profileError || !profile?.email || !profile.is_active) {
      return json({ skipped: true, reason: 'No active profile/email for recipient' })
    }

    const appUrl = Deno.env.get('APP_URL') || DEFAULT_APP_URL
    const linkUrl = `${appUrl}${record.link ?? ''}`
    const fromAddress = Deno.env.get('NOTIFICATIONS_FROM_EMAIL') || DEFAULT_FROM

    const html = `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <p style="color:#1a5c3f; font-weight:600; font-size:14px; margin: 0 0 16px;">OP Interns</p>
        <h2 style="margin: 0 0 8px; font-size: 18px;">${escapeHtml(record.title)}</h2>
        ${record.body ? `<p style="color:#444; font-size:14px; line-height:1.5;">${escapeHtml(record.body)}</p>` : ''}
        <a href="${linkUrl}" style="display:inline-block; margin-top:16px; padding:10px 18px; background:#1a5c3f; color:#fff; text-decoration:none; border-radius:6px; font-size:14px;">Open in OP Interns</a>
      </div>
    `

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: profile.email,
        subject: record.title,
        html,
      }),
    })

    if (!resendResponse.ok) {
      const errText = await resendResponse.text()
      console.error('Resend API error', resendResponse.status, errText)
      return json({ error: 'Email send failed', detail: errText }, 502)
    }

    return json({ sent: true })
  } catch (err) {
    console.error('send-notification-email error', err)
    return json({ error: (err as Error).message ?? 'Unexpected error' }, 500)
  }
})
