import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SENAI MT — Sistema de Atestados Médicos',
  description: 'Gerenciamento de atestados médicos e abono de faltas — SENAI Mato Grosso',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
