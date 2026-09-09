import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import { NichosClient } from '@/components/nichos-client'
import { TriggerFetchButton } from '@/components/trigger-fetch-button'
export const dynamic = 'force-dynamic'

export default async function NichosPage() {
  const supabase = await createClient()

  const { data: guides } = await supabase.from('niche_guides').select('*')

  const { data: latestByNicho } = await supabase
    .from('niche_topics')
    .select('nicho, data_coleta')
    .order('data_coleta', { ascending: false })

  const topicsByNicho: Record<string, any[]> = {}

  for (const nicho of ['analog_horror', 'gta', 'entretenimento']) {
    const latest = latestByNicho?.find((t) => t.nicho === nicho)
    if (latest?.data_coleta) {
      const { data } = await supabase
        .from('niche_topics')
        .select('*')
        .eq('nicho', nicho)
        .eq('data_coleta', latest.data_coleta)
        .order('score', { ascending: false })
      topicsByNicho[nicho] = data ?? []
    } else {
      topicsByNicho[nicho] = []
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
        <PageHeader
          title="Nichos"
          description="Temas de vídeo e guia de edição por nicho, atualizados diariamente"
        />
        <TriggerFetchButton />
      </div>
      <NichosClient guides={guides ?? []} topicsByNicho={topicsByNicho} />
    </div>
  )
}
