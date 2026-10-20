'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminPageHeader({ title }: { title: string }) {
  const router = useRouter()

  // "Voltar" retorna à tela anterior de verdade; se não houver, vai ao painel.
  function voltar() {
    if (window.history.length > 1) router.back()
    else router.push('/admin')
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <button type="button" onClick={voltar} className="text-sm text-blue-600 hover:underline">
        ← Voltar
      </button>
      <Link href="/admin" className="text-sm text-gray-500 hover:underline">
        Painel
      </Link>
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  )
}
