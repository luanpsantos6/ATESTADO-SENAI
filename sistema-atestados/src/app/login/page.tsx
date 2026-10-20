import AuthShell from '@/components/AuthShell'
import LoginForm from '@/components/LoginForm'

const MOTIVOS: Record<string, string> = {
  desativado: 'Usuário desativado. Contate o administrador.',
  'sem-perfil': 'Seu perfil não foi encontrado. Contate o administrador.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>
}) {
  const { erro } = await searchParams
  return (
    <AuthShell title="Sistema de Atestados Médicos" subtitle="SENAI MT — Abono de Faltas">
      <LoginForm initialError={erro ? MOTIVOS[erro] : undefined} />
    </AuthShell>
  )
}
