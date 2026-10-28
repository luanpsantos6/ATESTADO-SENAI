import Navbar from '@/components/Navbar'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminResumo from '@/components/admin/AdminResumo'
import AdminTurmas, { type TurmaRow } from '@/components/admin/AdminTurmas'
import { requireRole } from '@/lib/auth'
import type { Unidade, User } from '@/types/database'

// O Supabase pode devolver um join como objeto ou como array
const one = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null)

export default async function AdminTurmasPage() {
  const { supabase, profile } = await requireRole('admin')

  const [turmasRes, unidadesRes, professoresRes, alunosRes] = await Promise.all([
    supabase.from('turmas').select('*').order('nome'),
    supabase.from('unidades').select('*').order('cidade').returns<Unidade[]>(),
    supabase
      .from('users')
      .select('*')
      .eq('role', 'professor')
      .eq('active', true)
      .order('full_name')
      .returns<User[]>(),
    supabase
      .from('users')
      .select('*')
      .eq('role', 'aluno')
      .eq('active', true)
      .order('full_name')
      .returns<User[]>(),
  ])

  // Junta em código (sem depender de relacionamento do PostgREST) e mostra erros reais
  const erros = [turmasRes.error, unidadesRes.error, professoresRes.error, alunosRes.error]
    .filter(Boolean)
    .map((e) => e!.message)

  const unidades = unidadesRes.data ?? []
  const professores = professoresRes.data ?? []

  const turmas: TurmaRow[] = (turmasRes.data ?? []).map((t) => ({
    ...t,
    professor: professores.find((p) => p.id === t.professor_id) ?? null,
    unidade: unidades.find((u) => u.id === t.unidade_id) ?? null,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={profile.full_name} role="admin" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AdminPageHeader title="Turmas e Matrículas" />
        <AdminResumo />
        {erros.length > 0 && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Erro ao carregar: {erros.join(' | ')}
          </div>
        )}
        <AdminTurmas
          turmas={turmas}
          unidades={unidadesRes.data ?? []}
          professores={professoresRes.data ?? []}
          alunos={alunosRes.data ?? []}
        />
      </main>
    </div>
  )
}
