'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate, formatDateTime } from '@/lib/format'
import Spinner from '@/components/Spinner'
import { profAprovar, profAssociarFalta, profRejeitar, profUrlArquivo } from '@/app/actions/professor'

export type AtestadoView = {
  id: string
  alunoNome: string
  alunoEmail: string
  turmas: { id: string; nome: string }[]
  inicio: string
  fim: string
  observacao: string | null
  status: 'pendente' | 'aprovado' | 'rejeitado'
  motivo: string | null
  enviadoEm: string
  faltas: { id: string; data: string; turma: string; obs: string | null }[]
}

const cor: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-800',
}

const normaliza = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export default function ProfessorAtestados({
  atestados,
  buscaInicial = '',
}: {
  atestados: AtestadoView[]
  buscaInicial?: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [filtro, setFiltro] = useState<'pendente' | 'aprovado' | 'rejeitado' | 'todos'>(buscaInicial ? 'todos' : 'pendente')
  const [busca, setBusca] = useState(buscaInicial)
  const [erro, setErro] = useState<string | null>(null)
  const [rejeitando, setRejeitando] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [abonando, setAbonando] = useState<string | null>(null)
  const [dataFalta, setDataFalta] = useState('')
  const [turmaId, setTurmaId] = useState('')
  const [obs, setObs] = useState('')

  const contagem = useMemo(
    () => ({
      pendente: atestados.filter((a) => a.status === 'pendente').length,
      aprovado: atestados.filter((a) => a.status === 'aprovado').length,
      rejeitado: atestados.filter((a) => a.status === 'rejeitado').length,
      todos: atestados.length,
    }),
    [atestados]
  )

  const termos = normaliza(busca).split(/\s+/).filter(Boolean)
  const lista = atestados.filter((a) => {
    if (filtro !== 'todos' && a.status !== filtro) return false
    const alvo = normaliza(`${a.alunoNome} ${a.alunoEmail} ${a.turmas.map((t) => t.nome).join(' ')}`)
    return termos.every((t) => alvo.includes(t))
  })

  function executar(acao: () => Promise<{ error?: string }>, depois?: () => void) {
    setErro(null)
    start(async () => {
      const r = await acao()
      if (r.error) return setErro(r.error)
      depois?.()
      router.refresh()
    })
  }

  async function verArquivo(id: string) {
    setErro(null)
    const aba = window.open('', '_blank') // abre antes do await para não ser bloqueado
    const r = await profUrlArquivo(id)
    if (r.url && aba) aba.location.href = r.url
    else {
      aba?.close()
      setErro(r.error ?? 'Não foi possível abrir o arquivo.')
    }
  }

  const abas: { k: typeof filtro; r: string }[] = [
    { k: 'pendente', r: 'Pendentes' },
    { k: 'aprovado', r: 'Aprovados' },
    { k: 'rejeitado', r: 'Rejeitados' },
    { k: 'todos', r: 'Todos' },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {abas.map((a) => (
          <button
            key={a.k}
            onClick={() => setFiltro(a.k)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filtro === a.k ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            {a.r} ({contagem[a.k]})
          </button>
        ))}
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar aluno ou turma..."
          className="ml-auto w-full sm:w-64 px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {erro && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}

      {lista.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          Nenhum atestado {filtro !== 'todos' ? `${filtro}` : ''} encontrado.
        </div>
      ) : (
        <div className="space-y-4">
          {lista.map((a) => (
            <div key={a.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{a.alunoNome || '(aluno sem nome)'}</p>
                  <p className="text-sm text-gray-500">{a.alunoEmail}</p>
                  {a.turmas.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">Turma: {a.turmas.map((t) => t.nome).join(', ')}</p>
                  )}
                  <p className="text-sm mt-1">
                    Período: {formatDate(a.inicio)} até {formatDate(a.fim)}
                  </p>
                  <p className="text-xs text-gray-400">Enviado em {formatDateTime(a.enviadoEm)}</p>
                  {a.observacao && <p className="text-sm text-gray-600 mt-1">“{a.observacao}”</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${cor[a.status]}`}>
                  {a.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => verArquivo(a.id)} className="text-sm text-blue-600 hover:underline mr-2">
                  Ver arquivo
                </button>
                {a.status === 'pendente' && (
                  <>
                    <button
                      disabled={pending}
                      onClick={() => executar(() => profAprovar(a.id))}
                      className="inline-flex items-center justify-center gap-2 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {pending && <Spinner className="h-3.5 w-3.5" />} Aprovar
                    </button>
                    <button
                      onClick={() => {
                        setRejeitando(a.id)
                        setMotivo('')
                      }}
                      className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Rejeitar
                    </button>
                  </>
                )}
                {a.status === 'aprovado' && (
                  <button
                    onClick={() => {
                      setAbonando(a.id)
                      setDataFalta('')
                      setTurmaId('')
                      setObs('')
                    }}
                    className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                  >
                    Abonar falta
                  </button>
                )}
              </div>

              {rejeitando === a.id && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg space-y-3">
                  <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Motivo da rejeição *"
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <div className="flex gap-3">
                    <button
                      disabled={pending}
                      onClick={() => executar(() => profRejeitar(a.id, motivo), () => setRejeitando(null))}
                      className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50"
                    >
                      {pending && <Spinner className="h-3.5 w-3.5" />} Confirmar rejeição
                    </button>
                    <button onClick={() => setRejeitando(null)} className="text-sm text-gray-600">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {abonando === a.id && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium">Data da falta *</label>
                      <input
                        type="date"
                        value={dataFalta}
                        onChange={(e) => setDataFalta(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Turma (opcional)</label>
                      <select
                        value={turmaId}
                        onChange={(e) => setTurmaId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="">—</option>
                        {a.turmas.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    placeholder="Observação (opcional)"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <div className="flex gap-3">
                    <button
                      disabled={pending}
                      onClick={() =>
                        executar(() => profAssociarFalta(a.id, dataFalta, turmaId, obs), () => setAbonando(null))
                      }
                      className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50"
                    >
                      {pending && <Spinner className="h-3.5 w-3.5" />} Abonar
                    </button>
                    <button onClick={() => setAbonando(null)} className="text-sm text-gray-600">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {a.faltas.length > 0 && (
                <div className="mt-3 text-sm">
                  <p className="font-medium">Faltas abonadas:</p>
                  <ul className="list-disc list-inside text-gray-600">
                    {a.faltas.map((f) => (
                      <li key={f.id}>
                        {formatDate(f.data)}
                        {f.turma && ` — ${f.turma}`}
                        {f.obs && ` (${f.obs})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {a.status === 'rejeitado' && a.motivo && (
                <p className="mt-2 text-sm text-red-600">Motivo: {a.motivo}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
