import Link from 'next/link'
import { AuthShell } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <AuthShell title="Ops" subtitle="Algo deu errado na autenticação">
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card/80 p-6 text-center backdrop-blur">
        <p className="text-sm text-muted-foreground">
          {error ? `Erro: ${error}` : 'Ocorreu um erro inesperado.'}
        </p>
        <Button asChild className="w-full">
          <Link href="/auth/login">Voltar ao login</Link>
        </Button>
      </div>
    </AuthShell>
  )
}
