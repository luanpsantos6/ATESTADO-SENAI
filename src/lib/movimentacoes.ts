export type Movimentacao = {
  id: string
  aluno_id: string
  alunoNome: string
  saida_em: string
  retorno_previsto_em: string
  retorno_em: string | null
  motivo: string
  destino: string | null
  observacoes: string | null
  autorizado_por: string
  retorno_registrado_por: string | null
  autorizadoNome: string
  retornoNome: string
  status: 'em_saida' | 'retornou'
}

export function formatarMovimentacao(data: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Cuiaba',
  }).format(new Date(data))
}

export function duracaoAusencia(
  saida: string,
  retorno: string
) {
  const minutos = Math.max(
    0,
    Math.floor(
      (new Date(retorno).getTime() -
       new Date(saida).getTime()) / 60000
    )
  )

  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60

  return horas > 0
    ? `${horas}h ${resto}min`
    : `${resto} min`
}
