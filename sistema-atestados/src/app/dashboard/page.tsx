import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.active) {
    await supabase.auth.signOut()
    redirect('/login')
  }

  if (profile.role === 'admin') redirect('/admin')
  if (profile.role === 'professor') redirect('/professor')
  if (profile.role === 'aluno') redirect('/aluno')

  redirect('/login')
}
