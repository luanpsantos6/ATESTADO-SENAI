'use client'

import Link from 'next/link'
import {
  type Movimentacao,
  formatarMovimentacao,
  duracaoAusencia,
} from '@/lib/movimentacoes'

export default function TicketMovimentacao({
  m,
  tipo,
  cpf,
  turmas,
}: {
  m: Movimentacao
  tipo: 'saida' | 'retorno'
  cpf: string
  turmas: string[]
}) {
  const retorno = tipo === 'retorno'

  const vigente = m.status === 'em_saida' &&
    new Date(m.retorno_previsto_em).getTime() >= Date.now()

  const titulo = retorno
    ? 'RETORNO REGISTRADO'
    : vigente
      ? 'SAÍDA AUTORIZADA'
      : 'REGISTRO HISTÓRICO DE SAÍDA'

  const cor = retorno
    ? 'text-green-700'
    : vigente
      ? 'text-orange-700'
      : 'text-gray-600'

  const fundo = retorno
    ? 'bg-green-100'
    : vigente
      ? 'bg-orange-100'
      : 'bg-gray-100'

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 print:bg-white print:p-0">

      <div className="max-w-xl mx-auto">

        <Link
          href="/admin/atrasos"
          className="block text-blue-600 text-sm mb-5 print:hidden"
        >
          ← Voltar ao controle de acesso
        </Link>

        <article className="bg-white border rounded-2xl shadow-lg overflow-hidden print:shadow-none print:break-inside-avoid">

          <header className="bg-[#00458f] text-white p-6">
            <h1 className="text-4xl font-black italic">SENAI</h1>
            <p className="text-sm text-blue-100 mt-2">
              Sistema de Controle de Acesso Acadêmico
            </p>
          </header>

          <section className="text-center p-7 border-b">

            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${fundo} ${cor}`}>

              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {retorno ? (
                  <>
                    <circle cx="12" cy="12" r="10"/>
                    <path d="m7 12 3 3 7-7"/>
                  </>
                ) : (
                  <>
                    <path d="M10 17l5-5-5-5"/>
                    <path d="M15 12H3"/>
                    <path d="M15 3h5a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-5"/>
                  </>
                )}
              </svg>

            </div>

            <h2 className={`text-2xl font-black mt-4 ${cor}`}>
              {titulo}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              {retorno
                ? 'Retorno do aluno registrado na unidade.'
                : vigente
                  ? 'Aluno autorizado a sair temporariamente.'
                  : 'Este ticket não representa uma saída vigente.'}
            </p>

          </section>

          <section className="p-7 space-y-5">

            <div>
              <p className="text-xs text-gray-400 uppercase">
                Nome do aluno
              </p>
              <p className="text-2xl font-bold">{m.alunoNome}</p>
            </div>

            <div className="grid grid-cols-2 gap-5">

              <div>
                <p className="text-xs text-gray-400 uppercase">CPF</p>
                <p className="font-semibold">{cpf}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase">Turmas</p>
                <p className="font-semibold">
                  {turmas.join(', ') || 'Não informada'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase">Saída</p>
                <p className="font-semibold">
                  {formatarMovimentacao(m.saida_em)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase">
                  Retorno previsto
                </p>
                <p className="font-semibold">
                  {formatarMovimentacao(m.retorno_previsto_em)}
                </p>
              </div>

              {retorno && m.retorno_em && (
                <>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">
                      Retorno efetivo
                    </p>
                    <p className="font-bold text-green-700">
                      {formatarMovimentacao(m.retorno_em)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 uppercase">
                      Tempo de ausência
                    </p>
                    <p className="font-bold">
                      {duracaoAusencia(m.saida_em, m.retorno_em)}
                    </p>
                  </div>
                </>
              )}

            </div>

            {retorno && m.retorno_em && (
              <div className={`p-3 rounded-lg text-sm ${
                new Date(m.retorno_em) >
                new Date(m.retorno_previsto_em)
                  ? 'bg-red-50 text-red-700'
                  : 'bg-green-50 text-green-700'
              }`}>
                {new Date(m.retorno_em) >
                 new Date(m.retorno_previsto_em)
                  ? 'Retorno registrado após o prazo autorizado.'
                  : 'Retorno registrado dentro do prazo autorizado.'}
              </div>
            )}

            <div className="border-t border-dashed pt-4">
              <p className="text-xs text-gray-400 uppercase">
                Saída autorizada por
              </p>
              <p className="font-semibold">{m.autorizadoNome}</p>
            </div>

            {retorno && (
              <div>
                <p className="text-xs text-gray-400 uppercase">
                  Retorno registrado por
                </p>
                <p className="font-semibold">{m.retornoNome}</p>
              </div>
            )}

            <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
              <p className="text-xs text-blue-700 uppercase font-semibold">
                Protocolo eletrônico
              </p>
              <p className="font-mono text-sm text-blue-900 font-bold break-all mt-2">
                SENAI-{retorno ? 'RET' : 'SAI'}-{m.id.toUpperCase()}
              </p>
            </div>

          </section>

          <footer className="bg-gray-50 border-t p-4 text-center">
            <p className="text-xs text-gray-500">
              Documento emitido eletronicamente pelo sistema SENAI.
            </p>
          </footer>

        </article>

        <div className="flex gap-3 mt-5 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-semibold"
          >
            Imprimir / Salvar PDF
          </button>

          <Link
            href="/admin/atrasos"
            className="flex-1 text-center bg-white border px-4 py-3 rounded-xl text-sm"
          >
            Concluir
          </Link>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

    </main>
  )
}
