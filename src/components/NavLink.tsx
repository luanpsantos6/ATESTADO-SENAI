'use client'

import Link, { useLinkStatus } from 'next/link'
import Spinner from '@/components/Spinner'

// Mostra o spinner DENTRO do link/aba/cartão enquanto a próxima página carrega.
function Indicador() {
  const { pending } = useLinkStatus()
  return pending ? <Spinner className="h-3.5 w-3.5 shrink-0" /> : null
}

export default function NavLink({
  href,
  className = '',
  children,
  card = false,
}: {
  href: string
  className?: string
  children: React.ReactNode
  /** card = bloco grande (spinner no canto superior direito) */
  card?: boolean
}) {
  if (card) {
    return (
      <Link href={href} className={`relative block ${className}`}>
        {children}
        <span className="absolute top-3 right-3 text-blue-600">
          <Indicador />
        </span>
      </Link>
    )
  }
  return (
    <Link href={href} className={`inline-flex items-center gap-2 ${className}`}>
      {children}
      <Indicador />
    </Link>
  )
}
