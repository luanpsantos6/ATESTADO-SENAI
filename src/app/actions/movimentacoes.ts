'use server'

import { revalidatePath } from 'next/cache'
import { usuarioAtual } from '@/lib/acesso'
import { createAdminClient } from '@/lib/supabase/admin'

export async function autorizarSaida(formData: FormData) {
  const me = await usuarioAtual()

  if (!me || me.role !== 'admin') {
    return { error: 'Acesso não autorizado.' }
  }

  const alunoId = String(formData.get('aluno_id') ?? '')
  const motivo = String(formData.get('motivo') ?? '').trim()
  const destino = String(formData.get('destino') ?? '').trim()
  const observacoes = String(formData.get('observacoes') ?? '').trim()
  const minutos = Number(formData.get('minutos'))

  if (!alunoId) {
    return { error: 'Selecione um aluno.' }
  }

  if (motivo.length < 3 || motivo.length > 500) {
    return { error: 'Informe um motivo válido.' }
  }

  if (!Number.isInteger(minutos) || minutos < 1 || minutos > 720) {
    return { error: 'Informe uma duração entre 1 e 720 minutos.' }
  }

  if (destino.length > 300 || observacoes.length > 1000) {
    return { error: 'Limite de caracteres excedido.' }
  }

  const db = createAdminClient()

  const { data: aluno, error: alunoErro } = await db
    .from('users')
    .select('id')
    .eq('id', alunoId)
    .eq('role', 'aluno')
    .eq('active', true)
    .maybeSingle()

  if (alunoErro || !aluno) {
    return { error: 'Aluno inválido ou inativo.' }
  }

  const agora = new Date()
  const previsto = new Date(agora.getTime() + minutos * 60000)

  const { data, error } = await db
    .from('movimentacoes_alunos')
    .insert({
      aluno_id: alunoId,
      saida_em: agora.toISOString(),
      retorno_previsto_em: previsto.toISOString(),
      motivo,
      destino: destino || null,
      observacoes: observacoes || null,
      autorizado_por: me.id,
      status: 'em_saida',
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Este aluno já possui uma saída em andamento.' }
    }

    return { error: 'Não foi possível registrar a saída.' }
  }

  revalidatePath('/admin/atrasos')

  return { success: true, id: data.id }
}

export async function registrarRetorno(id: string) {
  const me = await usuarioAtual()

  if (!me || me.role !== 'admin') {
    return { error: 'Acesso não autorizado.' }
  }

  const db = createAdminClient()

  const { data, error } = await db
    .from('movimentacoes_alunos')
    .update({
      retorno_em: new Date().toISOString(),
      retorno_registrado_por: me.id,
      status: 'retornou',
    })
    .eq('id', id)
    .eq('status', 'em_saida')
    .select('id')
    .maybeSingle()

  if (error || !data) {
    return { error: 'Saída não encontrada ou retorno já registrado.' }
  }

  revalidatePath('/admin/atrasos')

  return { success: true, id: data.id }
}
