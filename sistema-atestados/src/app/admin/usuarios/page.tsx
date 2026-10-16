import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AdminUsuarios from '@/components/admin/AdminUsuarios'

export default async function AdminUsuariosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={profile.full_name} role="admin" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <a href="/admin" className="text-sm text-blue-600 hover:underline">
            ← Voltar
          </a>
          <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
        </div>
        <AdminUsuarios users={users || []} />
      </main>
    </div>
  )
}
