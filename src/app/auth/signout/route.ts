import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Encerra a sessão e volta ao login. Route Handlers podem escrever cookies,
// diferente de Server Components.
export async function GET(request: NextRequest) {
  const motivo = request.nextUrl.searchParams.get('motivo') ?? ''
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.error('[signout]', err)
  }
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.search = motivo ? `?erro=${encodeURIComponent(motivo)}` : ''
  return NextResponse.redirect(url)
}
