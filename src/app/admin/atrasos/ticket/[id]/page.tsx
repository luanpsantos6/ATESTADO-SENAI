import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { mascararCPF } from '@/lib/cpf'
import TicketLiberacao from '@/components/admin/TicketLiberacao'

export const dynamic = 'force-dynamic'

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole('admin')

  const { id } = await params

  const db = createAdminClient()

  const { data: registro, error } = await db
    .from('justificativas_atraso')
    .select(`
      id,
      aluno_id,
      data_atraso,
      horario_chegada,
      status,
      analisado_por,
      analisado_em
    `)
    .eq('id', id)
    .eq('status', 'aprovada')
    .maybeSingle()

  if (error || !registro) notFound()

  const [
    alunoRes,
    documentoRes,
    matriculasRes,
    responsavelRes,
  ] = await Promise.all([
    db.from('users')
      .select('full_name')
      .eq('id', registro.aluno_id)
      .single(),

    db.from('alunos_documentos')
      .select('cpf')
      .eq('aluno_id', registro.aluno_id)
      .maybeSingle(),

    db.from('matriculas')
      .select('turma_id')
      .eq('aluno_id', registro.aluno_id),

    registro.analisado_por
      ? db.from('users')
          .select('full_name')
          .eq('id', registro.analisado_por)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (
    alunoRes.error ||
    documentoRes.error ||
    matriculasRes.error ||
    responsavelRes.error
  ) {
    throw new Error('Não foi possível carregar o ticket.')
  }

  if (!alunoRes.data) notFound()

  const turmaIds = [
    ...new Set(
      (matriculasRes.data ?? []).map(m => m.turma_id)
    ),
  ]

  const turmasRes = turmaIds.length
    ? await db.from('turmas')
        .select('nome')
        .in('id', turmaIds)
    : { data: [], error: null }

  if (turmasRes.error) {
    throw new Error('Não foi possível carregar as turmas.')
  }

  return (
    <TicketLiberacao
      id={registro.id}
      aluno={alunoRes.data.full_name}
      cpf={
        documentoRes.data?.cpf
          ? mascararCPF(documentoRes.data.cpf)
          : 'Não cadastrado'
      }
      turmas={(turmasRes.data ?? []).map(t => t.nome)}
      data={registro.data_atraso}
      horario={registro.horario_chegada}
      responsavel={
        responsavelRes.data?.full_name ?? 'Não identificado'
      }
      autorizadoEm={registro.analisado_em}
    />
  )
}
