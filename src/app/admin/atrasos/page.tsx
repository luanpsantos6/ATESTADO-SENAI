import AdminControleAcesso from '@/components/admin/AdminControleAcesso'
import AdminMovimentacoes from '@/components/admin/AdminMovimentacoes'
import { carregarMovimentacoes } from '@/lib/movimentacoesDados'
import AdminNovaJustificativa from '@/components/admin/AdminNovaJustificativa'
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
        <AdminPageHeader
          title="Controle de entrada e saída de alunos"
          actions={<AdminNovaJustificativa />}
        />
        <AdminResumo />
        {erro && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erroAtrasos(erro)}</div>
        )}
        <AdminControleAcesso
          atrasos={<AnaliseAtrasos permitirTicket atrasos={atrasos} buscaInicial={busca ?? ''} />}
          movimentacoes={
            <AdminMovimentacoes
              movimentacoes={await carregarMovimentacoes()}
            />
          }
        />
      </main>
    </div>
  )
}
