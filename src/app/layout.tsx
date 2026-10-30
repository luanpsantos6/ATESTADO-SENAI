import type { Metadata, Viewport } from 'next'
import './globals.css'
import PwaInstall from '@/components/PwaInstall'

export const metadata: Metadata = {
  title: 'SENAI MT — Sistema de Atestados Médicos',
  description: 'Gerenciamento de atestados médicos e abono de faltas — SENAI Mato Grosso',
  applicationName: 'Atestados SENAI',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  // iPhone: abre em tela cheia, sem a barra do Safari, quando adicionado à tela de início
  appleWebApp: {
    capable: true,
    title: 'Atestados',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#0b3d91',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
        <PwaInstall />
      </body>
    </html>
  )
}
