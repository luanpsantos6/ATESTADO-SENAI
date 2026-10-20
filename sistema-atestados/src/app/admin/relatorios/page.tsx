import Navbar from '@/components/Navbar'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminResumo from '@/components/admin/AdminResumo'
import Relatorios, { type DadosRelatorio } from '@/components/admin/Relatorios'
import { requireRole } from '@/lib/auth'
import { differenceInCalendarDays, parseISO } from 'date-fns'

type Linha = Record<string, string | number | boolean | null>

export default async function RelatoriosPage() {
  const { supabase, profile } = await requireRole('admin')
  const erros: string[] = []

  // Lê a tabela inteira em páginas de 1000 (limite do Supabase por consulta)
  async function todos(tabela: string, colunas: string): Promise<Linha[]> {
    const out: Linha[] = []
    for (let de = 0; de < 100000; de += 1000) {
      const { data, error } = await supabase
        .from(tabela)
        .select(colunas)
        .order('id', { ascending: true })
        .range(de, de + 999)
      if (error) {
        erros.push(`${tabela}: ${error.message}`)
        break
      }
      const rows = (data ?? []) as unknown as Linha[]
      out.push(...rows)
      if (rows.length < 1000) break
    }
    return out
  }

  const [users, unidades, turmas, matriculas, atestados, faltas] = await Promise.all([
    todos('users', 'id, full_name, email, role, active, created_at'),
    todos('unidades', 'id, nome, cidade'),
    todos('turmas', 'id, nome, ano_letivo, professor_id, unidade_id'),
    todos('matriculas', 'id, aluno_id, turma_id'),
    todos('atestados', 'id, aluno_id, data_inicio, data_fim, status, motivo_rejeicao, observacao, created_at'),
    todos('faltas_abonadas', 'id, atestado_id, data_falta, turma_id, observacao'),
  ])

  const str = (v: unknown) => (v == null ? '' : String(v))
  const userMap = new Map(users.map((u) => [str(u.id), u]))
  const unidadeMap = new Map(unidades.map((u) => [str(u.id), u]))
  const turmaMap = new Map(turmas.map((t) => [str(t.id), t]))

  const turmasDoAluno = new Map<string, string[]>()
  for (const m of matriculas) {
    const k = str(m.aluno_id)
    turmasDoAluno.set(k, [...(turmasDoAluno.get(k) ?? []), str(m.turma_id)])
  }
  const alunosPorTurma = new Map<string, number>()
  for (const m of matriculas) {
    const k = str(m.turma_id)
    alunosPorTurma.set(k, (alunosPorTurma.get(k) ?? 0) + 1)
  }
  const faltasPorAtestado = new Map<string, number>()
  for (const f of faltas) {
    const k = str(f.atestado_id)
    faltasPorAtestado.set(k, (faltasPorAtestado.get(k) ?? 0) + 1)
  }
  const atestadoMap = new Map(atestados.map((a) => [str(a.id), a]))

  const nomeUnidade = (id: string) => str(unidadeMap.get(id)?.nome)

  const dados: DadosRelatorio = {
    atestados: atestados.map((a) => {
      const aluno = userMap.get(str(a.aluno_id))
      const tids = turmasDoAluno.get(str(a.aluno_id)) ?? []
      const uids = [...new Set(tids.map((t) => str(turmaMap.get(t)?.unidade_id)).filter(Boolean))]
      return {
        id: str(a.id),
        aluno: str(aluno?.full_name),
        email: str(aluno?.email),
        turmaIds: tids,
        turmas: tids.map((t) => str(turmaMap.get(t)?.nome)).filter(Boolean),
        unidadeIds: uids,
        unidades: uids.map(nomeUnidade).filter(Boolean),
        inicio: str(a.data_inicio),
        fim: str(a.data_fim),
        dias: differenceInCalendarDays(parseISO(str(a.data_fim)), parseISO(str(a.data_inicio))) + 1,
        status: str(a.status),
        enviadoEm: str(a.created_at),
        motivo: str(a.motivo_rejeicao),
        observacao: str(a.observacao),
        faltas: faltasPorAtestado.get(str(a.id)) ?? 0,
      }
    }),
    faltas: faltas.map((f) => {
      const at = atestadoMap.get(str(f.atestado_id))
      const aluno = userMap.get(str(at?.aluno_id))
      const turma = turmaMap.get(str(f.turma_id))
      const uid = str(turma?.unidade_id)
      return {
        id: str(f.id),
        aluno: str(aluno?.full_name),
        email: str(aluno?.email),
        dataFalta: str(f.data_falta),
        turmaId: str(f.turma_id),
        turma: str(turma?.nome),
        unidadeId: uid,
        unidade: nomeUnidade(uid),
        inicio: str(at?.data_inicio),
        fim: str(at?.data_fim),
        observacao: str(f.observacao),
      }
    }),
    usuarios: users.map((u) => ({
      id: str(u.id),
      nome: str(u.full_name),
      email: str(u.email),
      perfil: str(u.role),
      ativo: Boolean(u.active),
      criadoEm: str(u.created_at),
    })),
    turmas: turmas.map((t) => ({
      id: str(t.id),
      nome: str(t.nome),
      ano: Number(t.ano_letivo),
      unidadeId: str(t.unidade_id),
      unidade: nomeUnidade(str(t.unidade_id)),
      professorId: str(t.professor_id),
      professor: str(userMap.get(str(t.professor_id))?.full_name),
      alunos: alunosPorTurma.get(str(t.id)) ?? 0,
    })),
    matriculas: matriculas.map((m) => {
      const turma = turmaMap.get(str(m.turma_id))
      const uid = str(turma?.unidade_id)
      return {
        id: str(m.id),
        aluno: str(userMap.get(str(m.aluno_id))?.full_name),
        email: str(userMap.get(str(m.aluno_id))?.email),
        turmaId: str(m.turma_id),
        turma: str(turma?.nome),
        ano: Number(turma?.ano_letivo ?? 0),
        unidadeId: uid,
        unidade: nomeUnidade(uid),
      }
    }),
    opcoes: {
      turmas: turmas.map((t) => ({ id: str(t.id), nome: `${str(t.nome)} (${str(t.ano_letivo)})` })),
      unidades: unidades.map((u) => ({ id: str(u.id), nome: str(u.nome) })),
      professores: users
        .filter((u) => u.role === 'professor')
        .map((u) => ({ id: str(u.id), nome: str(u.full_name) })),
      anos: [...new Set(turmas.map((t) => Number(t.ano_letivo)))].sort((a, b) => b - a),
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="print:hidden">
        <Navbar userName={profile.full_name} role="admin" />
      </div>
      <main className="max-w-6xl mx-auto px-4 py-8 print:max-w-none print:p-0">
        <div className="print:hidden">
          <AdminPageHeader title="Relatórios" />
          <AdminResumo />
        </div>
        {erros.length > 0 && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 print:hidden">
            Erro ao carregar: {erros.join(' | ')}
          </div>
        )}
        <Relatorios dados={dados} />
      </main>
    </div>
  )
}
