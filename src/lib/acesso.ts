import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Role } from '@/types/database'

export type UsuarioAtual = { id: string; role: Role; active: boolean; full_name: string }

// Usuário logado (sessão) + perfil lido com a chave de serviço. Usado nas server actions.
export async function usuarioAtual(): Promise<UsuarioAtual | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await createAdminClient()
    .from('users')
    .select('id, role, active, full_name')
    .eq('id', user.id)
    .maybeSingle()
  if (!data || !data.active) return null
  return data as UsuarioAtual
}
