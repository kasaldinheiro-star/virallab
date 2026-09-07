import { execFile } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffprobeInstaller from '@ffprobe-installer/ffprobe'
import type { VideoMetrics } from './types'

const run = promisify(execFile)

export interface FrameFile {
  name: string
  buffer: Buffer
}

export interface VideoProcessResult {
  metrics: VideoMetrics
  frames: FrameFile[]
}

/** Duração total do vídeo (segundos) via ffprobe. */
async function probeDuration(inputPath: string): Promise<number> {
  const { stdout } = await run(ffprobeInstaller.path, [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    inputPath,
  ])
  const value = Number.parseFloat(stdout.trim())
  return Number.isFinite(value) ? value : 0
}

/**
 * Processa um vídeo APENAS com ffmpeg (sem IA):
 * - detecta mudanças de cena via filtro `select='gt(scene,threshold)'`
 * - extrai um frame por cena detectada
 * - conta cortes e calcula a duração média de cada cena
 */
export async function processVideo(input: Buffer, threshold = 0.3): Promise<VideoProcessResult> {
  const workDir = await mkdtemp(join(tmpdir(), 'virallab-'))
  const inputPath = join(workDir, 'input')
  const framePattern = join(workDir, 'frame_%04d.jpg')

  try {
    await writeFile(inputPath, input)

    const duracao_total = await probeDuration(inputPath)

    // showinfo escreve no stderr uma linha por frame selecionado (cena nova).
    const { stderr } = await run(
      ffmpegInstaller.path,
      [
        '-i',
        inputPath,
        '-vf',
        `select='gt(scene,${threshold})',showinfo`,
        '-vsync',
        'vfr',
        '-frames:v',
        '24',
        '-q:v',
        '3',
        framePattern,
      ],
      { maxBuffer: 32 * 1024 * 1024 },
    )

    const sceneTimestamps = [...stderr.matchAll(/pts_time:([0-9.]+)/g)].map((m) =>
      Number.parseFloat(m[1]),
    )

    // Lê os frames extraídos do diretório temporário.
    const files = (await readdir(workDir))
      .filter((f) => f.startsWith('frame_') && f.endsWith('.jpg'))
      .sort()

    let frames: FrameFile[] = []
    for (const name of files) {
      frames.push({ name, buffer: await readFile(join(workDir, name)) })
    }

    // Fallback: nenhum corte detectado -> extrai o frame inicial.
    if (frames.length === 0) {
      const singlePath = join(workDir, 'frame_0001.jpg')
      await run(ffmpegInstaller.path, [
        '-i',
        inputPath,
        '-vf',
        'select=eq(n\\,0)',
        '-frames:v',
        '1',
        '-q:v',
        '3',
        singlePath,
      ])
      frames = [{ name: 'frame_0001.jpg', buffer: await readFile(singlePath) }]
    }

    const total_cortes = sceneTimestamps.length
    // Número de cenas = cortes + 1 segmento inicial.
    const segmentos = total_cortes + 1
    const duracao_media_cena = duracao_total > 0 ? duracao_total / segmentos : 0

    return {
      metrics: {
        total_cortes,
        duracao_media_cena: Number(duracao_media_cena.toFixed(2)),
        duracao_total: Number(duracao_total.toFixed(2)),
      },
      frames,
    }
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}
