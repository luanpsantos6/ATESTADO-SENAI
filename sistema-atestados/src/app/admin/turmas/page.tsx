import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AdminTurmas from '@/components/admin/AdminTurmas'

export default async function AdminTurmasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: turmas } = await supabase
    .from('turmas')
    .select(
      '*, professor:users!turmas_professor_id_fkey(full_name), unidade:unidades(nome, cidade)'
    )
    .order('nome')

  const { data: unidades } = await supabase
    .from('unidades')
    .select('*')
    .order('cidade')

  const { data: professores } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'professor')
    .eq('active', true)
    .order('full_name')

  const { data: alunos } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'aluno')
    .eq('active', true)
    .order('full_name')

  // Normaliza joins do Supabase (pode vir objeto ou array)
  const turmasNorm = (turmas || []).map((t: any) => {
    const professor = Array.isArray(t.professor) ? t.professor[0] : t.professor
    const unidade = Array.isArray(t.unidade) ? t.unidade[0] : t.unidade
    return { ...t, professor, unidade }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={profile.full_name} role="admin" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <a href="/admin" className="text-sm text-blue-600 hover:underline">
            ← Voltar
          </a>
          <h1 className="text-2xl font-bold">Turmas e Matrículas</h1>
        </div>
        <AdminTurmas
          turmas={turmasNorm as any}
          unidades={(unidades as any) || []}
          professores={(professores as any) || []}
          alunos={(alunos as any) || []}
        />
      </main>
    </div>
  )
}
