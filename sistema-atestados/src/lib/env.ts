// Leitura centralizada e "limpa" das variáveis de ambiente do Supabase.
// Remove espaços, aspas, quebras de linha (CRLF do Windows) e "/" final.
function clean(v: string | undefined) {
  return v?.replace(/^["']|["']$/g, '').trim() || undefined
}

export function normalizeUrl(raw: string | undefined) {
  let url = clean(raw)
  if (!url) return undefined
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`
  return url.replace(/\/+$/, '')
}



export function getSupabaseEnv() {
  return {
    url: normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  }
}

export function getServiceKey() {
  return clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
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

/** Traduz erros técnicos (ex.: "fetch failed") em mensagem útil para o usuário. */
export function friendlyError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err)
  const cause = (err as { cause?: { code?: string } } | undefined)?.cause?.code
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|EAI_AGAIN|Failed to fetch/i.test(msg + (cause ?? ''))) {
    return 'Não foi possível conectar ao banco (Supabase). Verifique NEXT_PUBLIC_SUPABASE_URL no .env.local — acesse /api/health para diagnóstico.'
  }
  if (/não configuradas|não configurada/i.test(msg)) {
    return 'Servidor sem as variáveis do Supabase configuradas (.env.local).'
  }
  return null
}
