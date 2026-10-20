import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { homePathForRole } from '@/lib/auth'
import type { Role } from '@/types/database'

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
    .single<{ role: Role; active: boolean }>()

  if (!profile) redirect('/auth/signout?motivo=sem-perfil')
  if (!profile.active) redirect('/auth/signout?motivo=desativado')

  redirect(homePathForRole(profile.role))
}
