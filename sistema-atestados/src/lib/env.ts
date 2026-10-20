// Leitura centralizada das variáveis de ambiente públicas do Supabase.
// NEXT_PUBLIC_* são substituídas em build; por isso o acesso precisa ser literal.
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  return { url, anonKey }
}

export function requireSupabaseEnv() {
  const { url, anonKey } = getSupabaseEnv()
  if (!url || !anonKey) {
    throw new Error(
      'Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas.'
    )
  }
  return { url, anonKey }
}
