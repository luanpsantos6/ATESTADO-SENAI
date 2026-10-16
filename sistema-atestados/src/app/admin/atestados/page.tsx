import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AdminAtestadosList from '@/components/admin/AdminAtestadosList'

export default async function AdminAtestadosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
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

  const params = await searchParams
  const status = params.status || 'pendente'

  let query = supabase
    .from('atestados')
    .select(
      '*, aluno:users!atestados_aluno_id_fkey(full_name, email), faltas:faltas_abonadas(*)'
    )
    .order('created_at', { ascending: false })

  if (status !== 'todos') {
    query = query.eq('status', status)
  }

  const { data: atestados } = await query

  const { data: turmas } = await supabase
    .from('turmas')
    .select('id, nome, ano_letivo')
    .order('nome')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={profile.full_name} role="admin" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <a href="/admin" className="text-sm text-blue-600 hover:underline">
            ← Voltar
          </a>
          <h1 className="text-2xl font-bold">Gerenciar Atestados</h1>
        </div>
        <AdminAtestadosList
          atestados={(atestados as any) || []}
          turmas={(turmas as any) || []}
          currentStatus={status}
          adminId={user.id}
        />
      </main>
    </div>
  )
}
