export type Role = 'admin' | 'professor' | 'aluno'
export type AtestadoStatus = 'pendente' | 'aprovado' | 'rejeitado'

export interface User {
  id: string
  full_name: string
  email: string
  role: Role
  active: boolean
  created_at: string
}

export interface Unidade {
  id: string
  nome: string
  cidade: string
  created_at: string
}

export interface ProfessorUnidade {
  id: string
  professor_id: string
  unidade_id: string
  created_at: string
  unidade?: Unidade
}

export interface Turma {
  id: string
  nome: string
  ano_letivo: number
  professor_id: string | null
  unidade_id: string | null
  created_at: string
  professor?: User
  unidade?: Unidade
}

export interface Matricula {
  id: string
  aluno_id: string
  turma_id: string
  created_at: string
  aluno?: User
  turma?: Turma
}

export interface Atestado {
  id: string
  aluno_id: string
  arquivo_url: string
  data_inicio: string
  data_fim: string
  observacao: string | null
  status: AtestadoStatus
  motivo_rejeicao: string | null
  aprovado_por: string | null
  aprovado_em: string | null
  created_at: string
  aluno?: Pick<User, 'full_name' | 'email'> | null
  faltas?: FaltaAbonada[]
}

export interface FaltaAbonada {
  id: string
  atestado_id: string
  data_falta: string
  turma_id: string | null
  observacao: string | null
  associado_por: string
  created_at: string
  turma?: Turma
}
