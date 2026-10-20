import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/env'

type CookieToSet = {
  name: string
  value: string
  options?: Record<string, unknown>
}

const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/professor', '/aluno']
const AUTH_PAGES = ['/login', '/register']

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`))

// Fallback sem rede: existe algum cookie de sessão do Supabase?
function hasSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'))
}

function redirectTo(request: NextRequest, pathname: string, from: NextResponse) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ''
  const res = NextResponse.redirect(url)
  // preserva cookies de sessão renovados
  from.cookies.getAll().forEach((c) => res.cookies.set(c))
  return res
}

/**
 * Renova a sessão do Supabase e aplica redirecionamentos de login.
 * NUNCA lança exceção: um erro aqui derruba o site inteiro na Vercel
 * (500 MIDDLEWARE_INVOCATION_FAILED).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const path = request.nextUrl.pathname

  let loggedIn = false
  let verified = false // true = confirmado pelo Supabase; false = só pelo cookie

  try {
    const { url, anonKey } = getSupabaseEnv()
    if (!url || !anonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes')
    }

    // import dinâmico: se o módulo falhar ao carregar no Edge, o erro cai no catch
    const { createServerClient } = await import('@supabase/ssr')

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    const { data } = await supabase.auth.getUser()
    loggedIn = Boolean(data.user)
    verified = true
  } catch (err) {
    console.error('[middleware] não foi possível validar a sessão:', err)
    loggedIn = hasSessionCookie(request)
  }

  if (!loggedIn && matches(path, PROTECTED_PREFIXES)) {
    return redirectTo(request, '/login', response)
  }

  // só manda para /dashboard se o Supabase confirmou a sessão (evita loop em falhas)
  if (verified && loggedIn && matches(path, AUTH_PAGES)) {
    return redirectTo(request, '/dashboard', response)
  }

  return response
}
