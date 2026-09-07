import { Check, X } from 'lucide-react'
import { CategoriaBadge } from '@/components/categoria-badge'
import { Card, CardContent } from '@/components/ui/card'
import { CATEGORIA_ORDER, type PatternCategoria } from '@/lib/types'

export interface ComparisonRow {
  nome_tecnica: string
  categoria: PatternCategoria
  present: boolean
}

export function ComparisonChecklist({ rows }: { rows: ComparisonRow[] }) {
  const missing = rows.filter((r) => !r.present)

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-border bg-card">
        <CardContent className="flex flex-wrap items-center gap-6 p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Técnicas dos virais
            </p>
            <p className="font-display text-3xl font-bold">{rows.length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Presentes no seu
            </p>
            <p className="font-display text-3xl font-bold text-accent">
              {rows.length - missing.length}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Faltando</p>
            <p className="font-display text-3xl font-bold text-primary">{missing.length}</p>
          </div>
        </CardContent>
      </Card>

      {CATEGORIA_ORDER.map((cat) => {
        const items = rows.filter((r) => r.categoria === cat)
        if (items.length === 0) return null
        return (
          <div key={cat}>
            <div className="mb-3">
              <CategoriaBadge categoria={cat} />
            </div>
            <div className="flex flex-col gap-2">
              {items.map((r) => (
                <div
                  key={r.nome_tecnica}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                >
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                      r.present
                        ? 'bg-accent/15 text-accent'
                        : 'bg-primary/15 text-primary'
                    }`}
                  >
                    {r.present ? <Check className="size-4" /> : <X className="size-4" />}
                  </span>
                  <span
                    className={`text-sm ${
                      r.present ? 'text-foreground' : 'font-medium text-foreground'
                    }`}
                  >
                    {r.nome_tecnica}
                  </span>
                  {!r.present && (
                    <span className="ml-auto text-xs font-medium text-primary">falta</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
