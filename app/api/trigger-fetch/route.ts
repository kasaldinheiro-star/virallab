import { NextResponse } from 'next/server'

export async function POST() {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!token || !owner || !repo) {
    return NextResponse.json(
      { error: 'Variáveis do GitHub não configuradas no servidor.' },
      { status: 500 },
    )
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/weekly-trends.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    },
  )

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json(
      { error: `Falha ao disparar workflow: ${res.status} ${text}` },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
