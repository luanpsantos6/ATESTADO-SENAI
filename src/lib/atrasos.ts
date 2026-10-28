export const CATEGORIAS = [
  { value: 'transporte', label: 'Transporte / trânsito' },
  { value: 'saude', label: 'Saúde' },
  { value: 'familiar', label: 'Problema familiar' },
  { value: 'trabalho', label: 'Trabalho' },
  { value: 'clima', label: 'Clima / chuva' },
  { value: 'outro', label: 'Outro' },
] as const

export type Categoria = (typeof CATEGORIAS)[number]['value']
export type StatusAtraso = 'pendente' | 'aprovada' | 'rejeitada'

export const rotuloCategoria = (v: string) => CATEGORIAS.find((c) => c.value === v)?.label ?? v
export const rotuloStatusAtraso = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const corStatusAtraso: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  aprovada: 'bg-green-100 text-green-800',
  rejeitada: 'bg-red-100 text-red-800',
}

// "08:15:00" -> "08:15"
export const formatHora = (v: string) => (v ? v.slice(0, 5) : '')

export type AtrasoView = {
  id: string
  alunoNome: string
  alunoEmail: string
  turmas: string[]
  data: string
  horario: string
  categoria: string
  descricao: string
  temArquivo: boolean
  status: StatusAtraso
  motivo: string | null
  enviadoEm: string
}
