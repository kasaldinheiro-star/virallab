import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import type { TrendingTopic } from '@/lib/types'
import { TrendsClient } from '@/components/trends-client'

export default async function TrendsPage() {
  const supabase = await createClient()

  // Pega a data de coleta mais recente disponível
  const { data: latest } = await supabase
    .from('trending_topics')
    .select('data_coleta')
    .order('data_coleta', { ascending: false })
    .limit(1)
    .maybeSingle()

  let topics: TrendingTopic[] = []

  if (latest?.data_coleta) {
    const { data } = await supabase
      .from('trending_topics')
      .select('*')
      .eq('data_coleta', latest.data_coleta)
      .order('score', { ascending: false })

    topics = data ?? []
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Temas em Alta"
        description={
          latest?.data_coleta
            ? `Última coleta: ${new Date(latest.data_coleta).toLocaleDateString('pt-BR')}`
            : 'Nenhuma coleta ainda — o script semanal ainda não rodou.'
        }
      />
      <TrendsClient topics={topics} />
    </div>
  )
}
