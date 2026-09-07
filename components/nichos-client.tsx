'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

interface NicheGuide {
  nicho: string
  nome_exibicao: string
  ritmo_corte: string
  trilha_sonora: string
  estilo_visual: string
  referencias: string
  dicas_extras: string
}

interface NicheTopic {
  id: string
  titulo: string
  fonte_url: string | null
  score: number
  ideias_video: string | null
}

export function NichosClient({
  guides,
  topicsByNicho,
}: {
  guides: NicheGuide[]
  topicsByNicho: Record<string, NicheTopic[]>
}) {
  const [ativo, setAtivo] = useState(guides[0]?.nicho ?? 'analog_horror')

  const guideAtivo = guides.find((g) => g.nicho === ativo)
  const topicosAtivos = topicsByNicho[ativo] ?? []

  function copiarIdeias(topic: NicheTopic) {
    navigator.clipboard.writeText(topic.ideias_video ?? '')
    toast.success('Ideias copiadas')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {guides.map((g) => (
          <Button
            key={g.nicho}
            variant={ativo === g.nicho ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAtivo(g.nicho)}
          >
            {g.nome_exibicao}
          </Button>
        ))}
      </div>

      {guideAtivo && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Guia de edição — {guideAtivo.nome_exibicao}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Ritmo de corte
              </p>
              <p className="text-sm">{guideAtivo.ritmo_corte}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Trilha sonora
              </p>
              <p className="text-sm">{guideAtivo.trilha_sonora}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Estilo visual
              </p>
              <p className="text-sm">{guideAtivo.estilo_visual}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Referências
              </p>
              <p className="text-sm">{guideAtivo.referencias}</p>
            </div>
            <div className="sm:col-span-2">
              <Separator className="my-1" />
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Dica extra
              </p>
              <p className="text-sm">{guideAtivo.dicas_extras}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          Temas da semana — {guideAtivo?.nome_exibicao}
        </h3>
        {topicosAtivos.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhum tema coletado ainda para este nicho. O script semanal roda
              toda segunda-feira.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topicosAtivos.map((topic) => (
              <Card key={topic.id} className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm leading-snug">{topic.titulo}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
                    {topic.ideias_video}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-fit gap-2"
                    onClick={() => copiarIdeias(topic)}
                  >
                    <Copy className="size-3.5" />
                    Copiar ideia
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
