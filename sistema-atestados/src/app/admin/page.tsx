import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default async function AdminPage() {
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

  const { count: pendentes } = await supabase
    .from('atestados')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pendente')

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: totalTurmas } = await supabase
    .from('turmas')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={profile.full_name} role="admin" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Painel do Administrador</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/atestados"
            className="bg-white rounded-xl shadow p-5 hover:shadow-md transition"
          >
            <p className="text-3xl font-bold text-yellow-600">{pendentes || 0}</p>
            <p className="text-sm text-gray-500">Atestados pendentes</p>
          </Link>
          <Link
            href="/admin/usuarios"
            className="bg-white rounded-xl shadow p-5 hover:shadow-md transition"
          >
            <p className="text-3xl font-bold text-blue-600">{totalUsers || 0}</p>
            <p className="text-sm text-gray-500">Usuários</p>
          </Link>
          <Link
            href="/admin/turmas"
            className="bg-white rounded-xl shadow p-5 hover:shadow-md transition"
          >
            <p className="text-3xl font-bold text-green-600">{totalTurmas || 0}</p>
            <p className="text-sm text-gray-500">Turmas</p>
          </Link>
          <Link
            href="/admin/atestados?status=todos"
            className="bg-white rounded-xl shadow p-5 hover:shadow-md transition"
          >
            <p className="text-3xl font-bold text-purple-600">→</p>
            <p className="text-sm text-gray-500">Todos os atestados</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
