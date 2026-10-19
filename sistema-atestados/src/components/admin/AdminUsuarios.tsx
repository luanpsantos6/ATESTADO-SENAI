'use client'

import { useState, useEffect } from 'react'
import { User, Role, Unidade } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { createUserAsAdmin } from '@/app/actions/admin'

export default function AdminUsuarios({ users: initial }: { users: User[] }) {
  const [users, setUsers] = useState(initial)
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingUnidades, setEditingUnidades] = useState<string | null>(null)
  const [selectedUnidades, setSelectedUnidades] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('unidades')
      .select('*')
      .order('cidade')
      .then(({ data }) => {
        if (data) setUnidades(data)
      })
  }, [])

  async function createUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)

    const result = await createUserAsAdmin(fd)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setShowForm(false)
    setLoading(false)
    router.refresh()
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('users').update({ active: !current }).eq('id', id)
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !current } : u)))
  }

  async function changeRole(id: string, role: Role) {
    await supabase.from('users').update({ role }).eq('id', id)
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
  }

  async function openUnidades(professorId: string) {
    const { data } = await supabase
      .from('professor_unidades')
      .select('unidade_id')
      .eq('professor_id', professorId)

    setSelectedUnidades(data?.map((d) => d.unidade_id) || [])
    setEditingUnidades(professorId)
  }

  async function saveUnidades(professorId: string) {
    setLoading(true)
    await supabase.from('professor_unidades').delete().eq('professor_id', professorId)

    if (selectedUnidades.length > 0) {
      await supabase.from('professor_unidades').insert(
        selectedUnidades.map((unidade_id) => ({
          professor_id: professorId,
          unidade_id,
        }))
      )
    }

    setEditingUnidades(null)
    setLoading(false)
    router.refresh()
  }

  function toggleUnidade(id: string) {
    setSelectedUnidades((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    )
  }

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
      >
        {showForm ? 'Cancelar' : '+ Novo usuário'}
      </button>

      {showForm && (
        <form onSubmit={createUser} className="bg-white rounded-xl shadow p-5 mb-6 space-y-3">
          <input
            name="full_name"
            placeholder="Nome completo"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            name="email"
            type="email"
            placeholder="E-mail"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            name="password"
            type="password"
            placeholder="Senha"
            required
            minLength={6}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <select name="role" className="w-full px-3 py-2 border rounded-lg">
            <option value="aluno">Aluno</option>
            <option value="professor">Professor</option>
            <option value="admin">Admin</option>
          </select>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            {loading ? 'Criando...' : 'Criar'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3">E-mail</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3">{u.full_name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value as Role)}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option value="aluno">aluno</option>
                    <option value="professor">professor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={u.active ? 'text-green-600' : 'text-red-600'}>
                    {u.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => toggleActive(u.id, u.active)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {u.active ? 'Desativar' : 'Ativar'}
                  </button>
                  {u.role === 'professor' && (
                    <button
                      onClick={() => openUnidades(u.id)}
                      className="text-xs text-purple-600 hover:underline"
                    >
                      Unidades
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUnidades && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Associar Unidades</h3>
            <p className="text-sm text-gray-500 mb-4">
              Selecione as unidades onde este professor trabalha:
            </p>
            <div className="space-y-2 mb-6">
              {unidades.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUnidades.includes(u.id)}
                    onChange={() => toggleUnidade(u.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    <strong>{u.nome}</strong>
                    <span className="text-gray-500 ml-1">({u.cidade})</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => saveUnidades(editingUnidades)}
                disabled={loading}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => setEditingUnidades(null)}
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
