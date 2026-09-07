import { AnalyzeForm } from '@/components/analyze-form'
import { ComparisonChecklist, type ComparisonRow } from '@/components/comparison-checklist'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/server'
import type { MatchedPattern, Pattern, PatternCategoria, VideoAnalysis } from '@/lib/types'

export default async function MeusVideosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [ownRes, viralRes, patternsRes] = await Promise.all([
    supabase
      .from('video_analyses')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_own_video', true)
      .order('created_at', { ascending: false }),
    supabase.from('video_analyses').select('matched_patterns_json').eq('is_own_video', false),
    supabase.from('patterns').select('*'),
  ])

  const ownAnalyses = (ownRes.data ?? []) as VideoAnalysis[]
  const patterns = (patternsRes.data ?? []) as Pattern[]

  // Técnicas presentes em QUALQUER vídeo viral analisado (is_own_video = false).
  const viralTecnicas = new Set<string>()
  for (const row of viralRes.data ?? []) {
    for (const m of (row.matched_patterns_json ?? []) as MatchedPattern[]) {
      viralTecnicas.add(m.nome_tecnica)
    }
  }

  // Técnicas presentes no vídeo mais recente do usuário.
  const latestOwn = ownAnalyses[0]
  const ownTecnicas = new Set(
    ((latestOwn?.matched_patterns_json ?? []) as MatchedPattern[]).map((m) => m.nome_tecnica),
  )

  // Comparação: para cada técnica presente nos virais, ela está no meu vídeo?
  const rows: ComparisonRow[] = patterns
    .filter((p) => viralTecnicas.has(p.nome_tecnica))
    .map((p) => ({
      nome_tecnica: p.nome_tecnica,
      categoria: p.categoria as PatternCategoria,
      present: ownTecnicas.has(p.nome_tecnica),
    }))

  return (
    <>
      <PageHeader
        title="Meus Vídeos"
        description="Analise o seu próprio conteúdo com o mesmo pipeline e compare com as técnicas presentes nos vídeos virais que você já analisou."
      />

      <Tabs defaultValue="analisar">
        <TabsList className="mb-6">
          <TabsTrigger value="analisar">Analisar meu vídeo</TabsTrigger>
          <TabsTrigger value="comparar">Comparação ({rows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="analisar">
          <AnalyzeForm isOwnVideo />
        </TabsContent>

        <TabsContent value="comparar">
          {viralTecnicas.size === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Você ainda não analisou vídeos virais. Vá até o{' '}
                <span className="text-accent">Analisador</span> e analise alguns vídeos de
                referência primeiro — eles formam a base de comparação.
              </CardContent>
            </Card>
          ) : ownAnalyses.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Analise o seu próprio vídeo na aba ao lado para ver o checklist do que está
                faltando.
              </CardContent>
            </Card>
          ) : (
            <ComparisonChecklist rows={rows} />
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
