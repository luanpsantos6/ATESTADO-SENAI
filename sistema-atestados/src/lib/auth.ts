import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Role, User } from '@/types/database'

/**
 * Garante usuário autenticado, ativo e com um dos perfis informados.
 * Redireciona quando não atende. Use no topo de cada página protegida.
 */
export async function requireRole(roles: Role | Role[]) {
  const allowed = Array.isArray(roles) ? roles : [roles]
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single<User>()

  // /auth/signout encerra a sessão (Server Components não conseguem limpar cookies)
  // e evita o loop /dashboard <-> /login.
  if (!profile) redirect('/auth/signout?motivo=sem-perfil')
  if (!profile.active) redirect('/auth/signout?motivo=desativado')
  if (!allowed.includes(profile.role)) redirect('/dashboard')

  return { supabase, user, profile }
}

export function homePathForRole(role: Role) {
  if (role === 'admin') return '/admin'
  if (role === 'professor') return '/professor'
  return '/aluno'
}
