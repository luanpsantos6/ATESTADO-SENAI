'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/Spinner'
import {
  pesquisarAlunos,
  type AlunoBusca,
} from '@/app/actions/alunos'
import {
  enviarJustificativa,
} from '@/app/actions/justificativas'
import { CATEGORIAS } from '@/lib/atrasos'

const campo =
  'w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white'

export default function AdminNovaJustificativa() {
  const router = useRouter()

  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [alunos, setAlunos] = useState<AlunoBusca[]>([])
  const [selecionado, setSelecionado] = useState<AlunoBusca | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [pesquisado, setPesquisado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [descricao, setDescricao] = useState('')

  const hoje = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Cuiaba',
  })

  function abrir() {
    setBusca('')
    setAlunos([])
    setSelecionado(null)
    setErro(null)
    setOk(false)
    setDescricao('')
    setPesquisado(false)
    setAberto(true)
  }

  async function pesquisar() {
    if (buscando || salvando) return

    setErro(null)
    setSelecionado(null)
    setAlunos([])
    setPesquisado(false)

    if (busca.trim().length < 3) {
      setErro('Digite pelo menos 3 caracteres do nome ou o CPF completo.')
      return
    }

    setBuscando(true)

    try {
      const r = await pesquisarAlunos(busca)

      if (r.error) {
        setErro(r.error)
        return
      }

      setAlunos(r.alunos ?? [])
      setPesquisado(true)
    } catch {
      setErro('Não foi possível pesquisar os alunos.')
    } finally {
      setBuscando(false)
    }
  }

  async function registrar(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    if (salvando) return

    setErro(null)

    if (!selecionado) {
      setErro('Selecione um aluno.')
      return
    }

    const fd = new FormData(e.currentTarget)

    fd.set('aluno_id', selecionado.id)

    const arquivo = fd.get('comprovante')

    if (
      arquivo instanceof File &&
      arquivo.size > 4 * 1024 * 1024
    ) {
      setErro('O comprovante deve ter no máximo 4 MB.')
      return
    }

    setSalvando(true)

    try {
      const r = await enviarJustificativa(fd)

      if (r.error || !r.success) {
        setErro(r.error ?? 'Não foi possível registrar.')
        return
      }

      setOk(true)
      setSelecionado(null)
      setAlunos([])
      setBusca('')
      setDescricao('')

      router.refresh()
    } catch {
      setErro('Não foi possível registrar a justificativa.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        + Nova justificativa
      </button>

      {aberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-nova-justificativa"
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >

            <div className="flex items-center justify-between gap-3 mb-2">
              <h3
                id="titulo-nova-justificativa"
                className="text-lg font-semibold"
              >
                Nova justificativa de atraso
              </h3>

              <button
                type="button"
                disabled={salvando || buscando}
                onClick={() => setAberto(false)}
                className="text-gray-500 hover:text-gray-800 text-xl"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-5">
              Registre uma justificativa em nome de um aluno.
            </p>

            {ok ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
                  Justificativa registrada com sucesso!
                  A solicitação está pendente de análise.
                </div>

                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <div className="space-y-4">

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Pesquisar aluno por nome ou CPF *
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="search"
                      value={busca}
                      disabled={buscando || salvando}
                      onChange={(e) => {
                        setBusca(e.target.value)
                        setSelecionado(null)
                        setAlunos([])
                        setPesquisado(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void pesquisar()
                        }
                      }}
                      placeholder="Nome ou CPF do aluno"
                      className={campo}
                      autoFocus
                      maxLength={100}
                    />

                    <button
                      type="button"
                      disabled={buscando || salvando}
                      onClick={pesquisar}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60"
                    >
                      {buscando ? <Spinner /> : 'Pesquisar'}
                    </button>
                  </div>
                </div>

                {pesquisado && alunos.length === 0 && (
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                    Nenhum aluno encontrado.
                  </p>
                )}

                {!selecionado && alunos.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {alunos.map((aluno) => (
                      <button
                        key={aluno.id}
                        type="button"
                        onClick={() => setSelecionado(aluno)}
                        className="w-full text-left p-3 hover:bg-blue-50"
                      >
                        <p className="text-sm font-semibold">
                          {aluno.full_name}
                        </p>

                        <p className="text-xs text-gray-500">
                          {aluno.email}
                        </p>

                        <p className="text-xs text-gray-500">
                          CPF: {aluno.cpf ?? 'Não cadastrado'}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {selecionado && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">

                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="text-xs text-blue-700 mb-1">
                          Aluno selecionado
                        </p>

                        <p className="font-semibold text-sm">
                          {selecionado.full_name}
                        </p>

                        <p className="text-xs text-gray-600">
                          {selecionado.email}
                        </p>

                        <p className="text-xs text-gray-600">
                          CPF: {selecionado.cpf ?? 'Não cadastrado'}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => setSelecionado(null)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Alterar
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={registrar} className="space-y-4">

                  <fieldset disabled={salvando} className="space-y-4">

                    <div className="grid gap-4 sm:grid-cols-3">

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Data do atraso *
                        </label>

                        <input
                          name="data_atraso"
                          type="date"
                          required
                          defaultValue={hoje}
                          max={hoje}
                          className={campo}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Horário de chegada *
                        </label>

                        <input
                          name="horario_chegada"
                          type="time"
                          required
                          className={campo}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Motivo *
                        </label>

                        <select
                          name="categoria"
                          required
                          defaultValue=""
                          className={campo}
                        >
                          <option value="" disabled>
                            Selecione...
                          </option>

                          {CATEGORIAS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Explique o que aconteceu *
                      </label>

                      <textarea
                        name="descricao"
                        required
                        rows={3}
                        minLength={5}
                        maxLength={1000}
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Informe o motivo do atraso..."
                        className={campo}
                      />

                      <p className="text-xs text-gray-400 text-right">
                        {descricao.length}/1000
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Comprovante (opcional)
                      </label>

                      <input
                        name="comprovante"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="w-full text-sm"
                      />

                      <p className="text-xs text-gray-400 mt-1">
                        PDF, JPG ou PNG, até 4 MB.
                      </p>
                    </div>

                  </fieldset>

                  {erro && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      {erro}
                    </div>
                  )}

                  <div className="flex gap-3 pt-3 border-t">

                    <button
                      type="submit"
                      disabled={salvando || buscando || !selecionado}
                      className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
                    >
                      {salvando
                        ? <><Spinner /> Registrando...</>
                        : 'Registrar justificativa'}
                    </button>

                    <button
                      type="button"
                      disabled={salvando || buscando}
                      onClick={() => setAberto(false)}
                      className="text-sm text-gray-600 px-4 py-2"
                    >
                      Cancelar
                    </button>

                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
