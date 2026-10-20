import Navbar from '@/components/Navbar'
import EnviarAtestado from '@/components/aluno/EnviarAtestado'
import ListaAtestados from '@/components/aluno/ListaAtestados'
import { requireRole } from '@/lib/auth'
import type { Atestado } from '@/types/database'

export default async function AlunoPage() {
  const { supabase, user, profile } = await requireRole('aluno')

  const { data: atestados } = await supabase
    .from('atestados')
    .select('*, faltas:faltas_abonadas(*)')
    .eq('aluno_id', user.id)
    .order('created_at', { ascending: false })
    .returns<Atestado[]>()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={profile.full_name} role="aluno" />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold">Meus Atestados</h1>
        <EnviarAtestado />
        <ListaAtestados atestados={atestados ?? []} />
      </main>
    </div>
  )
}
