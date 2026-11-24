import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { carregarMovimentacoes } from '@/lib/movimentacoesDados'
import { mascararCPF } from '@/lib/cpf'
import TicketMovimentacao from '@/components/admin/TicketMovimentacao'

export const dynamic = 'force-dynamic'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tipo?: string }>
}) {
  await requireRole('admin')

  const { id } = await params
  const { tipo } = await searchParams

  const [m] = await carregarMovimentacoes(id)

  if (!m) notFound()

  if (tipo === 'retorno' && m.status !== 'retornou') {
    notFound()
  }

  const db = createAdminClient()

  const [documento, matriculas] = await Promise.all([
    db.from('alunos_documentos')
      .select('cpf')
      .eq('aluno_id', m.aluno_id)
      .maybeSingle(),

    db.from('matriculas')
      .select('turma_id')
      .eq('aluno_id', m.aluno_id),
  ])

  if (documento.error || matriculas.error) {
    throw new Error('Não foi possível carregar o ticket.')
  }

  const ids = [...new Set(
    (matriculas.data ?? []).map(a => a.turma_id)
  )]

  const turmas = ids.length
    ? await db.from('turmas').select('nome').in('id', ids)
    : { data: [], error: null }

  if (turmas.error) {
    throw new Error('Não foi possível consultar as turmas.')
  }

  return (
    <TicketMovimentacao
      m={m}
      tipo={tipo === 'retorno' ? 'retorno' : 'saida'}
      cpf={
        documento.data?.cpf
          ? mascararCPF(documento.data.cpf)
          : 'Não cadastrado'
      }
      turmas={(turmas.data ?? []).map(t => t.nome)}
    />
  )
}
