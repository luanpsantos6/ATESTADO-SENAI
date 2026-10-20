'use client'

import { Atestado } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatDateTime } from '@/lib/format'

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-800',
}

export default function ListaAtestados({ atestados }: { atestados: Atestado[] }) {
  const supabase = createClient()

  async function downloadFile(path: string) {
    const { data, error } = await supabase.storage.from('atestados').download(path)
    if (error || !data) {
      alert('Erro ao baixar arquivo')
      return
    }
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = path.split('/').pop() || 'atestado'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (atestados.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
        Nenhum atestado enviado ainda.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Histórico</h2>
      {atestados.map((a) => (
        <div key={a.id} className="bg-white rounded-xl shadow p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}
            >
              {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
            </span>
            <span className="text-sm text-gray-500">
              Enviado em{' '}
              {formatDateTime(a.created_at)}
            </span>
          </div>
          <p className="text-sm">
            <strong>Período:</strong>{' '}
            {formatDate(a.data_inicio)} até{' '}
            {formatDate(a.data_fim)}
          </p>
          {a.observacao && <p className="text-sm text-gray-600 mt-1">{a.observacao}</p>}
          {a.status === 'rejeitado' && a.motivo_rejeicao && (
            <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
              <strong>Motivo da rejeição:</strong> {a.motivo_rejeicao}
            </p>
          )}
          {a.faltas && a.faltas.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">Faltas abonadas:</p>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                {a.faltas.map((f) => (
                  <li key={f.id}>{formatDate(f.data_falta)}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => downloadFile(a.arquivo_url)}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Baixar arquivo
          </button>
        </div>
      ))}
    </div>
  )
}
