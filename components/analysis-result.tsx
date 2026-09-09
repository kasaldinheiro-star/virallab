'use client'

import { useState } from 'react'
import { Film, ImageIcon, Save, Scissors, Star, ThumbsDown, ThumbsUp, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { CategoriaBadge } from '@/components/categoria-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { groupByCategoria } from '@/lib/patterns'
import { CATEGORIA_LABEL, CATEGORIA_ORDER } from '@/lib/types'
import type { MatchedPattern, PatternCategoria, VideoMetrics } from '@/lib/types'

export function AnalysisResult({
  analysisId,
  matched,
  metrics,
  frameUrls,
  initialViews,
  initialCurtiu,
  initialFavorito,
  initialNotas,
}: {
  analysisId: string
  matched: MatchedPattern[]
  metrics: VideoMetrics | null
  frameUrls: string[]
  initialViews?: number | null
  initialCurtiu?: boolean | null
  initialFavorito?: boolean
  initialNotas?: string | null
}) {
  const grouped = groupByCategoria(matched)

  const [views, setViews] = useState(initialViews?.toString() ?? '')
  const [curtiu, setCurtiu] = useState<boolean | null>(initialCurtiu ?? null)
  const [favorito, setFavorito] = useState(initialFavorito ?? false)
  const [notas, setNotas] = useState(initialNotas ?? '')
  const [salvando, setSalvando] = useState(false)

  async function salvarResultado() {
    setSalvando(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('video_analyses')
      .update({
        views_24h: views ? Number(views) : null,
        curtiu,
        favorito,
        notas_resultado: notas || null,
      })
      .eq('id', analysisId)

    setSalvando(false)

    if (error) {
      toast.error('Não foi possível salvar o resultado.')
      return
    }
    toast.success('Resultado salvo!')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Coluna 1: técnicas por categoria */}
        <div className="lg:col-span-1">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Técnicas identificadas
          </h3>
          {matched.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="p-5 text-sm text-muted-foreground">
                Nenhuma técnica reconhecida no texto. Tente colar mais da transcrição.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {CATEGORIA_ORDER.map((cat) => {
                const items = grouped[cat] ?? []
                if (items.length === 0) return null
                return (
                  <div key={cat}>
                    <div className="mb-2">
                      <CategoriaBadge categoria={cat as PatternCategoria} />
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map((m) => (
                        <Card key={m.id} className="border-border bg-card">
                          <CardContent className="p-4">
                            <p className="font-display text-sm font-semibold">{m.nome_tecnica}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{m.descricao}</p>
                            <p className="mt-2 text-xs text-accent">{m.motivo_funciona}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {m.matched_keywords.map((kw) => (
                                <span
                                  key={kw}
                                  className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Coluna 2: métricas de edição */}
        <div className="lg:col-span-1">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Métricas de edição
          </h3>
          {metrics ? (
            <div className="flex flex-col gap-3">
              <MetricCard
                icon={Scissors}
                label="Total de cortes"
                value={String(metrics.total_cortes)}
                accent="text-primary"
              />
              <MetricCard
                icon={Timer}
                label="Duração média de cena"
                value={`${metrics.duracao_media_cena}s`}
                accent="text-secondary"
              />
              <MetricCard
                icon={Film}
                label="Duração total"
                value={`${metrics.duracao_total}s`}
                accent="text-accent"
              />
            </div>
          ) : (
            <Card className="border-border bg-card">
              <CardContent className="p-5 text-sm text-muted-foreground">
                Envie um vídeo (.mp4) para extrair métricas de edição com ffmpeg.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna 3: galeria de frames */}
        <div className="lg:col-span-1">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Frames-chave
          </h3>
          {frameUrls.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {frameUrls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url || '/placeholder.svg'}
                  alt={`Frame ${i + 1} da cena detectada`}
                  className="aspect-video w-full rounded-lg border border-border object-cover"
                />
              ))}
            </div>
          ) : (
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
                <ImageIcon className="size-6" />
                Os frames extraídos de cada cena aparecerão aqui.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Registro de resultado pós-publicação */}
      <Card className="border-primary/20 bg-card">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Registrar resultado (depois de postar)
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setFavorito(!favorito)}
              title="Favoritar esta análise"
            >
              <Star className={`size-5 ${favorito ? 'fill-cta text-cta' : 'text-muted-foreground'}`} />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="views">Visualizações em 24h</Label>
              <Input
                id="views"
                type="number"
                min={0}
                value={views}
                onChange={(e) => setViews(e.target.value)}
                placeholder="Ex: 1500"
                className="bg-background/60"
              />
            </div>

            <div className="grid gap-2">
              <Label>Prendeu a audiência?</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={curtiu === true ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setCurtiu(curtiu === true ? null : true)}
                >
                  <ThumbsUp className="size-4" />
                  Sim
                </Button>
                <Button
                  type="button"
                  variant={curtiu === false ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setCurtiu(curtiu === false ? null : false)}
                >
                  <ThumbsDown className="size-4" />
                  Não
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notas">Notas (o que funcionou ou não)</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ex: o gancho prendeu bem, mas perdi audiência no meio..."
              className="min-h-20 resize-y bg-background/60"
            />
          </div>

          <Button
            type="button"
            onClick={salvarResultado}
            disabled={salvando}
            className="w-fit gap-2"
          >
            <Save className="size-4" />
            {salvando ? 'Salvando...' : 'Salvar resultado'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Scissors
  label: string
  value: string
  accent: string
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex items-center gap-4 p-5">
        <Icon className={`size-6 ${accent}`} />
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
