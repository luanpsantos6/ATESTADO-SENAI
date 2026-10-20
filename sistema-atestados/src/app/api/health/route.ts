import { NextResponse } from 'next/server'
import { getServiceKey, getSupabaseEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

// Abra /api/health no navegador para saber exatamente o que está errado.
export async function GET() {
  const { url, anonKey } = getSupabaseEnv()
  const checks: Record<string, unknown> = {
    NEXT_PUBLIC_SUPABASE_URL: url ?? 'AUSENTE',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey ? 'ok' : 'AUSENTE',
    SUPABASE_SERVICE_ROLE_KEY: getServiceKey() ? 'ok' : 'AUSENTE',
  }

  if (url) {
    const ref = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co$/)?.[1]
    if (!ref) checks.aviso_url = 'URL fora do formato https://<ref>.supabase.co'
    else if (ref.length !== 20)
      checks.aviso_url = `O ID do projeto tem ${ref.length} caracteres (o padrão são 20). Provável erro de digitação/cópia.`

    try {
      const res = await fetch(`${url}/auth/v1/health`, {
        headers: anonKey ? { apikey: anonKey } : {},
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      })
      checks.conexao = `ok (HTTP ${res.status})`
    } catch (e) {
      const code = (e as { cause?: { code?: string } }).cause?.code
      checks.conexao = `FALHOU: ${code ?? (e as Error).message}${
        code === 'ENOTFOUND' ? ' — o endereço não existe; confira a URL no painel do Supabase' : ''
      }`
    }
  }
  return NextResponse.json(checks, { status: 200 })
}
