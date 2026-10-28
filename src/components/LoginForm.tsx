'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import SubmitButton from '@/components/SubmitButton'

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none'

export default function LoginForm({ initialError }: { initialError?: string }) {
  const [error, setError] = useState<string | null>(initialError ?? null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await login(formData)
    // em caso de sucesso o servidor redireciona; só chega aqui se houve erro
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
            placeholder="••••••••"
          />
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

        <SubmitButton
          pendingText="Entrando..."
          className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-medium hover:bg-blue-800 transition"
        >
          Entrar
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-xs text-gray-400">
        Esqueceu a senha? Procure o administrador do sistema para redefini-la.
      </p>

      <p className="mt-3 text-center text-sm text-gray-500">
        Não tem conta?{' '}
        <Link href="/register" className="text-blue-700 hover:underline font-medium">
          Cadastre-se
        </Link>
      </p>
    </>
  )
}
