'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2 } from 'lucide-react'

interface Technique {
  id: string
  nome: string
  categoria: 'ritmo' | 'visual' | 'audio' | 'storytelling'
  quando_usar: string
  como_fazer: string
}

interface ChecklistStep {
  passo: number
  titulo: string
  descricao: string
}

const CATEGORIA_LABEL: Record<string, string> = {
  ritmo: 'Ritmo',
  visual: 'Visual',
  audio: 'Áudio',
  storytelling: 'Storytelling',
}

const CATEGORIAS = ['ritmo', 'visual', 'audio', 'storytelling']

export function EdicaoClient({
  techniques,
  checklist,
}: {
  techniques: Technique[]
  checklist: ChecklistStep[]
}) {
  const [filtro, setFiltro] = useState<string | null>(null)

  const tecnicasFiltradas = filtro
    ? techniques.filter((t) => t.categoria === filtro)
    : techniques

  return (
    <Tabs defaultValue="tecnicas">
      <TabsList>
        <TabsTrigger value="tecnicas">Técnicas de Edição</TabsTrigger>
        <TabsTrigger value="checklist">Checklist de Canal</TabsTrigger>
      </TabsList>

      <TabsContent value="tecnicas" className="mt-4 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filtro === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltro(null)}
          >
            Todas
          </Button>
          {CATEGORIAS.map((cat) => (
            <Button
              key={cat}
              variant={filtro === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro(cat)}
            >
              {CATEGORIA_LABEL[cat]}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tecnicasFiltradas.map((t) => (
            <Card key={t.id} className="border-primary/20">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <CardTitle className="text-base leading-snug">{t.nome}</CardTitle>
                <Badge variant="outline" className="shrink-0">
                  {CATEGORIA_LABEL[t.categoria]}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Quando usar
                  </p>
                  <p className="text-sm">{t.quando_usar}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Como fazer
                  </p>
                  <p className="text-sm">{t.como_fazer}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="checklist" className="mt-4 flex flex-col gap-3">
        {checklist.map((step) => (
          <Card key={step.passo} className="border-primary/20">
            <CardContent className="flex items-start gap-3 py-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">
                  Passo {step.passo} — {step.titulo}
                </p>
                <p className="text-sm text-muted-foreground">{step.descricao}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  )
}
