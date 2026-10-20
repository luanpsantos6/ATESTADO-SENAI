import { NextResponse, type NextRequest } from 'next/server'

// Middleware MÍNIMO: sem Supabase, sem rede, sem imports externos — não tem como falhar.
// A validação real da sessão e do perfil é feita em cada página por requireRole().
const PROTECTED = ['/dashboard', '/admin', '/professor', '/aluno']

export function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname
    const protegida = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))
    if (!protegida) return NextResponse.next()

    const temSessao = request.cookies
      .getAll()
      .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'))

    if (!temSessao) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = ''
      return NextResponse.redirect(url)
    }
  } catch {
    // nunca derruba o site
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/professor/:path*', '/aluno/:path*'],
}
