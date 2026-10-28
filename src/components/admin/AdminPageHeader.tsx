'use client'

import NavLink from '@/components/NavLink'
import { usePathname, useRouter } from 'next/navigation'

const MENU = [
  { href: '/admin', rotulo: 'Painel' },
  { href: '/admin/atestados', rotulo: 'Atestados' },
  { href: '/admin/atrasos', rotulo: 'Atrasos' },
  { href: '/admin/usuarios', rotulo: 'Usuários' },
  { href: '/admin/turmas', rotulo: 'Turmas' },
  { href: '/admin/relatorios', rotulo: 'Relatórios' },
]

export default function AdminPageHeader({ title }: { title: string }) {
  const router = useRouter()
  const pathname = usePathname()

  // "Voltar" retorna à tela anterior de verdade; se não houver, vai ao painel.
  function voltar() {
    if (window.history.length > 1) router.back()
    else router.push('/admin')
  }

  return (
    <div className="mb-6">
      {/* menu do admin, presente em todas as telas */}
      <nav className="flex flex-wrap gap-2 mb-4">
        {MENU.map((m) => {
          const ativo = m.href === '/admin' ? pathname === '/admin' : pathname.startsWith(m.href)
          return (
            <NavLink
              key={m.href}
              href={m.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                ativo ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              {m.rotulo}
            </NavLink>
          )
        })}
      </nav>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={voltar} className="text-sm text-blue-600 hover:underline">
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
    </div>
  )
}
