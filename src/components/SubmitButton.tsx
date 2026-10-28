'use client'

import { useFormStatus } from 'react-dom'
import Spinner from '@/components/Spinner'

/**
 * Botão de envio com spinner. Usa useFormStatus, que reflete o estado REAL do
 * <form action={...}> (um useState dentro da action só aparece quando ela termina).
 * Precisa estar dentro do <form>.
 */
export default function SubmitButton({
  children,
  pendingText,
  className = '',
}: {
  children: React.ReactNode
  pendingText: string
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {pending ? (
        <>
          <Spinner />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}
