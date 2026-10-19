'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const ROLES = ['admin', 'professor', 'aluno'] as const

export async function createUserAsAdmin(formData: FormData) {
  // 1) Garante que quem chama é admin ativo
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: me } = await supabase
    .from('users')
    .select('role, active')
    .eq('id', user.id)
    .single()

  if (!me || me.role !== 'admin' || !me.active) {
    return { error: 'Apenas administradores podem criar usuários.' }
  }

  // 2) Valida entrada
  const full_name = String(formData.get('full_name') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  const role = String(formData.get('role') || 'aluno')

  if (!full_name || !email || password.length < 6) {
    return { error: 'Preencha nome, e-mail e senha (mínimo 6 caracteres).' }
  }
  if (!(ROLES as readonly string[]).includes(role)) {
    return { error: 'Perfil inválido.' }
  }

  // 3) Cria o usuário sem mexer na sessão do admin e sem enviar e-mail
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  })

  if (error) {
    if (/already|registered|exists/i.test(error.message)) {
      return { error: 'Já existe um usuário com este e-mail.' }
    }
    return { error: error.message }
  }

  // 4) Garante o perfil correto (a trigger já cria, aqui sincronizamos/recuperamos)
  const { error: profileError } = await admin.from('users').upsert(
    { id: data.user.id, full_name, email, role, active: true },
    { onConflict: 'id' }
  )

  if (profileError) {
    // evita ficar usuário "órfão" no Auth sem perfil
    await admin.auth.admin.deleteUser(data.user.id)
    return { error: `Erro ao salvar perfil: ${profileError.message}` }
  }

  revalidatePath('/admin/usuarios')
  return { success: true }
}
