'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  pesquisarAlunos,
  type AlunoBusca,
} from '@/app/actions/alunos'
import { autorizarSaida } from '@/app/actions/movimentacoes'

const campo =
  'w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white'

export default function AdminNovaSaida() {
  const router = useRouter()

  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [alunos, setAlunos] = useState<AlunoBusca[]>([])
  const [aluno, setAluno] = useState<AlunoBusca | null>(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  function abrir() {
    setBusca('')
    setAlunos([])
    setAluno(null)
    setErro('')
    setAberto(true)
  }

  async function pesquisar() {
    if (ocupado) return

    setOcupado(true)
    setErro('')
    setAluno(null)
    setAlunos([])

    try {
      const r = await pesquisarAlunos(busca)

      if (r.error) {
        setErro(r.error)
        return
      }

      setAlunos(r.alunos ?? [])

      if (!r.alunos?.length) {
        setErro('Nenhum aluno encontrado.')
      }
    } catch {
      setErro('Erro ao pesquisar alunos.')
    } finally {
      setOcupado(false)
    }
  }

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!aluno || ocupado) return

    const fd = new FormData(e.currentTarget)
    fd.set('aluno_id', aluno.id)

    setOcupado(true)
    setErro('')

    try {
      const r = await autorizarSaida(fd)

      if (r.error || !r.id) {
        setErro(r.error ?? 'Erro ao registrar saída.')
        return
      }

      setAberto(false)
      router.push(`/admin/atrasos/movimentacoes/${r.id}?tipo=saida`)
      router.refresh()
    } catch {
      setErro('Não foi possível registrar a saída.')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <>
      <button
        onClick={abrir}
        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
      >
        + Saída temporária
      </button>

      {aberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Autorizar saída temporária"
            className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4"
          >
            <h2 className="text-lg font-bold">
              Autorizar saída temporária
            </h2>

            <p className="text-sm text-gray-500">
              Registre a saída e a previsão de retorno do aluno.
            </p>

            <div className="flex gap-2">
              <input
                value={busca}
                disabled={ocupado}
                onChange={e => {
                  setBusca(e.target.value)
                  setAluno(null)
                  setAlunos([])
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void pesquisar()
                  }
                }}
                placeholder="Nome ou CPF do aluno"
                className={campo}
              />

              <button
                type="button"
                disabled={ocupado}
                onClick={pesquisar}
                className="bg-blue-600 text-white px-4 rounded-lg text-sm disabled:opacity-50"
              >
                Pesquisar
              </button>
            </div>

            {!aluno && alunos.length > 0 && (
              <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                {alunos.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setAluno(a)}
                    className="block w-full text-left p-3 hover:bg-blue-50"
                  >
                    <strong className="text-sm">{a.full_name}</strong>
                    <p className="text-xs text-gray-500">
                      {a.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      CPF: {a.cpf ?? 'Não cadastrado'}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {aluno && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs text-blue-600">
                  Aluno selecionado
                </p>
                <strong>{aluno.full_name}</strong>
                <p className="text-xs text-gray-500">
                  CPF: {aluno.cpf ?? 'Não cadastrado'}
                </p>
              </div>
            )}

            <form onSubmit={salvar} className="space-y-4">

              <fieldset disabled={ocupado} className="space-y-4">

                <label className="block text-sm">
                  <span className="font-medium">Tempo autorizado</span>

                  <select
                    name="minutos"
                    defaultValue="30"
                    className={`${campo} mt-1`}
                  >
                    <option value="10">10 minutos</option>
                    <option value="15">15 minutos</option>
                    <option value="20">20 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="90">1 hora e 30 minutos</option>
                    <option value="120">2 horas</option>
                    <option value="180">3 horas</option>
                    <option value="240">4 horas</option>
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="font-medium">Motivo da saída *</span>
                  <input
                    name="motivo"
                    required
                    minLength={3}
                    maxLength={500}
                    placeholder="Informe o motivo"
                    className={`${campo} mt-1`}
                  />
                </label>

                <label className="block text-sm">
                  <span className="font-medium">Destino</span>
                  <input
                    name="destino"
                    maxLength={300}
                    placeholder="Local de destino"
                    className={`${campo} mt-1`}
                  />
                </label>

                <label className="block text-sm">
                  <span className="font-medium">Observações</span>
                  <textarea
                    name="observacoes"
                    rows={3}
                    maxLength={1000}
                    className={`${campo} mt-1`}
                  />
                </label>

              </fieldset>

              <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500">
                O horário de saída será registrado automaticamente
                no momento da autorização.
              </div>

              {erro && (
                <p className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                  {erro}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  disabled={!aluno || ocupado}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  {ocupado
                    ? 'Processando...'
                    : 'Autorizar saída e emitir ticket'}
                </button>

                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => setAberto(false)}
                  className="text-sm text-gray-600"
                >
                  Cancelar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}
