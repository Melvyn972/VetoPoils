import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { env, isSupabaseConfigured } from './env'

let supabaseClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    if (import.meta.env.DEV) {
      console.info(
        '[Supabase] Client non configuré — ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_*) dans .env.local',
      )
    }
    return null
  }

  if (!supabaseClient) {
    supabaseClient = createClient(env.supabaseUrl!, env.supabaseAnonKey!)
  }

  return supabaseClient
}
