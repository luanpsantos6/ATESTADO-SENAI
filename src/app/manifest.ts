import type { MetadataRoute } from 'next'

// Servido em /manifest.webmanifest — é o que permite "instalar" o sistema como aplicativo.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'SENAI MT — Sistema de Atestados',
    short_name: 'Atestados',
    description: 'Atestados médicos e justificativa de atrasos — SENAI Mato Grosso',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#0b3d91',
    lang: 'pt-BR',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
