import NavLink from '@/components/NavLink'
import Navbar from '@/components/Navbar'
import EnviarAtestado from '@/components/aluno/EnviarAtestado'
import ListaAtestados from '@/components/aluno/ListaAtestados'
import JustificarAtraso from '@/components/aluno/JustificarAtraso'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Atestado } from '@/types/database'
import type { AtrasoView } from '@/lib/atrasos'

export default async function AlunoPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>
}) {
  const { supabase, user, profile } = await requireRole('aluno')
  const { aba: abaParam } = await searchParams
  const aba = abaParam === 'atrasos' ? 'atrasos' : 'atestados'

  let atestados: Atestado[] = []
  let atrasos: AtrasoView[] = []
  let erro: string | null = null

  if (aba === 'atestados') {
    const { data } = await supabase
      .from('atestados')
      .select('*, faltas:faltas_abonadas(*)')
      .eq('aluno_id', user.id)
      .order('created_at', { ascending: false })
      .returns<Atestado[]>()
    atestados = data ?? []
  } else {
    try {
      const { data, error } = await createAdminClient()
        .from('justificativas_atraso')
        .select('id, data_atraso, horario_chegada, categoria, descricao, arquivo_url, status, motivo_rejeicao, created_at')
        .eq('aluno_id', user.id)
        .order('created_at', { ascending: false })
      if (error) erro = error.message
      atrasos = (data ?? []).map((j) => ({
        id: j.id,
        alunoNome: '',
        alunoEmail: '',
        turmas: [],
        data: j.data_atraso,
        horario: j.horario_chegada,
        categoria: j.categoria,
        descricao: j.descricao,
        temArquivo: Boolean(j.arquivo_url),
        status: j.status,
        motivo: j.motivo_rejeicao,
        enviadoEm: j.created_at,
      }))
    } catch (e) {
      erro = (e as Error).message
    }
  }

  const abas = [
    { k: 'atestados', r: 'Meus atestados' },
    { k: 'atrasos', r: 'Justificar atraso' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={profile.full_name} role="aluno" />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex gap-2 border-b">
          {abas.map((t) => (
            <NavLink
              key={t.k}
              href={`/aluno?aba=${t.k}`}
              className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${
                aba === t.k ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.r}
            </NavLink>
          ))}
        </div>

        {erro && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {/justificativas_atraso/.test(erro)
              ? 'O módulo de atrasos ainda não foi ativado no banco. Peça ao administrador para rodar o arquivo supabase/justificativas.sql.'
              : `Erro ao carregar: ${erro}`}
          </div>
        )}

        {aba === 'atestados' ? (
          <div className="space-y-8">
            <h1 className="text-2xl font-bold">Meus Atestados</h1>
            <EnviarAtestado />
            <ListaAtestados atestados={atestados} />
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Justificar atraso</h1>
            <JustificarAtraso historico={atrasos} />
          </div>
        )}
      </main>
    </div>
  )
}
