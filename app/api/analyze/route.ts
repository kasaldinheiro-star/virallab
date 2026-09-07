import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { processVideo } from '@/lib/ffmpeg'
import { matchPatterns } from '@/lib/patterns'
import { createClient } from '@/lib/supabase/server'
import type { Pattern } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_VIDEO_BYTES = 50 * 1024 * 1024 // 50MB

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  const transcript = String(form.get('transcript') ?? '').trim()
  const isOwnVideo = String(form.get('is_own_video') ?? 'false') === 'true'
  const video = form.get('video')

  if (!transcript && !(video instanceof File)) {
    return NextResponse.json(
      { error: 'Envie uma transcrição ou um vídeo para analisar.' },
      { status: 400 },
    )
  }

  // 1. Correspondência de padrões (JavaScript puro, sem IA)
  const { data: patterns, error: patternsError } = await supabase
    .from('patterns')
    .select('*')

  if (patternsError) {
    return NextResponse.json({ error: 'Falha ao carregar padrões.' }, { status: 500 })
  }

  const matched = matchPatterns(transcript, (patterns ?? []) as Pattern[])

  // 2. Processamento de vídeo com ffmpeg (opcional)
  let videoMetrics = null
  const frameUrls: string[] = []

  if (video instanceof File && video.size > 0) {
    if (video.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { error: 'Vídeo muito grande. Limite de 50MB.' },
        { status: 413 },
      )
    }

    try {
      const buffer = Buffer.from(await video.arrayBuffer())
      const { metrics, frames } = await processVideo(buffer)
      videoMetrics = metrics

      const analysisId = randomUUID()
      for (let i = 0; i < frames.length; i++) {
        const path = `${user.id}/${analysisId}/${String(i).padStart(4, '0')}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('frames')
          .upload(path, frames[i].buffer, {
            contentType: 'image/jpeg',
            upsert: true,
          })
        if (!uploadError) {
          const { data: pub } = supabase.storage.from('frames').getPublicUrl(path)
          frameUrls.push(pub.publicUrl)
        }
      }
    } catch (err) {
      console.log('[v0] Erro no processamento ffmpeg:', (err as Error).message)
      return NextResponse.json(
        { error: 'Não foi possível processar o vídeo. Verifique o formato (mp4).' },
        { status: 500 },
      )
    }
  }

  // 3. Persistência da análise
  const { data: saved, error: insertError } = await supabase
    .from('video_analyses')
    .insert({
      user_id: user.id,
      transcript,
      video_metrics_json: videoMetrics,
      matched_patterns_json: matched,
      frame_urls: frameUrls,
      is_own_video: isOwnVideo,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: 'Falha ao salvar a análise.' }, { status: 500 })
  }

  return NextResponse.json({ analysis: saved })
}
