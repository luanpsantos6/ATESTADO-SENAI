// Indicador de carregamento reutilizável (herda a cor do texto do botão).
export default function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

// Tela cheia de carregamento (usada pelos loading.tsx de cada área).
export function PageLoader({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <div
      className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-blue-700"
      role="status"
      aria-live="polite"
    >
      <Spinner className="h-9 w-9" />
      <p className="text-sm text-gray-500">{texto}</p>
    </div>
  )
}
