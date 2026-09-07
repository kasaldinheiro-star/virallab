
import { ExternalLink, Flame } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/lib/types'
import { ProductTrendsClient } from '@/components/product-trends-client'

function scoreColor(score: number) {
  if (score >= 90) return 'text-primary'
  if (score >= 80) return 'text-cta'
  return 'text-accent'
}

export default async function ProdutosPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select('*')
    .order('score_tendencia', { ascending: false })

  const products = (data ?? []) as Product[]

  const { data: latestByCategoria } = await supabase
    .from('product_trends')
    .select('categoria, data_coleta')
    .order('data_coleta', { ascending: false })

  const trendsByCategoria: Record<string, any[]> = {}
  const CATEGORIAS_PRODUTO = ['tecnologia', 'casa', 'cama_banho', 'fitness', 'dia_a_dia']

  for (const categoria of CATEGORIAS_PRODUTO) {
    const latest = latestByCategoria?.find((t) => t.categoria === categoria)
    if (latest?.data_coleta) {
      const { data: trendData } = await supabase
        .from('product_trends')
        .select('*')
        .eq('categoria', categoria)
        .eq('data_coleta', latest.data_coleta)
        .order('score', { ascending: false })
      trendsByCategoria[categoria] = trendData ?? []
    } else {
      trendsByCategoria[categoria] = []
    }
  }

  return (
    <>
      <PageHeader
        title="Produtos em Alta"
        description="Produtos com maior potencial de venda para criadores de conteúdo, ordenados pelo score de tendência."
      />

      <Tabs defaultValue="meus-produtos">
        <TabsList>
          <TabsTrigger value="meus-produtos">Meus Produtos</TabsTrigger>
          <TabsTrigger value="tendencias">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="meus-produtos" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Card
                key={p.id}
                className="group relative overflow-hidden border-border bg-card transition-colors hover:border-primary/50"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-secondary/10 to-transparent" />
                <CardContent className="relative flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
                      {p.categoria}
                    </span>
                    <div className={`flex items-center gap-1 ${scoreColor(p.score_tendencia)}`}>
                      <Flame className="size-4" />
                      <span className="font-display text-lg font-bold">{p.score_tendencia}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-base font-semibold leading-tight text-balance">
                      {p.nome}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">Nicho: {p.nicho}</p>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    {p.plataforma && (
                      <span className="text-xs text-muted-foreground">{p.plataforma}</span>
                    )}
                    {p.link_afiliado && (
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="ml-auto gap-1.5 text-accent hover:text-accent"
                      >
                        <a href={p.link_afiliado} target="_blank" rel="noopener noreferrer">
                          Ver produto
                          <ExternalLink className="size-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {products.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum produto cadastrado ainda.</p>
          )}
        </TabsContent>

        <TabsContent value="tendencias" className="mt-4">
          <ProductTrendsClient trendsByCategoria={trendsByCategoria} />
        </TabsContent>
      </Tabs>
    </>
  )
}
