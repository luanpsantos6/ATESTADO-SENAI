import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { usuarioAtual } from '@/lib/acesso'
import type { Movimentacao } from '@/lib/movimentacoes'

export async function carregarMovimentacoes(
  id?: string
): Promise<Movimentacao[]> {
  const me = await usuarioAtual()

  if (!me || me.role !== 'admin') {
    throw new Error('Acesso não autorizado.')
  }

  const db = createAdminClient()

  let query = db
    .from('movimentacoes_alunos')
    .select('*')
    .order('saida_em', { ascending: false })

  if (id) {
    query = query.eq('id', id)
  } else {
    query = query.or(
      `status.eq.em_saida,saida_em.gte.${new Date(
        Date.now() - 30 * 86400000
      ).toISOString()}`
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error('Erro ao carregar movimentações.')
  }

  const registros = data ?? []

  if (!registros.length) return []

  const ids = [...new Set(
    registros.flatMap(m => [
      m.aluno_id,
      m.autorizado_por,
      m.retorno_registrado_por,
    ]).filter(Boolean)
  )]

  const { data: usuarios, error: usuariosErro } = await db
    .from('users')
    .select('id, full_name')
    .in('id', ids)

  if (usuariosErro) {
    throw new Error('Erro ao consultar usuários.')
  }

  const nomes = new Map(
    (usuarios ?? []).map(u => [u.id, u.full_name])
  )

  return registros.map(m => ({
    ...m,
    alunoNome: nomes.get(m.aluno_id) ?? 'Não identificado',
    autorizadoNome:
      nomes.get(m.autorizado_por) ?? 'Não identificado',
    retornoNome:
      nomes.get(m.retorno_registrado_por) ?? '',
  }))
}
