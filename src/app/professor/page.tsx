import NavLink from '@/components/NavLink'
import Navbar from '@/components/Navbar'
import ProfessorAtestados, { type AtestadoView } from '@/components/professor/ProfessorAtestados'
import { requireRole } from '@/lib/auth'
import { carregarEscopo } from '@/lib/professor'
import AnaliseAtrasos from '@/components/atrasos/AnaliseAtrasos'
import { carregarAtrasos, erroAtrasos } from '@/lib/atrasosDados'

export default async function ProfessorPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; busca?: string }>
}) {
  const { profile } = await requireRole('professor')
  const { aba: abaParam, busca } = await searchParams
  const aba = abaParam === 'alunos' ? 'alunos' : abaParam === 'atrasos' ? 'atrasos' : 'atestados'

  let erro: string | null = null
  let escopo: Awaited<ReturnType<typeof carregarEscopo>> | null = null
  try {
    escopo = await carregarEscopo(profile.id)
  } catch (e) {
    erro = (e as Error).message
  }

  const turmas = escopo?.turmas ?? []
  const alunos = escopo?.alunos ?? []
  const alunoMap = new Map(alunos.map((a) => [a.id, a]))
  const turmaMap = new Map(turmas.map((t) => [t.id, t]))

  const turmasDoAluno = new Map<string, { id: string; nome: string }[]>()
  for (const m of escopo?.matriculas ?? []) {
    const t = turmaMap.get(m.turma_id)
    if (!t) continue
    turmasDoAluno.set(m.aluno_id, [...(turmasDoAluno.get(m.aluno_id) ?? []), { id: t.id, nome: t.nome }])
  }

  // atestados + faltas dos alunos das turmas do professor
  let atestados: AtestadoView[] = []
  if (escopo && escopo.alunoIds.length > 0) {
    const { data: ats, error: e1 } = await escopo.db
      .from('atestados')
      .select('id, aluno_id, data_inicio, data_fim, observacao, status, motivo_rejeicao, created_at')
      .in('aluno_id', escopo.alunoIds)
      .order('created_at', { ascending: false })
    if (e1) erro = e1.message

    const ids = (ats ?? []).map((a) => a.id as string)
    const { data: fts } = ids.length
      ? await escopo.db
          .from('faltas_abonadas')
          .select('id, atestado_id, data_falta, turma_id, observacao')
          .in('atestado_id', ids)
          .order('data_falta')
      : { data: [] as { id: string; atestado_id: string; data_falta: string; turma_id: string | null; observacao: string | null }[] }

    atestados = (ats ?? []).map((a) => ({
      id: a.id,
      alunoNome: alunoMap.get(a.aluno_id)?.full_name ?? '',
      alunoEmail: alunoMap.get(a.aluno_id)?.email ?? '',
      turmas: turmasDoAluno.get(a.aluno_id) ?? [],
      inicio: a.data_inicio,
      fim: a.data_fim,
      observacao: a.observacao,
      status: a.status,
      motivo: a.motivo_rejeicao,
      enviadoEm: a.created_at,
      faltas: (fts ?? [])
        .filter((f) => f.atestado_id === a.id)
        .map((f) => ({
          id: f.id,
          data: f.data_falta,
          turma: f.turma_id ? turmaMap.get(f.turma_id)?.nome ?? '' : '',
          obs: f.observacao,
        })),
    }))
  }

  // justificativas de atraso dos alunos do professor (tolera módulo ainda não ativado)
  let atrasos: Awaited<ReturnType<typeof carregarAtrasos>>['atrasos'] = []
  let erroAtraso: string | null = null
  if (escopo) {
    try {
      const r = await carregarAtrasos(escopo.alunoIds)
      atrasos = r.atrasos
      erroAtraso = r.erro
    } catch (e) {
      erroAtraso = (e as Error).message
    }
  }
  const atrasosPend = atrasos.filter((a) => a.status === 'pendente').length

  const conta = (s: string) => atestados.filter((a) => a.status === s).length
  const cards = [
    { r: 'Pendentes', v: conta('pendente'), c: 'text-yellow-600', destaque: conta('pendente') > 0 },
    { r: 'Aprovados', v: conta('aprovado'), c: 'text-green-600' },
    { r: 'Rejeitados', v: conta('rejeitado'), c: 'text-red-600' },
    { r: 'Atrasos pendentes', v: atrasosPend, c: 'text-orange-600', destaque: atrasosPend > 0 },
    { r: 'Alunos', v: alunos.length, c: 'text-blue-700' },
    { r: 'Turmas', v: turmas.length, c: 'text-blue-700' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={profile.full_name} role="professor" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Painel do Professor</h1>
        <p className="text-sm text-gray-500 mb-6">
          Atestados e alunos das suas turmas e unidades.
        </p>

        {erro && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Erro ao carregar: {erro}</div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {cards.map((c) => (
            <div
              key={c.r}
              className={`bg-white rounded-xl shadow p-3 ${c.destaque ? 'ring-2 ring-yellow-400' : ''}`}
            >
              <p className={`text-2xl font-bold ${c.c}`}>{c.v}</p>
              <p className="text-xs text-gray-500">{c.r}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 border-b">
          {[
            { k: 'atestados', r: 'Atestados' },
            { k: 'atrasos', r: `Atrasos${atrasosPend > 0 ? ` (${atrasosPend})` : ''}` },
            { k: 'alunos', r: 'Meus alunos e turmas' },
          ].map((t) => (
            <NavLink
              key={t.k}
              href={`/professor?aba=${t.k}`}
              className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${
                aba === t.k ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.r}
            </NavLink>
          ))}
        </div>

        {turmas.length === 0 && !erro && (
          <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
            Você ainda não tem turmas. O administrador precisa definir você como responsável de uma turma
            ou associar você a uma unidade.
          </div>
        )}

        {aba === 'atestados' ? (
          <ProfessorAtestados atestados={atestados} buscaInicial={busca ?? ''} />
        ) : aba === 'atrasos' ? (
          <>
            {erroAtraso && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erroAtrasos(erroAtraso)}</div>
            )}
            <AnaliseAtrasos atrasos={atrasos} buscaInicial={busca ?? ''} />
          </>
        ) : (
          <div className="space-y-5">
            {turmas.map((t) => {
              const doAluno = (escopo?.matriculas ?? []).filter((m) => m.turma_id === t.id)
              const lista = doAluno
                .map((m) => alunoMap.get(m.aluno_id))
                .filter((a): a is NonNullable<typeof a> => Boolean(a))
                .sort((a, b) => a.full_name.localeCompare(b.full_name))
              return (
                <div key={t.id} className="bg-white rounded-xl shadow overflow-hidden">
                  <div className="px-5 py-3 border-b bg-gray-50 flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="font-semibold">{t.nome}</p>
                      <p className="text-xs text-gray-500">
                        {t.unidade} · {t.ano_letivo}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">{lista.length} aluno(s)</span>
                  </div>
                  {lista.length === 0 ? (
                    <p className="p-5 text-sm text-gray-400">Nenhum aluno matriculado.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-500">
                          <th className="px-5 py-2">Aluno</th>
                          <th className="px-5 py-2">E-mail</th>
                          <th className="px-5 py-2 text-center">Pendentes</th>
                          <th className="px-5 py-2 text-center">Aprovados</th>
                          <th className="px-5 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lista.map((a) => {
                          const meus = atestados.filter((x) => x.alunoEmail === a.email)
                          const pend = meus.filter((x) => x.status === 'pendente').length
                          return (
                            <tr key={a.id} className="border-t">
                              <td className="px-5 py-2 font-medium">
                                {a.full_name}
                                {!a.active && <span className="ml-2 text-xs text-red-500">(inativo)</span>}
                              </td>
                              <td className="px-5 py-2 text-gray-500">{a.email}</td>
                              <td className={`px-5 py-2 text-center ${pend > 0 ? 'font-bold text-yellow-600' : ''}`}>
                                {pend}
                              </td>
                              <td className="px-5 py-2 text-center">
                                {meus.filter((x) => x.status === 'aprovado').length}
                              </td>
                              <td className="px-5 py-2 text-right">
                                <NavLink
                                  href={`/professor?aba=atestados&busca=${encodeURIComponent(a.full_name)}`}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Ver atestados
                                </NavLink>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
