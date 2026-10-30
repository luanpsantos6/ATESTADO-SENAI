import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // upload de atestado (limite do app: 4 MB; Vercel aceita até 4,5 MB por requisição)
    serverActions: { bodySizeLimit: '5mb' },
  },
  async headers() {
    return [
      {
        // o service worker nunca pode ficar preso em cache, senão as atualizações não chegam
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ]
  },
}

export default nextConfig
