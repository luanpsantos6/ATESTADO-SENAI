'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { friendlyError } from '@/lib/env'

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

// Cadastro público: SEMPRE cria aluno. O perfil nunca vem do formulário.
export async function register(formData: FormData): Promise<ActionResult> {
  const full_name = String(formData.get('full_name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!full_name || !email || password.length < 6) {
    return { error: 'Preencha nome, e-mail e senha (mínimo 6 caracteres).' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    })
    if (error) {
      return { error: friendlyError(error) ?? error.message }
    }
  } catch (err) {
    console.error('[register]', err)
    return { error: friendlyError(err) ?? 'Não foi possível criar a conta agora.' }
  }

  return { success: 'Conta criada! Faça login.' }
}
