import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import EnviarAtestado from '@/components/aluno/EnviarAtestado'
import ListaAtestados from '@/components/aluno/ListaAtestados'

export default async function AlunoPage() {
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

  if (!profile || profile.role !== 'aluno') redirect('/dashboard')

  const { data: atestados } = await supabase
    .from('atestados')
    .select('*, faltas:faltas_abonadas(*)')
    .eq('aluno_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={profile.full_name} role="aluno" />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold">Meus Atestados</h1>
        <EnviarAtestado />
        <ListaAtestados atestados={(atestados as any) || []} />
      </main>
    </div>
  )
}
