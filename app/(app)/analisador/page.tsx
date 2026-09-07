import { AnalyzeForm } from '@/components/analyze-form'
import { PageHeader } from '@/components/page-header'

export default function AnalisadorPage() {
  return (
    <>
      <PageHeader
        title="Analisador de Storytelling"
        description="Cole a transcrição de um vídeo viral e, opcionalmente, envie o arquivo .mp4. Identificamos as técnicas de storytelling por correspondência de palavras-chave e extraímos métricas de edição com ffmpeg — sem nenhuma IA paga."
      />
      <AnalyzeForm />
    </>
  )
}
