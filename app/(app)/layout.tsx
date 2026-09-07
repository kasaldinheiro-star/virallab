import type React from 'react'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from '@/components/ui/sonner'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const isAdmin = Boolean(user.user_metadata?.is_admin)

  return (
    <div className="min-h-svh bg-background">
      <AppSidebar email={user.email ?? ''} isAdmin={isAdmin} />
      <div className="pl-64">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </div>
      <Toaster position="top-center" theme="dark" />
    </div>
  )
}
