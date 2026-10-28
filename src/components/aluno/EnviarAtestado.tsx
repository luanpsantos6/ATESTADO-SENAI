'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/Spinner'

export default function EnviarAtestado() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const form = e.currentTarget
    const formData = new FormData(form)
    const dataInicio = formData.get('data_inicio') as string
    const dataFim = formData.get('data_fim') as string
    const observacao = formData.get('observacao') as string
    const arquivo = formData.get('arquivo') as File

    if (dataFim < dataInicio) {
      setError('Data fim não pode ser anterior à data início')
      setLoading(false)
      return
    }

    if (!arquivo || arquivo.size === 0) {
      setError('Selecione um arquivo')
      setLoading(false)
      return
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      setError('O arquivo deve ter no máximo 5 MB')
      setLoading(false)
      return
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowed.includes(arquivo.type)) {
      setError('Apenas PDF, JPG ou PNG são permitidos')
      setLoading(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const ext = (arquivo.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '')
      const fileName = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('atestados')
        .upload(fileName, arquivo)

      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from('atestados').insert({
        aluno_id: user.id,
        arquivo_url: fileName,
        data_inicio: dataInicio,
        data_fim: dataFim,
        observacao: observacao || null,
        status: 'pendente',
      })

      if (insertError) throw insertError

      setSuccess(true)
      form.reset()
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar atestado'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Enviar novo atestado</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data início *</label>
            <input
              name="data_inicio"
              type="date"
              required
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data fim *</label>
            <input
              name="data_fim"
              type="date"
              required
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Arquivo (PDF/JPG/PNG) *</label>
          <input
            name="arquivo"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            required
            className="w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Observação</label>
          <textarea
            name="observacao"
            rows={2}
            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Opcional"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
        )}
        {success && (
          <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">
            Atestado enviado com sucesso!
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (<><Spinner /> Enviando...</>) : 'Enviar atestado'}
        </button>
      </form>
    </div>
  )
}
