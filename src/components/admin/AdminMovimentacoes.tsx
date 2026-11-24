'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registrarRetorno } from '@/app/actions/movimentacoes'
import {
  type Movimentacao,
  formatarMovimentacao,
  duracaoAusencia,
} from '@/lib/movimentacoes'
import AdminNovaSaida from './AdminNovaSaida'

type Filtro = 'abertas' | 'retornos' | 'atrasadas' | 'todas'

export default function AdminMovimentacoes({
  movimentacoes,
}: {
  movimentacoes: Movimentacao[]
}) {
  const router = useRouter()

  const [filtro, setFiltro] = useState<Filtro>('abertas')
  const [busca, setBusca] = useState('')
  const [agora, setAgora] = useState(Date.now())
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState<Movimentacao | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setAgora(Date.now())
    }, 15000)

    const atualizacao = setInterval(() => {
      router.refresh()
    }, 30000)

    return () => {
      clearInterval(timer)
      clearInterval(atualizacao)
    }
  }, [router])

  const abertas = movimentacoes.filter(
    m => m.status === 'em_saida'
  )

  const retornos = movimentacoes.filter(
    m => m.status === 'retornou'
  )

  const atrasadas = abertas.filter(
    m => new Date(m.retorno_previsto_em).getTime() < agora
  )

  const lista = movimentacoes.filter(m => {
    if (
      filtro === 'abertas' &&
      m.status !== 'em_saida'
    ) return false

    if (
      filtro === 'retornos' &&
      m.status !== 'retornou'
    ) return false

    if (
      filtro === 'atrasadas' &&
      !atrasadas.some(a => a.id === m.id)
    ) return false

    return m.alunoNome
      .toLowerCase()
      .includes(busca.toLowerCase())
  })

  async function retornar(id: string) {
    if (ocupado) return

    setOcupado(id)
    setErro('')

    try {
      const r = await registrarRetorno(id)

      if (r.error || !r.id) {
        setErro(r.error ?? 'Erro ao registrar retorno.')
        return
      }

      setConfirmando(null)
      router.push(`/admin/atrasos/movimentacoes/${id}?tipo=retorno`)
      router.refresh()
    } catch {
      setErro('Não foi possível registrar o retorno.')
    } finally {
      setOcupado(null)
    }
  }

  const indicadores = [
    {
      titulo: 'Fora da unidade',
      valor: abertas.length,
      cor: 'text-orange-600',
    },
    {
      titulo: 'Retornos registrados',
      valor: retornos.length,
      cor: 'text-green-600',
    },
    {
      titulo: 'Retornos em atraso',
      valor: atrasadas.length,
      cor: 'text-red-600',
    },
    {
      titulo: 'Movimentações',
      valor: movimentacoes.length,
      cor: 'text-blue-600',
    },
  ]

  return (
    <section className="space-y-4">

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-xl font-bold">
            Saídas temporárias e retornos
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Saídas abertas e histórico dos últimos 30 dias
          </p>
        </div>

        <AdminNovaSaida />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {indicadores.map(i => (
          <div
            key={i.titulo}
            className="bg-white rounded-xl shadow p-4"
          >
            <p className={`text-2xl font-bold ${i.cor}`}>
              {i.valor}
            </p>
            <p className="text-xs text-gray-500">
              {i.titulo}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ['abertas', `Em saída (${abertas.length})`],
          ['retornos', `Retornos (${retornos.length})`],
          ['atrasadas', `Em atraso (${atrasadas.length})`],
          ['todas', `Todas (${movimentacoes.length})`],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFiltro(id)}
            className={`px-3 py-2 rounded-lg text-sm ${
              filtro === id
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}

        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Pesquisar aluno..."
          className="ml-auto w-full sm:w-56 border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {erro && (
        <p className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {erro}
        </p>
      )}

      {!lista.length && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500 text-sm">
          Nenhuma movimentação encontrada.
        </div>
      )}

      {lista.map(m => {
        const aberto = m.status === 'em_saida'

        const atrasado = aberto &&
          new Date(m.retorno_previsto_em).getTime() < agora

        return (
          <article
            key={m.id}
            className="bg-white rounded-xl shadow p-5 space-y-3"
          >
            <div className="flex justify-between gap-3 flex-wrap">
              <div>
                <p className="font-semibold">{m.alunoNome}</p>
                <p className="text-xs text-gray-500">
                  Autorizado por {m.autorizadoNome}
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                atrasado
                  ? 'bg-red-100 text-red-700'
                  : aberto
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-green-100 text-green-700'
              }`}>
                {atrasado
                  ? 'Retorno em atraso'
                  : aberto
                    ? 'Fora da unidade'
                    : 'Retornou'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">

              <div>
                <p className="text-xs text-gray-500">Saída</p>
                <strong>{formatarMovimentacao(m.saida_em)}</strong>
              </div>

              <div>
                <p className="text-xs text-gray-500">Retorno previsto</p>
                <strong>
                  {formatarMovimentacao(m.retorno_previsto_em)}
                </strong>
              </div>

              <div>
                <p className="text-xs text-gray-500">Retorno efetivo</p>
                <strong>
                  {m.retorno_em
                    ? formatarMovimentacao(m.retorno_em)
                    : 'Aguardando'}
                </strong>
              </div>

              <div>
                <p className="text-xs text-gray-500">Tempo de ausência</p>
                <strong>
                  {duracaoAusencia(
                    m.saida_em,
                    m.retorno_em ?? new Date(agora).toISOString()
                  )}
                </strong>
              </div>

            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p><strong>Motivo:</strong> {m.motivo}</p>
              {m.destino && <p><strong>Destino:</strong> {m.destino}</p>}
              {m.observacoes && <p>{m.observacoes}</p>}
            </div>

            <div className="flex flex-wrap gap-2">

              {aberto && (
                <button
                  disabled={!!ocupado}
                  onClick={() => setConfirmando(m)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  Registrar retorno
                </button>
              )}

              <Link
                href={`/admin/atrasos/movimentacoes/${m.id}?tipo=saida`}
                className="border px-3 py-2 rounded-lg text-sm text-orange-700"
              >
                Ticket de saída
              </Link>

              {!aberto && (
                <Link
                  href={`/admin/atrasos/movimentacoes/${m.id}?tipo=retorno`}
                  className="border px-3 py-2 rounded-lg text-sm text-green-700"
                >
                  Ticket de retorno
                </Link>
              )}

            </div>
          </article>
        )
      })}

      {confirmando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar retorno"
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-lg font-bold">Confirmar retorno</h3>

            <p className="text-sm text-gray-600">
              Confirma que {confirmando.alunoNome} retornou à unidade?
            </p>

            <p className="text-sm bg-green-50 text-green-800 rounded-lg p-3">
              O horário de retorno será registrado automaticamente.
            </p>

            {erro && <p className="text-red-600 text-sm">{erro}</p>}

            <div className="flex gap-3">
              <button
                disabled={!!ocupado}
                onClick={() => retornar(confirmando.id)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {ocupado ? 'Registrando...' : 'Confirmar retorno'}
              </button>

              <button
                disabled={!!ocupado}
                onClick={() => setConfirmando(null)}
                className="text-sm text-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  )
}
