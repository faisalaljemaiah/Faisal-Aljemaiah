// Supabase Edge Function: admin-manage-user
//
// Privileged user-account operations (create/delete) that require the
// service role key. This key must never be exposed to the browser, so this
// function verifies the caller is an authenticated admin before performing
// any action, then uses a service-role client to do the actual work.
//
// Deploy via the Supabase Dashboard -> Edge Functions -> New Function,
// or `supabase functions deploy admin-manage-user` with the CLI.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

    // Client scoped to the caller's own JWT, used only to verify identity/role.
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

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const body = await req.json()

    if (body.action === 'create') {
      const { email, full_name, role = 'intern', school, cohort, year_level, phone } = body

      if (!email || !full_name) {
        return json({ error: 'email and full_name are required' }, 400)
      }

      const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name, role },
      })
      if (inviteError) return json({ error: inviteError.message }, 400)

      const newUserId = invited.user.id
      const extraFields: Record<string, string> = {}
      if (school) extraFields.school = school
      if (cohort) extraFields.cohort = cohort
      if (year_level) extraFields.year_level = year_level
      if (phone) extraFields.phone = phone

      if (Object.keys(extraFields).length > 0) {
        await admin.from('profiles').update(extraFields).eq('id', newUserId)
      }

      return json({ user_id: newUserId })
    }

    if (body.action === 'delete') {
      const { user_id } = body
      if (!user_id) return json({ error: 'user_id is required' }, 400)
      if (user_id === user.id) return json({ error: 'You cannot delete your own account' }, 400)

      const { error: deleteError } = await admin.auth.admin.deleteUser(user_id)
      if (deleteError) return json({ error: deleteError.message }, 400)

      return json({ success: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    return json({ error: (err as Error).message ?? 'Unexpected error' }, 500)
  }
})
