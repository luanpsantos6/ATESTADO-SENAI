'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/Spinner'
import { enviarJustificativa, urlComprovante } from '@/app/actions/justificativas'
import {
  CATEGORIAS,
  corStatusAtraso,
  formatHora,
  rotuloCategoria,
  rotuloStatusAtraso,
  type AtrasoView,
} from '@/lib/atrasos'
import { formatDate, formatDateTime } from '@/lib/format'

const campo =
  'w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white'

export default function JustificarAtraso({ historico }: { historico: AtrasoView[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, start] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [hoje, setHoje] = useState('')
  const [descricao, setDescricao] = useState('')
  const [abrindo, setAbrindo] = useState<string | null>(null)

  // data de hoje no fuso do aluno (evita divergência servidor/navegador)
  useEffect(() => setHoje(new Date().toLocaleDateString('en-CA')), [])

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setOk(false)
    const fd = new FormData(e.currentTarget)
    const arq = fd.get('comprovante')
    if (arq instanceof File && arq.size > 4 * 1024 * 1024) {
      return setErro('O comprovante deve ter no máximo 4 MB.')
    }
    start(async () => {
      const r = await enviarJustificativa(fd)
      if (r.error) return setErro(r.error)
      setOk(true)
      setDescricao('')
      formRef.current?.reset()
      router.refresh()
    })
  }

  async function verComprovante(id: string) {
    setAbrindo(id)
    const aba = window.open('', '_blank') // abre antes do await para não ser bloqueado
    const r = await urlComprovante(id)
    setAbrindo(null)
    if (r.url && aba) aba.location.href = r.url
    else {
      aba?.close()
      setErro(r.error ?? 'Não foi possível abrir o comprovante.')
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-1">Justificar atraso</h2>
        <p className="text-sm text-gray-500 mb-4">
          Chegou depois do horário? Explique o motivo. O professor ou o administrador vai analisar.
        </p>

        <form ref={formRef} onSubmit={enviar} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-1">Data do atraso *</label>
              <input name="data_atraso" type="date" required max={hoje || undefined} defaultValue={hoje} key={hoje} className={campo} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Horário de chegada *</label>
              <input name="horario_chegada" type="time" required className={campo} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Motivo *</label>
              <select name="categoria" required defaultValue="" className={campo}>
                <option value="" disabled>Selecione...</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Explique o que aconteceu *</label>
            <textarea
              name="descricao"
              required
              rows={3}
              maxLength={1000}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: o ônibus quebrou no caminho e chegou 40 minutos atrasado."
              className={campo}
            />
            <p className="text-xs text-gray-400 text-right">{descricao.length}/1000</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Comprovante (opcional)</label>
            <input name="comprovante" type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full text-sm" />
            <p className="text-xs text-gray-400 mt-1">PDF, JPG ou PNG, até 4 MB. Ex.: declaração do transporte.</p>
          </div>

          {erro && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{erro}</div>}
          {ok && (
            <div className="text-green-700 text-sm bg-green-50 p-3 rounded-lg">
              Justificativa enviada! Acompanhe o status no histórico abaixo.
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {pending ? (<><Spinner /> Enviando...</>) : 'Enviar justificativa'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Histórico de atrasos</h2>
        {historico.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
            Nenhuma justificativa enviada ainda.
          </div>
        ) : (
          historico.map((a) => (
            <div key={a.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${corStatusAtraso[a.status]}`}>
                  {rotuloStatusAtraso(a.status)}
                </span>
                <span className="text-sm text-gray-500">Enviado em {formatDateTime(a.enviadoEm)}</span>
              </div>
              <p className="text-sm">
                <strong>Atraso em {formatDate(a.data)}</strong> — chegada às {formatHora(a.horario)}
              </p>
              <p className="text-xs text-gray-500 mb-1">Motivo: {rotuloCategoria(a.categoria)}</p>
              <p className="text-sm text-gray-700">{a.descricao}</p>
              {a.status === 'rejeitada' && a.motivo && (
                <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                  <strong>Motivo da rejeição:</strong> {a.motivo}
                </p>
              )}
              {a.temArquivo && (
                <button
                  onClick={() => verComprovante(a.id)}
                  disabled={abrindo === a.id}
                  className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline disabled:opacity-60"
                >
                  {abrindo === a.id && <Spinner className="h-3.5 w-3.5" />} Ver comprovante
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
