'use client'

import { Loader2, Upload, Wand2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { AnalysisResult } from '@/components/analysis-result'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import type { MatchedPattern, VideoAnalysis } from '@/lib/types'

export function AnalyzeForm({ isOwnVideo = false }: { isOwnVideo?: boolean }) {
  const router = useRouter()
  const [transcript, setTranscript] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [result, setResult] = useState<VideoAnalysis | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!transcript.trim() && !file) {
      toast.error('Cole uma transcrição ou envie um vídeo.')
      return
    }
    setLoading(true)
    setResult(null)

    try {
      let videoPath: string | null = null

      if (file) {
        setStatusMsg('Enviando vídeo...')
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          toast.error('Sessão expirada. Faça login novamente.')
          return
        }

        const ext = file.name.split('.').pop() || 'mp4'
        videoPath = `${user.id}/${crypto.randomUUID()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('videos-temp')
          .upload(videoPath, file, { contentType: file.type || 'video/mp4' })

        if (uploadError) {
          toast.error('Falha ao enviar o vídeo. Tente um arquivo menor.')
          return
        }
      }

      setStatusMsg('Analisando...')
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          is_own_video: isOwnVideo,
          video_path: videoPath,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Falha na análise.')
        return
      }
      setResult(data.analysis)
      toast.success('Análise concluída!')
      router.refresh()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setLoading(false)
      setStatusMsg('')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Card className="glow-primary border-border bg-card">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="transcript">Transcrição / roteiro do vídeo</Label>
              <Textarea
                id="transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Cole aqui a transcrição ou o roteiro do vídeo..."
                className="min-h-40 resize-y bg-background/60"
              />
            </div>

            <div className="grid gap-2">
              <Label>Vídeo (.mp4) — opcional</Label>
              <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-4 py-3">
                  <span className="truncate text-sm">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFile(null)
                      if (inputRef.current) inputRef.current.value = ''
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-input bg-background/40 px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-secondary/60 hover:text-foreground"
                >
                  <Upload className="size-5" />
                  Clique para enviar um vídeo (até 50MB)
                  <span className="text-xs">Processado com ffmpeg para detectar cenas e cortes</span>
                </button>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-fit gap-2 bg-cta text-cta-foreground hover:bg-cta/90"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {statusMsg || 'Analisando...'}
                </>
              ) : (
                <>
                  <Wand2 className="size-4" />
                  Analisar storytelling
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <AnalysisResult
          analysisId={result.id}
          matched={(result.matched_patterns_json ?? []) as MatchedPattern[]}
          metrics={result.video_metrics_json}
          frameUrls={result.frame_urls ?? []}
          initialViews={result.views_24h}
          initialCurtiu={result.curtiu}
          initialFavorito={result.favorito}
          initialNotas={result.notas_resultado}
        />
      )}
    </div>
  )
}
