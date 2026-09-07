'use client'

import { LayoutDashboard, LogOut, Package, TrendingUp, Video, Wand2, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analisador', label: 'Analisador', icon: Wand2 },
  { href: '/meus-videos', label: 'Meus Vídeos', icon: Video },
  { href: '/produtos', label: 'Produtos em Alta', icon: Package },
  { href: '/trends', label: 'Temas em Alta', icon: TrendingUp },
  { href: '/nichos', label: 'Nichos', icon: Zap },
]

export function AppSidebar({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="neon-gradient glow-primary flex size-9 items-center justify-center rounded-lg">
          <Zap className="size-5 text-primary-foreground" />
        </div>
        <span className="font-display text-xl font-bold text-neon-gradient">ViralLab</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'neon-gradient text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
        {isAdmin && (
          <Link
            href="/admin/products"
            className={cn(
              'group mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              pathname.startsWith('/admin')
                ? 'bg-accent text-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            <Package className="size-4.5 shrink-0" />
            Admin · Produtos
          </Link>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 truncate px-3 text-xs text-muted-foreground" title={email}>
          {email}
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="size-4.5" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
