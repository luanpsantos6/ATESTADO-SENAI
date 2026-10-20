import Link from 'next/link'

export default function AdminPageHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Link href="/admin" className="text-sm text-blue-600 hover:underline">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  )
}
