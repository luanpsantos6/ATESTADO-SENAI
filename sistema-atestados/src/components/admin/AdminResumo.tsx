import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// Faixa de resumo exibida no topo de TODAS as telas do admin.
export default async function AdminResumo() {
  const supabase = await createClient()

  const contar = async (tabela: string, filtro?: [string, string]) => {
    let q = supabase.from(tabela).select('*', { count: 'exact', head: true })
    if (filtro) q = q.eq(filtro[0], filtro[1])
    const { count, error } = await q
    return error ? null : count ?? 0
  }

  const [pend, aprov, rej, alunos, professores, turmas] = await Promise.all([
    contar('atestados', ['status', 'pendente']),
    contar('atestados', ['status', 'aprovado']),
    contar('atestados', ['status', 'rejeitado']),
    contar('users', ['role', 'aluno']),
    contar('users', ['role', 'professor']),
    contar('turmas'),
  ])

  const itens = [
    { r: 'Atestados pendentes', v: pend, cor: 'text-yellow-600', href: '/admin/atestados?status=pendente', destaque: true },
    { r: 'Aprovados', v: aprov, cor: 'text-green-600', href: '/admin/atestados?status=aprovado' },
    { r: 'Rejeitados', v: rej, cor: 'text-red-600', href: '/admin/atestados?status=rejeitado' },
    { r: 'Alunos', v: alunos, cor: 'text-blue-700', href: '/admin/usuarios' },
    { r: 'Professores', v: professores, cor: 'text-blue-700', href: '/admin/usuarios' },
    { r: 'Turmas', v: turmas, cor: 'text-blue-700', href: '/admin/turmas' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {itens.map((i) => (
        <Link
          key={i.r}
          href={i.href}
          className={`bg-white rounded-xl shadow p-3 hover:shadow-md transition ${
            i.destaque && (i.v ?? 0) > 0 ? 'ring-2 ring-yellow-400' : ''
          }`}
        >
          <p className={`text-2xl font-bold ${i.cor}`}>{i.v ?? '?'}</p>
          <p className="text-xs text-gray-500">{i.r}</p>
        </Link>
      ))}
    </div>
  )
}
