import NavLink from '@/components/NavLink'
import Navbar from '@/components/Navbar'
import { requireRole } from '@/lib/auth'
import { formatDate } from '@/lib/format'

const itens = [
  { href: '/admin/atestados', titulo: 'Atestados', desc: 'Aprovar, rejeitar e associar faltas abonadas.' },
  { href: '/admin/atrasos', titulo: 'Atrasos', desc: 'Analisar justificativas de atraso dos alunos.' },
  { href: '/admin/usuarios', titulo: 'Usuários', desc: 'Cadastrar professores, alunos e administradores.' },
  { href: '/admin/turmas', titulo: 'Turmas e Matrículas', desc: 'Criar turmas e matricular alunos.' },
  { href: '/admin/relatorios', titulo: 'Relatórios', desc: 'Relatórios personalizados, exportação e impressão.' },
]

const statusCor: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-800',
}

export default async function AdminHomePage() {
  const { supabase, profile } = await requireRole('admin')

  const contar = (tabela: string, filtro?: [string, string]) => {
    let q = supabase.from(tabela).select('*', { count: 'exact', head: true })
    if (filtro) q = q.eq(filtro[0], filtro[1])
    return q
  }

  const [pend, aprov, rej, alunos, professores, turmas, recentes] = await Promise.all([
    contar('atestados', ['status', 'pendente']),
    contar('atestados', ['status', 'aprovado']),
    contar('atestados', ['status', 'rejeitado']),
    contar('users', ['role', 'aluno']),
    contar('users', ['role', 'professor']),
    contar('turmas'),
    supabase
      .from('atestados')
      .select('id, aluno_id, data_inicio, data_fim, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Se alguma consulta falhar, mostra o motivo real em vez de "0"
  const erros = [pend, aprov, rej, alunos, professores, turmas, recentes]
    .map((r) => r.error?.message)
    .filter((m): m is string => Boolean(m))

  const lista = recentes.data ?? []
  const ids = [...new Set(lista.map((a) => a.aluno_id))]
  const { data: nomes } = ids.length
    ? await supabase.from('users').select('id, full_name').in('id', ids)
    : { data: [] as { id: string; full_name: string }[] }
  const nomeDe = (id: string) => nomes?.find((n) => n.id === id)?.full_name ?? '—'

  const totalAtestados = (pend.count ?? 0) + (aprov.count ?? 0) + (rej.count ?? 0)

  const cards = [
    { rotulo: 'Pendentes', valor: pend.count, cor: 'text-yellow-600', href: '/admin/atestados?status=pendente' },
    { rotulo: 'Aprovados', valor: aprov.count, cor: 'text-green-600', href: '/admin/atestados?status=aprovado' },
    { rotulo: 'Rejeitados', valor: rej.count, cor: 'text-red-600', href: '/admin/atestados?status=rejeitado' },
    { rotulo: 'Alunos', valor: alunos.count, cor: 'text-blue-700', href: '/admin/usuarios' },
    { rotulo: 'Professores', valor: professores.count, cor: 'text-blue-700', href: '/admin/usuarios' },
    { rotulo: 'Turmas', valor: turmas.count, cor: 'text-blue-700', href: '/admin/turmas' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={profile.full_name} role="admin" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Painel do Administrador</h1>

        {erros.length > 0 ? (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold mb-1">Há um problema ao ler o banco de dados:</p>
            <ul className="list-disc list-inside">
              {[...new Set(erros)].map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mb-6 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Banco de dados conectado e funcionando.
            {totalAtestados === 0 && ' Nenhum atestado foi enviado ainda.'}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {cards.map((c) => (
            <NavLink card key={c.rotulo} href={c.href} className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
              <p className={`text-3xl font-bold ${c.cor}`}>{c.valor ?? '?'}</p>
              <p className="text-xs text-gray-500 mt-1">{c.rotulo}</p>
            </NavLink>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          {itens.map((i) => (
            <NavLink card key={i.href} href={i.href} className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
              <h2 className="font-semibold text-blue-700">{i.titulo}</h2>
              <p className="text-sm text-gray-500 mt-1">{i.desc}</p>
            </NavLink>
          ))}
        </div>

        <h2 className="text-lg font-semibold mb-3">Últimos atestados enviados</h2>
        <div className="bg-white rounded-xl shadow divide-y">
          {lista.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">Nenhum atestado enviado ainda.</p>
          ) : (
            lista.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <div>
                  <p className="font-medium">{nomeDe(a.aluno_id)}</p>
                  <p className="text-gray-500">
                    {formatDate(a.data_inicio)} → {formatDate(a.data_fim)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusCor[a.status]}`}>
                  {a.status}
                </span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
