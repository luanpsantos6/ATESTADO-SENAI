'use server'

import { revalidatePath } from 'next/cache'
import { usuarioAtual } from '@/lib/acesso'
import { createAdminClient } from '@/lib/supabase/admin'

export async function analisarAtestadoAdmin(
  id: string,
  status: 'aprovado' | 'rejeitado',
  motivo = ''
): Promise<{ success?: boolean; error?: string }> {

  const me = await usuarioAtual()

  if (!me || me.role !== 'admin') {
    return { error: 'Acesso não autorizado.' }
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { error: 'Atestado inválido.' }
  }

  if (status !== 'aprovado' && status !== 'rejeitado') {
    return { error: 'Decisão inválida.' }
  }

  if (typeof motivo !== 'string') {
    return { error: 'Motivo inválido.' }
  }

  motivo = motivo.trim()

  if (status === 'rejeitado' && !motivo) {
    return { error: 'Informe o motivo da rejeição.' }
  }

  if (motivo.length > 2000) {
    return { error: 'Motivo muito extenso.' }
  }

  const db = createAdminClient()

  const { data, error } = await db
    .from('atestados')
    .update({
      status,
      aprovado_por: me.id,
      aprovado_em: new Date().toISOString(),
      motivo_rejeicao:
        status === 'rejeitado' ? motivo : null,
    })
    .eq('id', id)
    .eq('status', 'pendente')
    .select('id')
    .maybeSingle()

  if (error) {
    return {
      error: 'Não foi possível registrar a decisão.'
    }
  }

  if (!data) {
    return {
      error: 'Este atestado não existe ou já foi analisado por outro responsável.'
    }
  }

  revalidatePath('/admin/atestados')
  revalidatePath('/admin')
  revalidatePath('/professor')
  revalidatePath('/aluno')

  return { success: true }
}
