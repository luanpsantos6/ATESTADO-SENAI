'use client'

import { logout } from '@/app/actions/auth'
import Link from 'next/link'
import Image from 'next/image'

interface NavbarProps {
  userName: string
  role: string
}

export default function Navbar({ userName, role }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Image
              src="/senai-logo.png"
              alt="SENAI"
              width={110}
              height={28}
              className="h-7 w-auto"
              priority
            />
            <span className="hidden sm:inline text-sm font-semibold text-gray-800 border-l border-gray-200 pl-2.5">
              Sistema de Atestados
            </span>
          </Link>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded capitalize font-medium">
            {role}
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-sm text-gray-700 hidden sm:inline">{userName}</span>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </nav>
  )
}
