import Navbar from '@/components/Navbar'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTurmas, { type TurmaRow } from '@/components/admin/AdminTurmas'
import { requireRole } from '@/lib/auth'
import type { Unidade, User } from '@/types/database'

// O Supabase pode devolver um join como objeto ou como array
const one = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null)

export default async function AdminTurmasPage() {
  const { supabase, profile } = await requireRole('admin')

  const [turmasRes, unidadesRes, professoresRes, alunosRes] = await Promise.all([
    supabase
      .from('turmas')
      .select('*, professor:users!turmas_professor_id_fkey(full_name), unidade:unidades(nome, cidade)')
      .order('nome'),
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

  const turmas: TurmaRow[] = (turmasRes.data ?? []).map((t) => ({
    ...t,
    professor: one(t.professor),
    unidade: one(t.unidade),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={profile.full_name} role="admin" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AdminPageHeader title="Turmas e Matrículas" />
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
