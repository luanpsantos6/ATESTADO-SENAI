/* Service worker do Sistema de Atestados.
 * Objetivo: tornar o app instalável e mostrar uma página amigável sem internet.
 * NÃO guarda páginas nem dados em cache (são privados e dependem de login). */
const VERSAO = 'v1'
const CACHE = `atestados-${VERSAO}`
const ESTATICOS = ['/offline.html', '/icon-192.png', '/icon-512.png', '/senai-logo.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ESTATICOS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return // envios (login, formulários, ações) vão direto para a rede
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Navegação: sempre rede; se estiver sem internet, mostra a página offline
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/offline.html')))
    return
  }

  // Arquivos estáticos do Next (com hash no nome): cache primeiro
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copia = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copia))
            return res
          })
      )
    )
  }
})
