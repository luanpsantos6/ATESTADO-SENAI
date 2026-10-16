import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { format } from 'date-fns'

export default async function ProfessorPage() {
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

  if (!profile || profile.role !== 'professor') redirect('/dashboard')

  const { data: minhasUnidades } = await supabase
    .from('professor_unidades')
    .select('unidade_id, unidade:unidades(nome, cidade)')
    .eq('professor_id', user.id)

  const { data: atestados } = await supabase
    .from('atestados')
    .select(
      `
      *,
      aluno:users!atestados_aluno_id_fkey(full_name, email),
      faltas:faltas_abonadas(*, turma:turmas(nome, unidade:unidades(nome)))
    `
    )
    .eq('status', 'aprovado')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={profile.full_name} role="professor" />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Atestados Aprovados</h1>

        {minhasUnidades && minhasUnidades.length > 0 && (
          <p className="text-sm text-gray-500 mb-6">
            Suas unidades:{' '}
            {minhasUnidades
              .map((pu: { unidade?: { nome?: string } }) => pu.unidade?.nome)
              .filter(Boolean)
              .join(', ')}
          </p>
        )}

        {!atestados || atestados.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            Nenhum atestado aprovado dos alunos das suas unidades.
          </div>
        ) : (
          <div className="space-y-4">
            {atestados.map((a) => (
              <div key={a.id} className="bg-white rounded-xl shadow p-5">
                <p className="font-semibold">{a.aluno?.full_name}</p>
                <p className="text-sm text-gray-500">{a.aluno?.email}</p>
                <p className="text-sm mt-1">
                  Período: {format(new Date(a.data_inicio), 'dd/MM/yyyy')} até{' '}
                  {format(new Date(a.data_fim), 'dd/MM/yyyy')}
                </p>
                {a.faltas && a.faltas.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Faltas abonadas:</p>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {a.faltas.map(
                        (f: {
                          id: string
                          data_falta: string
                          turma?: { nome?: string; unidade?: { nome?: string } }
                        }) => (
                          <li key={f.id}>
                            {format(new Date(f.data_falta), 'dd/MM/yyyy')}
                            {f.turma && ` — ${f.turma.nome}`}
                            {f.turma?.unidade && ` (${f.turma.unidade.nome})`}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
