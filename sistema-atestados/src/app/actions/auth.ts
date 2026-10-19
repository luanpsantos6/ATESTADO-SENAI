'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Credenciais inválidas' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('active')
      .eq('id', user.id)
      .single()

    if (profile && !profile.active) {
      await supabase.auth.signOut()
      return { error: 'Usuário desativado. Contate o administrador.' }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function register(formData: FormData) {
  const supabase = await createClient()

  const full_name = formData.get('full_name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Conta criada! Faça login.' }
}
