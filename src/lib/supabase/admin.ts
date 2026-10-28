import { createClient } from '@supabase/supabase-js'
import { getServiceKey, getSupabaseEnv } from '@/lib/env'

// Cliente com service_role: usar SOMENTE no servidor (server actions / route handlers).
// Nunca importe este arquivo em componentes 'use client'.
export function createAdminClient() {
  const { url } = getSupabaseEnv()
  const serviceKey = getServiceKey()

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente.')
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
