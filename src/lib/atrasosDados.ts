import { createAdminClient } from '@/lib/supabase/admin'
import type { AtrasoView } from '@/lib/atrasos'

/**
 * Carrega justificativas de atraso já com nome do aluno e turmas.
 * `alunoIds` = escopo do professor; sem ele (admin) traz de todos os alunos.
 */
export async function carregarAtrasos(alunoIds?: string[]) {
  const db = createAdminClient()
  if (alunoIds && alunoIds.length === 0) return { atrasos: [] as AtrasoView[], erro: null as string | null }

  let q = db
    .from('justificativas_atraso')
    .select('id, aluno_id, data_atraso, horario_chegada, categoria, descricao, arquivo_url, status, motivo_rejeicao, created_at')
    .order('created_at', { ascending: false })
  if (alunoIds) q = q.in('aluno_id', alunoIds)

  const { data, error } = await q
  if (error) return { atrasos: [] as AtrasoView[], erro: error.message }

  const ids = [...new Set((data ?? []).map((j) => j.aluno_id as string))]
  const [{ data: users }, { data: mats }, { data: turmas }] = ids.length
    ? await Promise.all([
        db.from('users').select('id, full_name, email').in('id', ids),
        db.from('matriculas').select('aluno_id, turma_id').in('aluno_id', ids),
        db.from('turmas').select('id, nome'),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const userMap = new Map((users ?? []).map((u) => [u.id as string, u]))
  const turmaNome = new Map((turmas ?? []).map((t) => [t.id as string, t.nome as string]))
  const turmasDoAluno = new Map<string, string[]>()
  for (const m of mats ?? []) {
    const nome = turmaNome.get(m.turma_id as string)
    if (!nome) continue
    const k = m.aluno_id as string
    turmasDoAluno.set(k, [...(turmasDoAluno.get(k) ?? []), nome])
  }

  const atrasos: AtrasoView[] = (data ?? []).map((j) => ({
    id: j.id,
    alunoNome: userMap.get(j.aluno_id)?.full_name ?? '',
    alunoEmail: userMap.get(j.aluno_id)?.email ?? '',
    turmas: turmasDoAluno.get(j.aluno_id) ?? [],
    data: j.data_atraso,
    horario: j.horario_chegada,
    categoria: j.categoria,
    descricao: j.descricao,
    temArquivo: Boolean(j.arquivo_url),
    status: j.status,
    motivo: j.motivo_rejeicao,
    enviadoEm: j.created_at,
  }))
  return { atrasos, erro: null as string | null }
}

export const erroAtrasos = (e: string | null) =>
  e && /justificativas_atraso/.test(e)
    ? 'O módulo de atrasos ainda não foi ativado no banco. Rode o arquivo supabase/justificativas.sql no SQL Editor do Supabase.'
    : e
