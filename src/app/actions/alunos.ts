'use server'

import { revalidatePath } from 'next/cache'
import { usuarioAtual } from '@/lib/acesso'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  normalizarCPF,
  validarCPF,
  mascararCPF,
} from '@/lib/cpf'

export type AlunoBusca = {
  id: string
  full_name: string
  email: string
  cpf: string | null
}

export async function salvarCPFAluno(
  alunoId: string,
  valor: string
): Promise<{ success?: boolean; error?: string }> {
  const me = await usuarioAtual()

  if (!me || me.role !== 'admin') {
    return { error: 'Acesso não autorizado.' }
  }

  const cpf = normalizarCPF(valor)

  if (!validarCPF(cpf)) {
    return { error: 'CPF inválido.' }
  }

  const db = createAdminClient()

  const { data: aluno, error: consultaErro } = await db
    .from('users')
    .select('id, role')
    .eq('id', alunoId)
    .eq('role', 'aluno')
    .maybeSingle()

  if (consultaErro || !aluno) {
    return { error: 'Aluno não encontrado.' }
  }

  const { error } = await db
    .from('alunos_documentos')
    .upsert(
      {
        aluno_id: alunoId,
        cpf,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'aluno_id' }
    )

  if (error) {
    if (error.code === '23505') {
      return { error: 'CPF já cadastrado para outro aluno.' }
    }

    return { error: 'Não foi possível salvar o CPF.' }
  }

  revalidatePath('/admin/usuarios')

  return { success: true }
}

export async function pesquisarAlunos(
  termo: string
): Promise<{
  alunos?: AlunoBusca[]
  error?: string
}> {
  const me = await usuarioAtual()

  if (!me || me.role !== 'admin') {
    return { error: 'Acesso não autorizado.' }
  }

  const busca = termo.trim().slice(0, 100)

  if (busca.length < 3) {
    return { alunos: [] }
  }

  const db = createAdminClient()

  const buscaCPF = /^[\d.\-\s]+$/.test(busca)

  if (buscaCPF) {
    const cpf = normalizarCPF(busca)

    if (cpf.length !== 11) {
      return { alunos: [] }
    }

    const { data: documento, error } = await db
      .from('alunos_documentos')
      .select('aluno_id, cpf')
      .eq('cpf', cpf)
      .maybeSingle()

    if (error) {
      return { error: 'Erro ao pesquisar CPF.' }
    }

    if (!documento) {
      return { alunos: [] }
    }

    const { data: aluno, error: alunoErro } = await db
      .from('users')
      .select('id, full_name, email')
      .eq('id', documento.aluno_id)
      .eq('role', 'aluno')
      .eq('active', true)
      .maybeSingle()

    if (alunoErro) {
      return { error: 'Erro ao consultar aluno.' }
    }

    if (!aluno) return { alunos: [] }

    return {
      alunos: [{
        ...aluno,
        cpf: mascararCPF(documento.cpf),
      }],
    }
  }

  const nome = busca.replace(/[%_\\]/g, '').trim()

  if (nome.length < 3) return { alunos: [] }

  const { data: alunos, error } = await db
    .from('users')
    .select('id, full_name, email')
    .eq('role', 'aluno')
    .eq('active', true)
    .ilike('full_name', `%${nome}%`)
    .order('full_name')
    .limit(20)

  if (error) {
    return { error: 'Erro ao pesquisar alunos.' }
  }

  if (!alunos?.length) {
    return { alunos: [] }
  }

  const { data: documentos, error: docErro } = await db
    .from('alunos_documentos')
    .select('aluno_id, cpf')
    .in('aluno_id', alunos.map(a => a.id))

  if (docErro) {
    return { error: 'Erro ao consultar documentos.' }
  }

  const mapa = new Map(
    (documentos ?? []).map(d => [
      d.aluno_id,
      mascararCPF(d.cpf),
    ])
  )

  return {
    alunos: alunos.map(a => ({
      ...a,
      cpf: mapa.get(a.id) ?? null,
    })),
  }
}
