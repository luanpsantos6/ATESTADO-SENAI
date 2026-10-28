'use client'

import { useFormStatus } from 'react-dom'
import Spinner from '@/components/Spinner'

// Precisa estar DENTRO do <form action={logout}> para enxergar o estado de envio.
export default function LogoutButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-60"
    >
      {pending && <Spinner className="h-3.5 w-3.5" />}
      {pending ? 'Saindo...' : 'Sair'}
    </button>
  )
}
