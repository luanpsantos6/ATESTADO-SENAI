'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { friendlyError } from '@/lib/env'
import { professorPodeVerAtestado } from '@/lib/professor'

type Res = { error?: string; success?: boolean; url?: string }

// Garante que quem chama é professor (ou admin) ativo
async function usuarioAtual() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await createAdminClient()
    .from('users')
    .select('id, role, active')
    .eq('id', user.id)
    .maybeSingle()
  if (!me || !me.active || me.role !== 'professor') return null
  return me
}

async function comPermissao(atestadoId: string) {
  const me = await usuarioAtual()
  if (!me) return { erro: 'Apenas professores podem fazer isso.' as const }
  const ok = await professorPodeVerAtestado(me.id, atestadoId)
  if (!ok) return { erro: 'Este atestado não é de um aluno das suas turmas.' as const }
  return { me, ...ok }
}

export async function profAprovar(atestadoId: string): Promise<Res> {
  try {
    const p = await comPermissao(atestadoId)
    if ('erro' in p) return { error: p.erro }
    if (p.atestado.status !== 'pendente') return { error: 'Este atestado já foi analisado.' }
    const { error } = await p.escopo.db
      .from('atestados')
      .update({
        status: 'aprovado',
        aprovado_por: p.me.id,
        aprovado_em: new Date().toISOString(),
        motivo_rejeicao: null,
      })
      .eq('id', atestadoId)
    if (error) return { error: error.message }
    revalidatePath('/professor')
    return { success: true }
  } catch (e) {
    return { error: friendlyError(e) ?? (e as Error).message }
  }
}

export async function profRejeitar(atestadoId: string, motivo: string): Promise<Res> {
  try {
    if (!motivo.trim()) return { error: 'Informe o motivo da rejeição.' }
    const p = await comPermissao(atestadoId)
    if ('erro' in p) return { error: p.erro }
    if (p.atestado.status !== 'pendente') return { error: 'Este atestado já foi analisado.' }
    const { error } = await p.escopo.db
      .from('atestados')
      .update({
        status: 'rejeitado',
        aprovado_por: p.me.id,
        aprovado_em: new Date().toISOString(),
        motivo_rejeicao: motivo.trim(),
      })
      .eq('id', atestadoId)
    if (error) return { error: error.message }
    revalidatePath('/professor')
    return { success: true }
  } catch (e) {
    return { error: friendlyError(e) ?? (e as Error).message }
  }
}

export async function profAssociarFalta(
  atestadoId: string,
  dataFalta: string,
  turmaId: string,
  observacao: string
): Promise<Res> {
  try {
    if (!dataFalta) return { error: 'Informe a data da falta.' }
    const p = await comPermissao(atestadoId)
    if ('erro' in p) return { error: p.erro }
    if (p.atestado.status !== 'aprovado') return { error: 'Só é possível abonar faltas de atestado aprovado.' }
    if (turmaId && !p.escopo.turmas.some((t) => t.id === turmaId)) {
      return { error: 'Turma inválida.' }
    }
    const { error } = await p.escopo.db.from('faltas_abonadas').insert({
      atestado_id: atestadoId,
      data_falta: dataFalta,
      turma_id: turmaId || null,
      observacao: observacao.trim() || null,
      associado_por: p.me.id,
    })
    if (error) return { error: error.message }
    revalidatePath('/professor')
    return { success: true }
  } catch (e) {
    return { error: friendlyError(e) ?? (e as Error).message }
  }
}

export async function profUrlArquivo(atestadoId: string): Promise<Res> {
  try {
    const p = await comPermissao(atestadoId)
    if ('erro' in p) return { error: p.erro }
    const { data, error } = await p.escopo.db.storage
      .from('atestados')
      .createSignedUrl(p.atestado.arquivo_url, 120)
    if (error || !data) return { error: error?.message ?? 'Arquivo não encontrado.' }
    return { url: data.signedUrl }
  } catch (e) {
    return { error: friendlyError(e) ?? (e as Error).message }
  }
}
