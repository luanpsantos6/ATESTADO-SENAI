'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { friendlyError } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/admin'

export type ActionResult = { error?: string; success?: string }

export async function login(formData: FormData): Promise<ActionResult | void> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Informe e-mail e senha.' }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) return { error: 'Credenciais inválidas.' }

    const { data: profile } = await supabase
      .from('users')
      .select('active')
      .eq('id', data.user.id)
      .single()

    if (profile && !profile.active) {
      await supabase.auth.signOut()
      return { error: 'Usuário desativado. Contate o administrador.' }
    }
  } catch (err) {
    console.error('[login]', err)
    return { error: friendlyError(err) ?? 'Não foi possível entrar agora. Tente novamente.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.error('[logout]', err)
  }
  revalidatePath('/', 'layout')
  redirect('/login')
}

// Cadastro público: o usuário escolhe Aluno ou Professor. 'admin' NUNCA é aceito aqui.
export async function register(formData: FormData): Promise<ActionResult> {
  const full_name = String(formData.get('full_name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const tipo = String(formData.get('tipo') ?? 'aluno')
  const role = tipo === 'professor' ? 'professor' : 'aluno'

  if (!full_name || !email || password.length < 6) {
    return { error: 'Preencha nome, e-mail e senha (mínimo 6 caracteres).' }
  }

  try {
    // Cria já confirmada e SEM enviar e-mail (evita "email rate limit exceeded")
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    })

    if (error) {
      if (/already|registered|exists/i.test(error.message)) {
        return { error: 'Já existe uma conta com este e-mail.' }
      }
      return { error: friendlyError(error) ?? error.message }
    }

    // Garante o perfil com o tipo escolhido (aluno ou professor, nunca admin)
    const { error: profileError } = await admin
      .from('users')
      .upsert({ id: data.user.id, full_name, email, role, active: true }, { onConflict: 'id' })

    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id)
      return { error: `Erro ao salvar perfil: ${profileError.message}` }
    }
  } catch (err) {
    console.error('[register]', err)
    return { error: friendlyError(err) ?? 'Não foi possível criar a conta agora.' }
  }

  return { success: 'Conta criada! Faça login.' }
}
