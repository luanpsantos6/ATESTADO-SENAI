import Navbar from '@/components/Navbar'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminResumo from '@/components/admin/AdminResumo'
import AnaliseAtrasos from '@/components/atrasos/AnaliseAtrasos'
import { requireRole } from '@/lib/auth'
import { carregarAtrasos, erroAtrasos } from '@/lib/atrasosDados'

export default async function AdminAtrasosPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>
}) {
  const { profile } = await requireRole('admin')
  const { busca } = await searchParams
  const { atrasos, erro } = await carregarAtrasos()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={profile.full_name} role="admin" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AdminPageHeader title="Justificativas de atraso" />
        <AdminResumo />
        {erro && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erroAtrasos(erro)}</div>
        )}
        <AnaliseAtrasos atrasos={atrasos} buscaInicial={busca ?? ''} />
      </main>
    </div>
  )
}
