import { CATEGORIA_LABEL, type PatternCategoria } from '@/lib/types'
import { cn } from '@/lib/utils'

const STYLES: Record<PatternCategoria, string> = {
  hook: 'bg-primary/15 text-primary border-primary/30',
  retencao: 'bg-secondary/15 text-secondary border-secondary/30',
  persuasao: 'bg-accent/15 text-accent border-accent/30',
  cta: 'bg-cta/15 text-cta border-cta/30',
}

export function CategoriaBadge({
  categoria,
  className,
}: {
  categoria: PatternCategoria
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        STYLES[categoria],
        className,
      )}
    >
      {CATEGORIA_LABEL[categoria]}
    </span>
  )
}
