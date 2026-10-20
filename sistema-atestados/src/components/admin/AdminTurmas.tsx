'use client'

import { useEffect, useState } from 'react'
import { Unidade, User } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export type TurmaRow = {
  id: string
  nome: string
  ano_letivo: number
  professor_id: string | null
  unidade_id: string | null
  created_at?: string
  professor?: { full_name?: string } | null
  unidade?: { nome?: string; cidade?: string } | null
}

interface Props {
  turmas: TurmaRow[]
  unidades: Unidade[]
  professores: User[]
  alunos: User[]
}

export default function AdminTurmas({
  turmas: initial,
  unidades,
  professores,
  alunos,
}: Props) {
  const [turmas, setTurmas] = useState(initial)
  useEffect(() => {
    setTurmas(initial)
  }, [initial])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingMatriculas, setEditingMatriculas] = useState<string | null>(null)
  const [selectedAlunos, setSelectedAlunos] = useState<string[]>([])
  const [busca, setBusca] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function createTurma(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)

    const { error: insertError } = await supabase.from('turmas').insert({
      nome: fd.get('nome') as string,
      ano_letivo: Number(fd.get('ano_letivo')),
      professor_id: (fd.get('professor_id') as string) || null,
      unidade_id: fd.get('unidade_id') as string,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setShowForm(false)
    setLoading(false)
    router.refresh()
  }

  async function deleteTurma(id: string) {
    if (!confirm('Excluir esta turma?')) return
    const { error: delError } = await supabase.from('turmas').delete().eq('id', id)
    if (delError) {
      setError(`Erro ao excluir turma: ${delError.message}`)
      return
    }
    setError(null)
    setTurmas((prev) => prev.filter((t) => t.id !== id))
  }

  async function openMatriculas(turmaId: string) {
    const { data } = await supabase
      .from('matriculas')
      .select('aluno_id')
      .eq('turma_id', turmaId)

    const ids = data?.map((m) => m.aluno_id) || []
    setSelectedAlunos(ids)
    setBusca('')
    setEditingMatriculas(turmaId)
  }

  async function saveMatriculas(turmaId: string) {
    setLoading(true)
    const { error: delError } = await supabase.from('matriculas').delete().eq('turma_id', turmaId)

    let saveError = delError?.message
    if (!saveError && selectedAlunos.length > 0) {
      const { error: insError } = await supabase.from('matriculas').insert(
        selectedAlunos.map((aluno_id) => ({
          aluno_id,
          turma_id: turmaId,
        }))
      )
      saveError = insError?.message
    }

    if (saveError) {
      setError(`Erro ao salvar matrículas: ${saveError}`)
      setLoading(false)
      return
    }
    setError(null)

    setEditingMatriculas(null)
    setLoading(false)
    router.refresh()
  }

  // busca sem diferenciar maiúsculas/acentos, por nome completo ou e-mail
  const normaliza = (t: string) =>
    t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  const termos = normaliza(busca).split(/\s+/).filter(Boolean)
  const resultados = alunos.filter((a) => {
    const alvo = normaliza(`${a.full_name} ${a.email}`)
    return termos.length > 0 && termos.every((t) => alvo.includes(t))
  }).slice(0, 30)

  function toggleAluno(id: string) {
    setSelectedAlunos((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
      >
        {showForm ? 'Cancelar' : '+ Nova turma'}
      </button>

      {showForm && (
        <form onSubmit={createTurma} className="bg-white rounded-xl shadow p-5 mb-6 space-y-3">
          <input
            name="nome"
            placeholder="Nome da turma (ex: 3º Ano A)"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            name="ano_letivo"
            type="number"
            placeholder="Ano letivo"
            defaultValue={new Date().getFullYear()}
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
          <select name="unidade_id" required className="w-full px-3 py-2 border rounded-lg">
            <option value="">Selecione a unidade *</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome} ({u.cidade})
              </option>
            ))}
          </select>
          <select name="professor_id" className="w-full px-3 py-2 border rounded-lg">
            <option value="">Professor responsável (opcional)</option>
            {professores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            {loading ? 'Criando...' : 'Criar turma'}
          </button>
        </form>
      )}

      {error && !showForm && (
        <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{error}</p>
      )}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">Turma</th>
              <th className="text-left px-4 py-3">Ano</th>
              <th className="text-left px-4 py-3">Unidade</th>
              <th className="text-left px-4 py-3">Professor</th>
              <th className="text-left px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {turmas.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-3 font-medium">{t.nome}</td>
                <td className="px-4 py-3">{t.ano_letivo}</td>
                <td className="px-4 py-3">{t.unidade?.nome || '—'}</td>
                <td className="px-4 py-3">{t.professor?.full_name || '—'}</td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => openMatriculas(t.id)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Matrículas
                  </button>
                  <button
                    onClick={() => deleteTurma(t.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {turmas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Nenhuma turma cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingMatriculas && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Matricular Alunos</h3>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite o nome do aluno para pesquisar..."
              autoFocus
              className="w-full px-3 py-2 border rounded-lg text-sm mb-2 outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Resultados: só aparecem quando há pesquisa */}
            {termos.length > 0 && (
              <div className="border rounded-lg mb-4 max-h-48 overflow-y-auto divide-y">
                {resultados.length === 0 ? (
                  <p className="p-3 text-sm text-gray-400">Nenhum aluno encontrado.</p>
                ) : (
                  resultados.map((a) => {
                    const marcado = selectedAlunos.includes(a.id)
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          if (!marcado) toggleAluno(a.id)
                        }}
                        disabled={marcado}
                        className="w-full flex items-center justify-between gap-3 p-2.5 text-left text-sm hover:bg-blue-50 disabled:bg-gray-50 disabled:cursor-default"
                      >
                        <span>
                          {a.full_name} <span className="text-gray-400">({a.email})</span>
                        </span>
                        <span className={marcado ? 'text-green-600 text-xs' : 'text-blue-600 text-xs font-medium'}>
                          {marcado ? 'Já na turma' : '+ Adicionar'}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            )}

            {/* Alunos já selecionados para esta turma */}
            <p className="text-sm font-medium mb-2">
              Alunos nesta turma ({selectedAlunos.length})
            </p>
            <div className="mb-6 max-h-48 overflow-y-auto">
              {selectedAlunos.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Nenhum aluno ainda. Pesquise acima para adicionar.
                </p>
              ) : (
                <ul className="space-y-1">
                  {alunos
                    .filter((a) => selectedAlunos.includes(a.id))
                    .map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-1.5 text-sm"
                      >
                        <span>{a.full_name}</span>
                        <button
                          type="button"
                          onClick={() => toggleAluno(a.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => saveMatriculas(editingMatriculas)}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar matrículas'}
              </button>
              <button
                onClick={() => setEditingMatriculas(null)}
                className="text-sm text-gray-600 px-4 py-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
