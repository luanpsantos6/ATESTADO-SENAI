'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { friendlyError } from '@/lib/env'
import { usuarioAtual } from '@/lib/acesso'
import { carregarEscopo } from '@/lib/professor'
import { CATEGORIAS } from '@/lib/atrasos'

type Res = { error?: string; success?: boolean; url?: string }

const TIPOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
const MAX_BYTES = 4 * 1024 * 1024 // limite de corpo da Vercel ≈ 4,5 MB

function msgErro(e: unknown) {
  const m = (e as Error).message ?? String(e)
  if (/justificativas_atraso/.test(m) && /(schema cache|does not exist)/i.test(m)) {
    return 'A tabela de justificativas ainda não existe no banco. Rode o arquivo supabase/justificativas.sql no SQL Editor do Supabase.'
  }
  return friendlyError(e) ?? m
}

// ---------------------------------------------------------------- aluno envia
export async function enviarJustificativa(formData: FormData): Promise<Res> {
  try {
    const me = await usuarioAtual()
    if (!me || me.role !== 'aluno') return { error: 'Apenas alunos podem justificar atrasos.' }

    const data = String(formData.get('data_atraso') ?? '')
    const horario = String(formData.get('horario_chegada') ?? '')
    const categoria = String(formData.get('categoria') ?? '')
    const descricao = String(formData.get('descricao') ?? '').trim()
    const arquivo = formData.get('comprovante')

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { error: 'Informe a data do atraso.' }
    const amanha = new Date(Date.now() + 36 * 3600 * 1000).toISOString().slice(0, 10) // folga de fuso
    if (data > amanha) return { error: 'A data do atraso não pode estar no futuro.' }
    if (!/^\d{2}:\d{2}$/.test(horario)) return { error: 'Informe o horário de chegada.' }
    if (!CATEGORIAS.some((c) => c.value === categoria)) return { error: 'Escolha o motivo do atraso.' }
    if (descricao.length < 5) return { error: 'Explique o motivo do atraso (mínimo 5 caracteres).' }
    if (descricao.length > 1000) return { error: 'A explicação deve ter no máximo 1000 caracteres.' }

    const db = createAdminClient()

    let caminho: string | null = null
    if (arquivo instanceof File && arquivo.size > 0) {
      if (arquivo.size > MAX_BYTES) return { error: 'O comprovante deve ter no máximo 4 MB.' }
      if (!TIPOS.includes(arquivo.type)) return { error: 'Comprovante: apenas PDF, JPG ou PNG.' }
      const ext = (arquivo.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '')
      caminho = `justificativas/${me.id}/${Date.now()}.${ext}`
      const { error: upErr } = await db.storage
        .from('atestados')
        .upload(caminho, Buffer.from(await arquivo.arrayBuffer()), { contentType: arquivo.type })
      if (upErr) return { error: `Erro ao enviar o comprovante: ${upErr.message}` }
    }

    const { error } = await db.from('justificativas_atraso').insert({
      aluno_id: me.id,
      data_atraso: data,
      horario_chegada: horario,
      categoria,
      descricao,
      arquivo_url: caminho,
      status: 'pendente',
    })
    if (error) {
      if (caminho) await db.storage.from('atestados').remove([caminho])
      return { error: msgErro(error) }
    }

    revalidatePath('/aluno')
    return { success: true }
  } catch (e) {
    return { error: msgErro(e) }
  }
}

// ------------------------------------------------ permissão de acesso a um registro
async function carregarComPermissao(id: string, papeis: ('aluno' | 'professor' | 'admin')[]) {
  const me = await usuarioAtual()
  if (!me || !papeis.includes(me.role as 'aluno' | 'professor' | 'admin')) {
    return { erro: 'Você não tem permissão para isso.' as const }
  }
  const db = createAdminClient()
  const { data: j } = await db
    .from('justificativas_atraso')
    .select('id, aluno_id, status, arquivo_url')
    .eq('id', id)
    .maybeSingle()
  if (!j) return { erro: 'Justificativa não encontrada.' as const }

  if (me.role === 'aluno' && j.aluno_id !== me.id) return { erro: 'Esta justificativa não é sua.' as const }
  if (me.role === 'professor') {
    const escopo = await carregarEscopo(me.id)
    if (!escopo.alunoIds.includes(j.aluno_id)) {
      return { erro: 'Este aluno não é das suas turmas.' as const }
    }
  }
  return { me, db, j }
}

// ----------------------------------------------- professor / admin analisam
export async function analisarJustificativa(
  id: string,
  decisao: 'aprovada' | 'rejeitada',
  motivo = ''
): Promise<Res> {
  try {
    if (decisao !== 'aprovada' && decisao !== 'rejeitada') return { error: 'Decisão inválida.' }
    if (decisao === 'rejeitada' && !motivo.trim()) return { error: 'Informe o motivo da rejeição.' }

    const p = await carregarComPermissao(id, ['professor', 'admin'])
    if ('erro' in p) return { error: p.erro }
    if (p.j.status !== 'pendente') return { error: 'Esta justificativa já foi analisada.' }

    const { error } = await p.db
      .from('justificativas_atraso')
      .update({
        status: decisao,
        motivo_rejeicao: decisao === 'rejeitada' ? motivo.trim() : null,
        analisado_por: p.me.id,
        analisado_em: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) return { error: msgErro(error) }

    revalidatePath('/professor')
    revalidatePath('/admin/atrasos')
    revalidatePath('/aluno')
    return { success: true }
  } catch (e) {
    return { error: msgErro(e) }
  }
}

// ------------------------------------------------------------ ver comprovante
export async function urlComprovante(id: string): Promise<Res> {
  try {
    const p = await carregarComPermissao(id, ['aluno', 'professor', 'admin'])
    if ('erro' in p) return { error: p.erro }
    if (!p.j.arquivo_url) return { error: 'Esta justificativa não tem comprovante.' }
    const { data, error } = await p.db.storage.from('atestados').createSignedUrl(p.j.arquivo_url, 120)
    if (error || !data) return { error: error?.message ?? 'Arquivo não encontrado.' }
    return { url: data.signedUrl }
  } catch (e) {
    return { error: msgErro(e) }
  }
}
