import { createAdminClient } from '@/lib/supabase/admin'

export type TurmaEscopo = { id: string; nome: string; ano_letivo: number; unidade_id: string | null; unidade: string }
export type AlunoEscopo = { id: string; full_name: string; email: string; active: boolean }

/**
 * Tudo o que o professor "enxerga": turmas dele (como responsável OU das unidades dele),
 * as matrículas dessas turmas e os alunos. Lido pelo servidor (service role), então
 * não depende de RLS; a permissão é garantida aqui.
 */
export async function carregarEscopo(professorId: string) {
  const db = createAdminClient()

  const { data: pu } = await db
    .from('professor_unidades')
    .select('unidade_id')
    .eq('professor_id', professorId)
  const unidadeIds = (pu ?? []).map((x) => x.unidade_id as string)

  const [{ data: proprias }, { data: dasUnidades }, { data: unidades }] = await Promise.all([
    db.from('turmas').select('id, nome, ano_letivo, unidade_id').eq('professor_id', professorId),
    unidadeIds.length
      ? db.from('turmas').select('id, nome, ano_letivo, unidade_id').in('unidade_id', unidadeIds)
      : Promise.resolve({ data: [] as { id: string; nome: string; ano_letivo: number; unidade_id: string | null }[] }),
    db.from('unidades').select('id, nome'),
  ])

  const nomeUnidade = new Map((unidades ?? []).map((u) => [u.id as string, u.nome as string]))
  const mapa = new Map<string, TurmaEscopo>()
  for (const t of [...(proprias ?? []), ...(dasUnidades ?? [])]) {
    mapa.set(t.id, {
      id: t.id,
      nome: t.nome,
      ano_letivo: t.ano_letivo,
      unidade_id: t.unidade_id,
      unidade: t.unidade_id ? nomeUnidade.get(t.unidade_id) ?? '' : '',
    })
  }
  const turmas = [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome))
  const turmaIds = turmas.map((t) => t.id)

  const { data: mats } = turmaIds.length
    ? await db.from('matriculas').select('aluno_id, turma_id').in('turma_id', turmaIds)
    : { data: [] as { aluno_id: string; turma_id: string }[] }
  const matriculas = (mats ?? []) as { aluno_id: string; turma_id: string }[]
  const alunoIds = [...new Set(matriculas.map((m) => m.aluno_id))]

  const { data: alunosData } = alunoIds.length
    ? await db.from('users').select('id, full_name, email, active').in('id', alunoIds).order('full_name')
    : { data: [] as AlunoEscopo[] }
  const alunos = (alunosData ?? []) as AlunoEscopo[]

  return { db, turmas, matriculas, alunos, alunoIds }
}

/** Verifica se o aluno do atestado pertence às turmas do professor. */
export async function professorPodeVerAtestado(professorId: string, atestadoId: string) {
  const escopo = await carregarEscopo(professorId)
  const { data: at } = await escopo.db
    .from('atestados')
    .select('id, aluno_id, status, arquivo_url')
    .eq('id', atestadoId)
    .maybeSingle()
  if (!at || !escopo.alunoIds.includes(at.aluno_id)) return null
  return { atestado: at, escopo }
}
