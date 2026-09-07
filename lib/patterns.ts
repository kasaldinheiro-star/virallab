import { CATEGORIA_ORDER, type MatchedPattern, type Pattern } from './types'

/** Normaliza texto: minúsculas + remoção de acentos, para busca robusta. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Correspondência 100% em JavaScript (sem IA): para cada técnica, verifica se
 * alguma palavra-chave aparece como substring no texto (case + acento
 * insensitive). Retorna as técnicas encontradas ordenadas por categoria.
 */
export function matchPatterns(transcript: string, patterns: Pattern[]): MatchedPattern[] {
  const haystack = normalize(transcript)
  const matched: MatchedPattern[] = []

  for (const pattern of patterns) {
    const matched_keywords = pattern.palavras_chave.filter((kw) =>
      haystack.includes(normalize(kw)),
    )
    if (matched_keywords.length > 0) {
      matched.push({ ...pattern, matched_keywords })
    }
  }

  return matched.sort(
    (a, b) => CATEGORIA_ORDER.indexOf(a.categoria) - CATEGORIA_ORDER.indexOf(b.categoria),
  )
}

/** Agrupa técnicas por categoria preservando a ordem canônica. */
export function groupByCategoria<T extends { categoria: string }>(
  items: T[],
): Record<string, T[]> {
  const groups: Record<string, T[]> = {}
  for (const cat of CATEGORIA_ORDER) groups[cat] = []
  for (const item of items) {
    if (!groups[item.categoria]) groups[item.categoria] = []
    groups[item.categoria].push(item)
  }
  return groups
}
