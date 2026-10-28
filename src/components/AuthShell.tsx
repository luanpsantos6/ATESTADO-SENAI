import Image from 'next/image'

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/senai-logo.png"
            alt="SENAI"
            width={160}
            height={40}
            className="h-10 w-auto mb-3"
            priority
          />
          <h1 className="text-xl font-bold text-center text-gray-900">{title}</h1>
          <p className="text-gray-500 text-center text-sm mt-1">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
