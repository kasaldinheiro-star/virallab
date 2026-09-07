import { BarChart3, Package, Sparkles, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { matchPatterns } from '@/lib/patterns'
import { createClient } from '@/lib/supabase/server'
import type { MatchedPattern, Pattern, Product, TrendingTopic, VideoAnalysis } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [analysesRes, productsRes, topicsRes] = await Promise.all([
    supabase
      .from('video_analyses')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase.from('products').select('*').order('score_tendencia', { ascending: false }).limit(1),
    supabase
      .from('trending_topics')
      .select('*')
      .order('data_coleta', { ascending: false })
      .order('score', { ascending: false })
      .limit(1),
  ])

  const analyses = (analysesRes.data ?? []) as VideoAnalysis[]
  const topProduct = (productsRes.data?.[0] ?? null) as Product | null
  const topTopic = (topicsRes.data?.[0] ?? null) as TrendingTopic | null

  // Técnica mais recorrente entre todas as análises do usuário.
  const counter = new Map<string, number>()
  for (const a of analyses) {
    for (const m of (a.matched_patterns_json ?? []) as MatchedPattern[]) {
      counter.set(m.nome_tecnica, (counter.get(m.nome_tecnica) ?? 0) + 1)
    }
  }
  const topTecnica = [...counter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  const stats = [
    {
      label: 'Análises feitas',
      value: String(analyses.length),
      icon: BarChart3,
      accent: 'text-primary',
      glow: 'from-primary/20',
    },
    {
      label: 'Técnica mais recorrente',
      value: topTecnica,
      icon: Sparkles,
      accent: 'text-secondary',
      glow: 'from-secondary/20',
    },
    {
      label: 'Produto em maior alta',
      value: topProduct?.nome ?? '—',
      icon: Package,
      accent: 'text-accent',
      glow: 'from-accent/20',
    },
    {
      label: 'Tema mais buscado',
      value: topTopic?.tema ?? '—',
      icon: TrendingUp,
      accent: 'text-cta',
      glow: 'from-cta/20',
    },
  ]

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Seu resumo de engenharia reversa: o que você já analisou e o que está em alta agora."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="relative overflow-hidden border-border bg-card">
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${s.glow} to-transparent opacity-60`}
              />
              <CardContent className="relative flex flex-col gap-3 p-5">
                <Icon className={`size-5 ${s.accent}`} />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-1 line-clamp-2 font-display text-lg font-bold leading-tight text-balance">
                    {s.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link href="/analisador">
          <Card className="group h-full border-border bg-card transition-colors hover:border-primary/50">
            <CardContent className="flex flex-col gap-2 p-6">
              <Sparkles className="size-6 text-primary" />
              <h3 className="font-display text-lg font-semibold">Analisar um viral</h3>
              <p className="text-sm text-muted-foreground">
                Cole a transcrição ou envie o vídeo e descubra as técnicas de storytelling usadas.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/meus-videos">
          <Card className="group h-full border-border bg-card transition-colors hover:border-secondary/50">
            <CardContent className="flex flex-col gap-2 p-6">
              <BarChart3 className="size-6 text-secondary" />
              <h3 className="font-display text-lg font-semibold">Comparar meu vídeo</h3>
              <p className="text-sm text-muted-foreground">
                Veja quais técnicas dos virais estão faltando no seu próprio conteúdo.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {analyses.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold">Análises recentes</h2>
          <div className="flex flex-col gap-2">
            {analyses.slice(0, 5).map((a) => (
              <Card key={a.id} className="border-border bg-card">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {a.transcript || '(sem transcrição)'}
                  </p>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    <span>{(a.matched_patterns_json ?? []).length} técnicas</span>
                    {a.is_own_video && (
                      <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-secondary">
                        meu vídeo
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
