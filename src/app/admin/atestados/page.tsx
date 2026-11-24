import Navbar from '@/components/Navbar'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminResumo from '@/components/admin/AdminResumo'
import AdminAtestadosList from '@/components/admin/AdminAtestadosList'
import { requireRole } from '@/lib/auth'
import type { Atestado } from '@/types/database'

const STATUSES = ['pendente', 'aprovado', 'rejeitado', 'todos']

export default async function AdminAtestadosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { supabase, user, profile } = await requireRole('admin')

  const params = await searchParams
  const status = STATUSES.includes(params.status ?? '') ? params.status! : 'pendente'

  let query = supabase
    .from('atestados')
    .select('*, aluno:users!atestados_aluno_id_fkey(full_name, email), faltas:faltas_abonadas(*)')
    .order('created_at', { ascending: false })

  if (status !== 'todos') query = query.eq('status', status)

  const [{ data: atestados }, { data: turmas }] = await Promise.all([
    query.returns<Atestado[]>(),
    supabase.from('turmas').select('id, nome, ano_letivo').order('nome'),
  ])

  const idsResponsaveis = [...new Set(
    (atestados ?? [])
      .map(a => a.aprovado_por)
      .filter((id): id is string => Boolean(id))
  )]

  const { data: responsaveis, error: erroResponsaveis } =
    idsResponsaveis.length
      ? await supabase
          .from('users')
          .select('id, full_name, role')
          .in('id', idsResponsaveis)
      : { data: [], error: null }

  if (erroResponsaveis) {
    throw new Error('Não foi possível consultar os responsáveis.')
  }

  const mapaResponsaveis = new Map(
    (responsaveis ?? []).map(r => [r.id, r])
  )

  const atestadosComResponsavel = (atestados ?? []).map(a => ({
    ...a,
    responsavel: a.aprovado_por
      ? mapaResponsaveis.get(a.aprovado_por) ?? null
      : null,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={profile.full_name} role="admin" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AdminPageHeader title="Gerenciar Atestados" />
        <AdminResumo />
        <AdminAtestadosList
          atestados={atestadosComResponsavel}
          turmas={turmas ?? []}
          currentStatus={status}
          adminId={user.id}
        />
      </main>
    </div>
  )
}
