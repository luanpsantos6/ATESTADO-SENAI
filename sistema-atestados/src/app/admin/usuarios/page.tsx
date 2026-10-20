import Navbar from '@/components/Navbar'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminResumo from '@/components/admin/AdminResumo'
import AdminUsuarios from '@/components/admin/AdminUsuarios'
import { requireRole } from '@/lib/auth'
import type { User } from '@/types/database'

export default async function AdminUsuariosPage() {
  const { supabase, user, profile } = await requireRole('admin')

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<User[]>()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={profile.full_name} role="admin" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AdminPageHeader title="Gerenciar Usuários" />
        <AdminResumo />
        <AdminUsuarios users={users ?? []} currentUserId={user.id} />
      </main>
    </div>
  )
}
