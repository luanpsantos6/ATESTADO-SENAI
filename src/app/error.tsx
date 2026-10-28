'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-xl font-bold mb-2">Algo deu errado</h1>
        <p className="text-sm text-gray-500 mb-4">
          Não foi possível carregar esta página. Tente novamente.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4">Código: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
