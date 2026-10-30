'use client'

import { useEffect, useState } from 'react'

// Evento do Chrome/Android que permite abrir o diálogo nativo de instalação
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Plataforma = 'ios' | 'android' | null

const CHAVE = 'pwa-aviso-dispensado'
const DIAS_SEM_INSISTIR = 14

function detectarPlataforma(): Plataforma {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  // iPadOS 13+ se identifica como Mac, mas tem tela de toque
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return null // computador: não mostra o aviso
}

function jaInstalado() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function foiDispensado() {
  try {
    const t = Number(localStorage.getItem(CHAVE) ?? 0)
    return t > 0 && Date.now() - t < DIAS_SEM_INSISTIR * 86400000
  } catch {
    return false
  }
}

export default function PwaInstall() {
  const [plataforma, setPlataforma] = useState<Plataforma>(null)
  const [visivel, setVisivel] = useState(false)
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null)
  const [passos, setPassos] = useState(false) // mostra instruções manuais (Android sem diálogo nativo)

  // registra o service worker (necessário para o app ser instalável)
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  useEffect(() => {
    const p = detectarPlataforma()
    if (!p || jaInstalado() || foiDispensado()) return
    setPlataforma(p)

    const aoPerguntar = (e: Event) => {
      e.preventDefault() // guardamos o evento para abrir o diálogo no nosso botão
      setEvento(e as BeforeInstallPromptEvent)
    }
    const aoInstalar = () => {
      setVisivel(false)
      setEvento(null)
    }
    window.addEventListener('beforeinstallprompt', aoPerguntar)
    window.addEventListener('appinstalled', aoInstalar)

    const t = setTimeout(() => setVisivel(true), 2500) // não atrapalha o carregamento
    return () => {
      clearTimeout(t)
      window.removeEventListener('beforeinstallprompt', aoPerguntar)
      window.removeEventListener('appinstalled', aoInstalar)
    }
  }, [])

  function dispensar() {
    try {
      localStorage.setItem(CHAVE, String(Date.now()))
    } catch {}
    setVisivel(false)
  }

  async function instalar() {
    if (evento) {
      await evento.prompt()
      const { outcome } = await evento.userChoice
      setEvento(null)
      if (outcome === 'accepted') setVisivel(false)
      else dispensar()
    } else {
      setPassos(true) // navegador sem diálogo nativo: mostra o passo a passo
    }
  }

  if (!visivel || !plataforma) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] px-3 pb-3"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      role="dialog"
      aria-label="Instalar aplicativo"
    >
      <div className="mx-auto max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 p-4">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" className="h-12 w-12 rounded-xl border" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">Instale o app do SENAI</p>
            <p className="text-sm text-gray-500">
              Tenha o Sistema de Atestados na tela inicial do seu celular, como um aplicativo.
            </p>
          </div>
          <button
            onClick={dispensar}
            aria-label="Fechar aviso"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none px-1"
          >
            ×
          </button>
        </div>

        {plataforma === 'ios' && (
          <ol className="mt-3 space-y-2 text-sm text-gray-700 bg-blue-50 rounded-xl p-3">
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-700">1.</span>
              <span>
                Toque em <b>Compartilhar</b>{' '}
                <svg viewBox="0 0 24 24" className="inline h-5 w-5 align-text-bottom text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>{' '}
                na barra do navegador
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-700">2.</span>
              <span>
                Role e escolha <b>“Adicionar à Tela de Início”</b>{' '}
                <svg viewBox="0 0 24 24" className="inline h-5 w-5 align-text-bottom text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <rect x="4" y="4" width="16" height="16" rx="3" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-700">3.</span>
              <span>Toque em <b>Adicionar</b></span>
            </li>
            <li className="text-xs text-gray-500">No iPhone, use o Safari para ver essa opção.</li>
          </ol>
        )}

        {plataforma === 'android' && (
          <>
            {passos && (
              <ol className="mt-3 space-y-1.5 text-sm text-gray-700 bg-blue-50 rounded-xl p-3">
                <li><b className="text-blue-700">1.</b> Toque no menu <b>⋮</b> do navegador (canto superior)</li>
                <li><b className="text-blue-700">2.</b> Escolha <b>“Instalar aplicativo”</b> ou <b>“Adicionar à tela inicial”</b></li>
                <li><b className="text-blue-700">3.</b> Confirme em <b>Instalar</b></li>
              </ol>
            )}
            {!passos && (
              <button
                onClick={instalar}
                className="mt-3 w-full rounded-xl bg-blue-700 py-2.5 font-medium text-white hover:bg-blue-800"
              >
                Instalar aplicativo
              </button>
            )}
          </>
        )}

        <button onClick={dispensar} className="mt-2 w-full text-center text-xs text-gray-400 hover:text-gray-600">
          Agora não
        </button>
      </div>
    </div>
  )
}
