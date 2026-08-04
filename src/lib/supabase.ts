import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    // The browser's HTTP cache can otherwise serve a stale GET response for
    // a query URL repeated shortly after a write to the same rows (e.g. a
    // refetch right after a save), even though React Query itself always
    // asks for fresh data.
    fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
  },
})
