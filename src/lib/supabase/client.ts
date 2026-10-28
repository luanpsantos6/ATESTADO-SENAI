import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Acesso literal: o Next só injeta NEXT_PUBLIC_* quando escritas assim.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^["']|["']$/g, '').trim().replace(/\/+$/, '')
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/^["']|["']$/g, '').trim()
  if (!url || !anonKey) {
    throw new Error('Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).')
  }
  return createBrowserClient(url, anonKey)
}
