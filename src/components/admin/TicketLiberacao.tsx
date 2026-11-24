'use client'

import Link from 'next/link'

type Props = {
  id: string
  aluno: string
  cpf: string
  turmas: string[]
  data: string
  horario: string
  responsavel: string
  autorizadoEm: string | null
}

export default function TicketLiberacao({
  id,
  aluno,
  cpf,
  turmas,
  data,
  horario,
  responsavel,
  autorizadoEm,
}: Props) {
  const protocolo = `SENAI-${id.toUpperCase()}`

  const dataFormatada = data
    .split('-')
    .reverse()
    .join('/')

  const emissao = autorizadoEm
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Cuiaba',
      }).format(new Date(autorizadoEm))
    : 'Não registrada'

  const hoje = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Cuiaba',
  })

  const vigente = data === hoje

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 print:bg-white print:p-0">

      <div className="max-w-xl mx-auto">

        <div className="flex items-center justify-between mb-5 print:hidden">

          <Link
            href="/admin/atrasos"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Voltar para atrasos
          </Link>

          <span className="text-xs text-gray-500">
            Controle de acesso
          </span>

        </div>

        <article className="bg-white rounded-2xl shadow-lg overflow-hidden border print:shadow-none print:break-inside-avoid">

          <header className="bg-[#00458f] text-white px-7 py-6">

            <div className="flex items-center justify-between">

              <div>
                <h1 className="text-4xl font-black italic tracking-tight">
                  SENAI
                </h1>

                <p className="text-sm text-blue-100 mt-2">
                  Sistema de Atestados e Justificativas
                </p>
              </div>

              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>

            </div>

          </header>

          <section className="px-6 py-8 text-center border-b">

            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${
              vigente
                ? 'bg-green-100 text-green-600'
                : 'bg-gray-100 text-gray-500'
            }`}>

              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"/>
                <path d="m7 12 3 3 7-7"/>
              </svg>

            </div>

            <p className={`text-xs font-semibold tracking-widest uppercase mb-2 ${
              vigente ? 'text-green-600' : 'text-gray-500'
            }`}>
              {vigente ? 'Liberação confirmada' : 'Registro histórico'}
            </p>

            <h2 className={`text-2xl sm:text-3xl font-black ${
              vigente ? 'text-green-700' : 'text-gray-700'
            }`}>
              {vigente
                ? 'ENTRADA AUTORIZADA'
                : 'AUTORIZAÇÃO FORA DA VIGÊNCIA'}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              {vigente
                ? 'Aluno liberado para ingressar em sala de aula.'
                : 'Esta autorização é válida somente na data indicada.'}
            </p>

          </section>

          <section className="p-7 space-y-6">

            <div>
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Nome do aluno
              </p>

              <p className="text-2xl font-bold text-gray-900 mt-1">
                {aluno}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5">

              <div>
                <p className="text-xs text-gray-400 uppercase">
                  Data da liberação
                </p>
                <p className="font-semibold text-gray-800 mt-1">
                  {dataFormatada}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase">
                  Horário de chegada
                </p>
                <p className="font-semibold text-gray-800 mt-1">
                  {horario.slice(0, 5)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase">
                  CPF
                </p>
                <p className="font-semibold text-gray-800 mt-1">
                  {cpf}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase">
                  Situação
                </p>
                <p className="font-semibold text-green-700 mt-1">
                  Aprovada
                </p>
              </div>

            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase">
                Turmas cadastradas
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {turmas.join(', ') || 'Não informada'}
              </p>
            </div>

            <div className="border-t border-dashed pt-5">

              <p className="text-xs text-gray-400 uppercase">
                Autorizado por
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {responsavel}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Autorização registrada em {emissao}
              </p>

            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">

              <p className="text-xs text-blue-700 font-semibold uppercase">
                Protocolo de autorização
              </p>

              <p className="font-mono text-sm font-bold text-blue-900 mt-2 break-all">
                {protocolo}
              </p>

            </div>

            <div className={`rounded-xl p-4 text-sm ${
              vigente
                ? 'bg-green-50 text-green-800 border border-green-100'
                : 'bg-amber-50 text-amber-800 border border-amber-100'
            }`}>
              {vigente
                ? 'A entrada do aluno está autorizada para a data informada neste documento.'
                : 'Segunda via histórica. Este documento não autoriza entrada na data atual.'}
            </div>

          </section>

          <footer className="bg-gray-50 border-t px-6 py-4 text-center">

            <p className="text-xs text-gray-500">
              Documento emitido eletronicamente.
            </p>

            <p className="text-xs text-gray-400 mt-1">
              SENAI — Sistema de Controle Acadêmico
            </p>

          </footer>

        </article>

        <div className="mt-5 flex flex-wrap gap-3 print:hidden">

          <button
            onClick={() => window.print()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-3 text-sm font-semibold"
          >
            Imprimir / Salvar PDF
          </button>

          <Link
            href="/admin/atrasos"
            className="flex-1 text-center bg-white border hover:bg-gray-50 rounded-xl px-5 py-3 text-sm font-semibold text-gray-700"
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
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

    </main>
  )
}
