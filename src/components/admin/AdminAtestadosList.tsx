'use client'

import { useState } from 'react'
import { Atestado } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/format'
import NavLink from '@/components/NavLink'
import Spinner from '@/components/Spinner'

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-800',
}

type TurmaOption = {
  id: string
  nome: string
  ano_letivo: number
}

interface Props {
  atestados: Atestado[]
  turmas: TurmaOption[]
  currentStatus: string
  adminId: string
}

export default function AdminAtestadosList({
  atestados,
  turmas,
  currentStatus,
  adminId,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [associatingId, setAssociatingId] = useState<string | null>(null)
  const [dataFalta, setDataFalta] = useState('')
  const [turmaId, setTurmaId] = useState('')
  const [obsFalta, setObsFalta] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function aprovar(id: string) {
    setLoading(id)
    setError(null)
    const { error: updError } = await supabase
      .from('atestados')
      .update({
        status: 'aprovado',
        aprovado_por: adminId,
        aprovado_em: new Date().toISOString(),
        motivo_rejeicao: null,
      })
      .eq('id', id)
    setLoading(null)
    if (updError) return setError(`Erro ao aprovar: ${updError.message}`)
    router.refresh()
  }

  async function rejeitar(id: string) {
    if (!motivo.trim()) {
      alert('Informe o motivo da rejeição')
      return
    }
    setLoading(id)
    setError(null)
    const { error: updError } = await supabase
      .from('atestados')
      .update({
        status: 'rejeitado',
        aprovado_por: adminId,
        aprovado_em: new Date().toISOString(),
        motivo_rejeicao: motivo.trim(),
      })
      .eq('id', id)
    setLoading(null)
    if (updError) return setError(`Erro ao rejeitar: ${updError.message}`)
    setRejectingId(null)
    setMotivo('')
    router.refresh()
  }

  async function associarFalta(atestadoId: string) {
    if (!dataFalta) {
      alert('Informe a data da falta')
      return
    }
    setLoading(atestadoId)
    setError(null)
    const { error: insError } = await supabase.from('faltas_abonadas').insert({
      atestado_id: atestadoId,
      data_falta: dataFalta,
      turma_id: turmaId || null,
      observacao: obsFalta || null,
      associado_por: adminId,
    })
    setLoading(null)
    if (insError) return setError(`Erro ao associar falta: ${insError.message}`)
    setAssociatingId(null)
    setDataFalta('')
    setTurmaId('')
    setObsFalta('')
    router.refresh()
  }

  async function downloadFile(path: string) {
    const { data, error } = await supabase.storage.from('atestados').download(path)
    if (error || !data) return alert('Erro ao baixar')
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = path.split('/').pop() || 'atestado'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {['pendente', 'aprovado', 'rejeitado', 'todos'].map((s) => (
          <NavLink
            key={s}
            href={`/admin/atestados?status=${s}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              currentStatus === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </NavLink>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{error}</p>}

      {atestados.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          Nenhum atestado encontrado.
        </div>
      ) : (
        <div className="space-y-4">
          {atestados.map((a) => (
            <div key={a.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{a.aluno?.full_name}</p>
                  <p className="text-sm text-gray-500">{a.aluno?.email}</p>
                  <p className="text-sm mt-1">
                    {formatDate(a.data_inicio)} →{' '}
                    {formatDate(a.data_fim)}
                  </p>
                  {a.observacao && (
                    <p className="text-sm text-gray-600 mt-1">{a.observacao}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}
                >
                  {a.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => downloadFile(a.arquivo_url)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ver arquivo
                </button>

                {a.status === 'pendente' && (
                  <>
                    <button
                      onClick={() => aprovar(a.id)}
                      disabled={loading === a.id}
                      className="inline-flex items-center justify-center gap-2 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading === a.id && <Spinner className="h-3.5 w-3.5" />} Aprovar
                    </button>
                    <button
                      onClick={() => setRejectingId(a.id)}
                      className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Rejeitar
                    </button>
                  </>
                )}

                {a.status === 'aprovado' && (
                  <button
                    onClick={() => setAssociatingId(a.id)}
                    className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                  >
                    Associar falta
                  </button>
                )}
              </div>

              {rejectingId === a.id && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg space-y-3">
                  <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Motivo da rejeição *"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => rejeitar(a.id)}
                      disabled={loading === a.id}
                      className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded text-sm"
                    >
                      {loading === a.id && <Spinner className="h-3.5 w-3.5" />} Confirmar rejeição
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(null)
                        setMotivo('')
                      }}
                      className="text-sm text-gray-600"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {associatingId === a.id && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        {turmas.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nome} ({t.ano_letivo})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={obsFalta}
                    onChange={(e) => setObsFalta(e.target.value)}
                    placeholder="Observação (opcional)"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => associarFalta(a.id)}
                      disabled={loading === a.id}
                      className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-1.5 rounded text-sm"
                    >
                      {loading === a.id && <Spinner className="h-3.5 w-3.5" />} Associar
                    </button>
                    <button
                      onClick={() => setAssociatingId(null)}
                      className="text-sm text-gray-600"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {a.faltas && a.faltas.length > 0 && (
                <div className="mt-3 text-sm">
                  <p className="font-medium">Faltas abonadas:</p>
                  <ul className="list-disc list-inside text-gray-600">
                    {a.faltas.map((f) => (
                      <li key={f.id}>
                        {formatDate(f.data_falta)}
                        {f.observacao && ` — ${f.observacao}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {a.status === 'rejeitado' && a.motivo_rejeicao && (
                <p className="mt-2 text-sm text-red-600">Motivo: {a.motivo_rejeicao}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
