'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { TrendingTopic } from '@/lib/types'

export function TrendsClient({ topics }: { topics: TrendingTopic[] }) {
  if (topics.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Nenhum tema coletado ainda. O script semanal roda toda segunda-feira
          às 9h — ou rode manualmente pelo GitHub Actions.
        </CardContent>
      </Card>
    )
  }

  function copiarIdeias(topic: TrendingTopic) {
    navigator.clipboard.writeText(topic.ideias_video ?? '')
    toast.success(`Ideias de "${topic.tema}" copiadas`)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => (
        <Card key={topic.id} className="border-primary/20">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">{topic.tema}</CardTitle>
            <Badge variant="secondary" className="shrink-0">
              {Math.round(topic.score)}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {topic.categoria && (
              <Badge variant="outline" className="w-fit">
                {topic.categoria}
              </Badge>
            )}
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
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
  )
}
