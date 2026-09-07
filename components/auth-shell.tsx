import type React from 'react'
import { Zap } from 'lucide-react'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(255,45,120,0.18) 0%, transparent 70%), radial-gradient(50% 50% at 80% 90%, rgba(157,78,221,0.16) 0%, transparent 70%), radial-gradient(40% 40% at 15% 80%, rgba(0,212,255,0.12) 0%, transparent 70%)',
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="neon-gradient glow-primary mb-4 flex size-12 items-center justify-center rounded-xl">
            <Zap className="size-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-neon-gradient">
            {title}
          </h1>
          <p className="mt-2 text-pretty text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  )
}
