export type PatternCategoria = 'hook' | 'retencao' | 'persuasao' | 'cta'

export const CATEGORIA_LABEL: Record<PatternCategoria, string> = {
  hook: 'Hook',
  retencao: 'Retenção',
  persuasao: 'Persuasão',
  cta: 'CTA',
}

export const CATEGORIA_ORDER: PatternCategoria[] = ['hook', 'retencao', 'persuasao', 'cta']

export interface Pattern {
  id: string
  nome_tecnica: string
  categoria: PatternCategoria
  palavras_chave: string[]
  descricao: string
  motivo_funciona: string
}

export interface MatchedPattern extends Pattern {
  matched_keywords: string[]
}

export interface VideoMetrics {
  total_cortes: number
  duracao_media_cena: number
  duracao_total: number
}

export interface VideoAnalysis {
  id: string
  user_id: string
  transcript: string
  video_metrics_json: VideoMetrics | null
  matched_patterns_json: MatchedPattern[] | null
  frame_urls: string[]
  is_own_video: boolean
  created_at: string
}

export interface Product {
  id: string
  nome: string
  categoria: string
  nicho: string
  link_afiliado: string | null
  plataforma: string | null
  score_tendencia: number
  created_at: string
}

export interface TrendingTopic {
  id: string
  tema: string
  categoria: string | null
  regiao: string
  score: number
  data_coleta: string
  ideias_video: string | null
}
