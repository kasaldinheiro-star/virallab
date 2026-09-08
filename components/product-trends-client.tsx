'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, ShoppingCart } from 'lucide-react'

interface ProductTrend {
  id: string
  titulo: string
  fonte_url: string | null
  score: number
}

const CATEGORIA_LABEL: Record<string, string> = {
  tecnologia: 'Tecnologia',
  casa: 'Casa',
  cama_banho: 'Cama e Banho',
  fitness: 'Fitness',
  dia_a_dia: 'Dia a Dia',
}

function limparTermoBusca(titulo: string): string {
  // Remove nome de veículo/fonte que às vezes vem junto no título do Google News
  return titulo.split(' - ')[0].split(' | ')[0].trim()
}

function linkAmazon(termo: string) {
  return `https://www.amazon.com.br/s?k=${encodeURIComponent(termo)}`
}

function linkMercadoLivre(termo: string) {
  return `https://lista.mercadolivre.com.br/${encodeURIComponent(termo)}`
}

function linkShopee(termo: string) {
  return `https://shopee.com.br/search?keyword=${encodeURIComponent(termo)}`
}

export function ProductTrendsClient({
  trendsByCategoria,
}: {
  trendsByCategoria: Record<string, ProductTrend[]>
}) {
  const categorias = Object.keys(CATEGORIA_LABEL)
  const [ativa, setAtiva] = useState(categorias[0])

  const trends = trendsByCategoria[ativa] ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {categorias.map((cat) => (
          <Button
            key={cat}
            variant={ativa === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAtiva(cat)}
          >
            {CATEGORIA_LABEL[cat]}
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        As buscas abaixo abrem o próprio marketplace — confira o produto e,
        se fizer sentido, cadastre-se no programa de afiliados da plataforma
        antes de divulgar o link.
      </p>

      {trends.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma tendência recente para esta categoria. O script semanal
            roda toda segunda-feira.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trends.map((t) => {
            const termo = limparTermoBusca(t.titulo)
            return (
              <Card key={t.id} className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm leading-snug">{t.titulo}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <a href={linkAmazon(termo)} target="_blank" rel="noopener noreferrer">
                        <ShoppingCart className="size-3.5" />
                        Amazon
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <a href={linkMercadoLivre(termo)} target="_blank" rel="noopener noreferrer">
                        <ShoppingCart className="size-3.5" />
                        Mercado Livre
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <a href={linkShopee(termo)} target="_blank" rel="noopener noreferrer">
                        <ShoppingCart className="size-3.5" />
                        Shopee
                      </a>
                    </Button>
                  </div>
                  {t.fonte_url && (
                    <Button asChild size="sm" variant="ghost" className="w-fit gap-1.5 px-0">
                      <a href={t.fonte_url} target="_blank" rel="noopener noreferrer">
                        Ler notícia original
                        <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
