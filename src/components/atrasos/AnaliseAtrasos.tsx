'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/Spinner'
import { analisarJustificativa, urlComprovante } from '@/app/actions/justificativas'
import {
  corStatusAtraso,
  formatHora,
  rotuloCategoria,
  rotuloStatusAtraso,
  type AtrasoView,
} from '@/lib/atrasos'
import { formatDate, formatDateTime } from '@/lib/format'

type Filtro = 'pendente' | 'aprovada' | 'rejeitada' | 'todos'

const normaliza = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export default function AnaliseAtrasos({
  atrasos,
  buscaInicial = '',
}: {
  atrasos: AtrasoView[]
  buscaInicial?: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [filtro, setFiltro] = useState<Filtro>(buscaInicial ? 'todos' : 'pendente')
  const [busca, setBusca] = useState(buscaInicial)
  const [erro, setErro] = useState<string | null>(null)
  const [agindo, setAgindo] = useState<string | null>(null) // id em processamento
  const [rejeitando, setRejeitando] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')

  const contagem = useMemo(
    () => ({
      pendente: atrasos.filter((a) => a.status === 'pendente').length,
      aprovada: atrasos.filter((a) => a.status === 'aprovada').length,
      rejeitada: atrasos.filter((a) => a.status === 'rejeitada').length,
      todos: atrasos.length,
    }),
    [atrasos]
  )

  const termos = normaliza(busca).split(/\s+/).filter(Boolean)
  const lista = atrasos.filter((a) => {
    if (filtro !== 'todos' && a.status !== filtro) return false
    const alvo = normaliza(`${a.alunoNome} ${a.alunoEmail} ${a.turmas.join(' ')} ${rotuloCategoria(a.categoria)}`)
    return termos.every((t) => alvo.includes(t))
  })

  function decidir(id: string, decisao: 'aprovada' | 'rejeitada') {
    setErro(null)
    setAgindo(id)
    start(async () => {
      const r = await analisarJustificativa(id, decisao, motivo)
      setAgindo(null)
      if (r.error) return setErro(r.error)
      setRejeitando(null)
      setMotivo('')
      router.refresh()
    })
  }

  async function verComprovante(id: string) {
    setErro(null)
    setAgindo(id)
    const aba = window.open('', '_blank')
    const r = await urlComprovante(id)
    setAgindo(null)
    if (r.url && aba) aba.location.href = r.url
    else {
      aba?.close()
      setErro(r.error ?? 'Não foi possível abrir o comprovante.')
    }
  }

  const abas: { k: Filtro; r: string }[] = [
    { k: 'pendente', r: 'Pendentes' },
    { k: 'aprovada', r: 'Aprovadas' },
    { k: 'rejeitada', r: 'Rejeitadas' },
    { k: 'todos', r: 'Todas' },
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
          placeholder="Pesquisar aluno, turma ou motivo..."
          className="ml-auto w-full sm:w-64 px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {erro && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}

      {lista.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          Nenhuma justificativa {filtro !== 'todos' ? rotuloStatusAtraso(filtro).toLowerCase() : ''} encontrada.
        </div>
      ) : (
        <div className="space-y-4">
          {lista.map((a) => {
            const ocupado = agindo === a.id && pending
            return (
              <div key={a.id} className="bg-white rounded-xl shadow p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{a.alunoNome || '(aluno sem nome)'}</p>
                    <p className="text-sm text-gray-500">{a.alunoEmail}</p>
                    {a.turmas.length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">Turma: {a.turmas.join(', ')}</p>
                    )}
                    <p className="text-sm mt-1">
                      <strong>Atraso em {formatDate(a.data)}</strong> — chegada às {formatHora(a.horario)}
                    </p>
                    <p className="text-xs text-gray-500">Motivo: {rotuloCategoria(a.categoria)}</p>
                    <p className="text-xs text-gray-400">Enviado em {formatDateTime(a.enviadoEm)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${corStatusAtraso[a.status]}`}>
                    {rotuloStatusAtraso(a.status)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{a.descricao}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {a.temArquivo && (
                    <button
                      onClick={() => verComprovante(a.id)}
                      disabled={agindo === a.id}
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mr-2 disabled:opacity-60"
                    >
                      {agindo === a.id && !pending && <Spinner className="h-3.5 w-3.5" />} Ver comprovante
                    </button>
                  )}
                  {a.status === 'pendente' && (
                    <>
                      <button
                        disabled={pending}
                        onClick={() => decidir(a.id, 'aprovada')}
                        className="inline-flex items-center gap-2 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-60"
                      >
                        {ocupado && rejeitando !== a.id && <Spinner className="h-3.5 w-3.5" />} Aprovar
                      </button>
                      <button
                        disabled={pending}
                        onClick={() => {
                          setRejeitando(a.id)
                          setMotivo('')
                        }}
                        className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-60"
                      >
                        Rejeitar
                      </button>
                    </>
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
                        onClick={() => decidir(a.id, 'rejeitada')}
                        className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded text-sm disabled:opacity-60"
                      >
                        {ocupado && <Spinner className="h-3.5 w-3.5" />} Confirmar rejeição
                      </button>
                      <button onClick={() => setRejeitando(null)} className="text-sm text-gray-600">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {a.status === 'rejeitada' && a.motivo && (
                  <p className="mt-2 text-sm text-red-600">Motivo: {a.motivo}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
