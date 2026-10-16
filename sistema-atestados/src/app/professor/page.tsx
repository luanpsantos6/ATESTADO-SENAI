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

  const nomesUnidades =
    minhasUnidades
      ?.map((pu) => {
        const u = pu.unidade as { nome?: string } | { nome?: string }[] | null
        if (!u) return null
        if (Array.isArray(u)) return u[0]?.nome ?? null
        return u.nome ?? null
      })
      .filter((n): n is string => Boolean(n))
      .join(', ') || ''

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

        {nomesUnidades && (
          <p className="text-sm text-gray-500 mb-6">Suas unidades: {nomesUnidades}</p>
        )}

        {!atestados || atestados.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            Nenhum atestado aprovado dos alunos das suas unidades.
          </div>
        ) : (
          <div className="space-y-4">
            {atestados.map((a) => {
              const aluno = a.aluno as { full_name?: string; email?: string } | null
              const faltas = (a.faltas || []) as Array<{
                id: string
                data_falta: string
                turma?: {
                  nome?: string
                  unidade?: { nome?: string } | { nome?: string }[] | null
                } | null
              }>

              return (
                <div key={a.id} className="bg-white rounded-xl shadow p-5">
                  <p className="font-semibold">{aluno?.full_name}</p>
                  <p className="text-sm text-gray-500">{aluno?.email}</p>
                  <p className="text-sm mt-1">
                    Período: {format(new Date(a.data_inicio), 'dd/MM/yyyy')} até{' '}
                    {format(new Date(a.data_fim), 'dd/MM/yyyy')}
                  </p>
                  {faltas.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Faltas abonadas:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {faltas.map((f) => {
                          const turmaNome = f.turma?.nome
                          const unidadeRaw = f.turma?.unidade
                          const unidadeNome = Array.isArray(unidadeRaw)
                            ? unidadeRaw[0]?.nome
                            : unidadeRaw?.nome

                          return (
                            <li key={f.id}>
                              {format(new Date(f.data_falta), 'dd/MM/yyyy')}
                              {turmaNome && ` — ${turmaNome}`}
                              {unidadeNome && ` (${unidadeNome})`}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
