'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

export default function AdminControleAcesso({
  atrasos,
  movimentacoes,
}: {
  atrasos: ReactNode
  movimentacoes: ReactNode
}) {
  const [aba, setAba] = useState('atrasos')

  return (
    <div className="space-y-5">

      <div className="flex flex-wrap gap-2 border-b pb-3">

        {[
          ['atrasos', 'Justificativas de atraso'],
          ['movimentacoes', 'Saídas temporárias e retornos'],
        ].map(([id, titulo]) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              aba === id
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-700 hover:bg-gray-50'
            }`}
          >
            {titulo}
          </button>
        ))}

      </div>

      <div hidden={aba !== 'atrasos'}>
        {atrasos}
      </div>

      <div hidden={aba !== 'movimentacoes'}>
        {movimentacoes}
      </div>

    </div>
  )
}
