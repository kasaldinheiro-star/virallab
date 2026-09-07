import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AdminProductsClient } from '@/components/admin-products-client'
import { PageHeader } from '@/components/page-header'
import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/lib/types'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  if (!user.user_metadata?.is_admin) redirect('/produtos')

  const { data } = await supabase
    .from('products')
    .select('*')
    .order('score_tendencia', { ascending: false })

  const products = (data ?? []) as Product[]

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <Link
        href="/produtos"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para Produtos
      </Link>
      <PageHeader
        title="Admin · Produtos"
        description="Crie, edite e exclua os produtos em alta exibidos na listagem pública."
      />
      <AdminProductsClient products={products} />
    </div>
  )
}
