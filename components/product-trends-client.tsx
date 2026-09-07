'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

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

      {trends.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma tendência coletada ainda para esta categoria. O script
            semanal roda toda segunda-feira.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trends.map((t) => (
            <Card key={t.id} className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm leading-snug">{t.titulo}</CardTitle>
              </CardHeader>
              {t.fonte_url && (
                <CardContent>
                  <Button asChild size="sm" variant="ghost" className="gap-1.5 px-0">
                    <a href={t.fonte_url} target="_blank" rel="noopener noreferrer">
                      Ver fonte
                      <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
