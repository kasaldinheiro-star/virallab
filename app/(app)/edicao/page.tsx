import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import { EdicaoClient } from '@/components/edicao-client'

export default async function EdicaoPage() {
  const supabase = await createClient()

  const { data: techniques } = await supabase
    .from('editing_techniques')
    .select('*')
    .order('categoria')

  const { data: checklist } = await supabase
    .from('growth_checklist')
    .select('*')
    .order('passo')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edição"
        description="Técnicas de edição e checklist de canal, prontos para consultar"
      />
      <EdicaoClient techniques={techniques ?? []} checklist={checklist ?? []} />
    </div>
  )
}
