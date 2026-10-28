'use client'

import { useState, useEffect } from 'react'
import { User, Role, Unidade } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { createUserAsAdmin, resetPasswordAsAdmin } from '@/app/actions/admin'
import Spinner from '@/components/Spinner'

export default function AdminUsuarios({
  users: initial,
  currentUserId,
}: {
  users: User[]
  currentUserId: string
}) {
  const [users, setUsers] = useState(initial)
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingUnidades, setEditingUnidades] = useState<string | null>(null)
  const [selectedUnidades, setSelectedUnidades] = useState<string[]>([])
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [resetErro, setResetErro] = useState<string | null>(null)
  const [resetOk, setResetOk] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // router.refresh() traz novos dados do servidor; sincroniza o estado local
  useEffect(() => {
    setUsers(initial)
  }, [initial])

  useEffect(() => {
    supabase
      .from('unidades')
      .select('*')
      .order('cidade')
      .then(({ data }) => {
        if (data) setUnidades(data)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function abrirReset(u: User) {
    setResetUser(u)
    setNovaSenha('')
    setResetErro(null)
    setResetOk(false)
  }

  // senha aleatória sem caracteres ambíguos (0/O, 1/l/I)
  function gerarSenha() {
    const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    const bytes = new Uint32Array(10)
    crypto.getRandomValues(bytes)
    setNovaSenha(Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join(''))
    setResetOk(false)
  }

  async function confirmarReset() {
    if (!resetUser) return
    setResetLoading(true)
    setResetErro(null)
    const r = await resetPasswordAsAdmin(resetUser.id, novaSenha)
    setResetLoading(false)
    if (r.error) return setResetErro(r.error)
    setResetOk(true)
  }

  async function createUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)

    const result = await createUserAsAdmin(fd)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    form.reset()
    setShowForm(false)
    setLoading(false)
    router.refresh()
  }

  async function toggleActive(id: string, current: boolean) {
    if (id === currentUserId) return
    const { error: updError } = await supabase
      .from('users')
      .update({ active: !current })
      .eq('id', id)
    if (updError) {
      setError(`Erro ao alterar status: ${updError.message}`)
      return
    }
    setError(null)
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !current } : u)))
  }

  async function changeRole(id: string, role: Role) {
    if (id === currentUserId) return
    const { error: updError } = await supabase.from('users').update({ role }).eq('id', id)
    if (updError) {
      setError(`Erro ao alterar perfil: ${updError.message}`)
      return
    }
    setError(null)
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
    const { error: delError } = await supabase
      .from('professor_unidades')
      .delete()
      .eq('professor_id', professorId)

    let saveError = delError?.message
    if (!saveError && selectedUnidades.length > 0) {
      const { error: insError } = await supabase.from('professor_unidades').insert(
        selectedUnidades.map((unidade_id) => ({
          professor_id: professorId,
          unidade_id,
        }))
      )
      saveError = insError?.message
    }

    if (saveError) {
      setError(`Erro ao salvar unidades: ${saveError}`)
      setLoading(false)
      return
    }
    setError(null)

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
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            {loading ? (<><Spinner /> Criando...</>) : 'Criar'}
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
                    disabled={u.id === currentUserId}
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
                    disabled={u.id === currentUserId}
                    className="text-xs text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                  >
                    {u.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => abrirReset(u)}
                    className="text-xs text-orange-600 hover:underline"
                  >
                    Redefinir senha
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
                className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? (<><Spinner /> Salvando...</>) : 'Salvar'}
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
      {resetUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-1">Redefinir senha</h3>
            <p className="text-sm text-gray-500 mb-4">
              {resetUser.full_name} <span className="text-gray-400">({resetUser.email})</span>
            </p>

            {resetOk ? (
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 mb-4">
                <p className="font-semibold mb-1">Senha alterada com sucesso!</p>
                <p>
                  Nova senha: <code className="bg-white px-2 py-0.5 rounded border select-all">{novaSenha}</code>
                </p>
                <p className="mt-2 text-xs text-green-700">
                  Passe essa senha ao usuário por um canal seguro. Ela não será exibida novamente.
                </p>
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium mb-1">Nova senha (mínimo 6 caracteres)</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    autoComplete="off"
                    autoFocus
                    className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={gerarSenha}
                    className="px-3 py-2 border rounded-lg text-sm text-blue-700 hover:bg-blue-50"
                  >
                    Gerar
                  </button>
                </div>
                {resetErro && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg mb-3">{resetErro}</p>
                )}
              </>
            )}

            <div className="flex gap-3">
              {!resetOk && (
                <button
                  onClick={confirmarReset}
                  disabled={resetLoading || novaSenha.length < 6}
                  className="inline-flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
                >
                  {resetLoading ? (<><Spinner /> Salvando...</>) : 'Alterar senha'}
                </button>
              )}
              <button
                onClick={() => setResetUser(null)}
                className="text-sm text-gray-600 px-4 py-2"
              >
                {resetOk ? 'Fechar' : 'Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
