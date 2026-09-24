import { createClient } from '@supabase/supabase-js'

const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!configuredSupabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

// In production, proxy Supabase HTTP requests through the app domain. Direct
// access to *.supabase.co is unreliable on some mainland China networks.
const supabaseUrl = import.meta.env.PROD && typeof window !== 'undefined'
  ? `${window.location.origin}/supabase`
  : configuredSupabaseUrl

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      apikey: supabaseAnonKey,
    },
  },
})

export const getAuthCallbackUrl = () => `${window.location.origin}/auth/callback`
