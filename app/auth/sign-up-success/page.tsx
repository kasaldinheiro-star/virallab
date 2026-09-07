import Link from 'next/link'
import { AuthShell } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <AuthShell title="Quase lá" subtitle="Confirme seu e-mail para ativar a conta">
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card/80 p-6 text-center backdrop-blur">
        <p className="text-pretty text-sm text-muted-foreground">
          Enviamos um link de confirmação para o seu e-mail. Após confirmar, faça login para
          acessar o ViralLab.
        </p>
        <Button asChild className="w-full">
          <Link href="/auth/login">Ir para o login</Link>
        </Button>
      </div>
    </AuthShell>
  )
}
