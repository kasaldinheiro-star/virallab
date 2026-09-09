'use client'

import { useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function TriggerFetchButton() {
  const [loading, setLoading] = useState(false)

  async function disparar() {
    setLoading(true)
    try {
      const res = await fetch('/api/trigger-fetch', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Falha ao disparar busca.')
        return
      }
      toast.success('Busca disparada! Os dados novos chegam em 1-2 minutos.')
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={disparar} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      {loading ? 'Disparando...' : 'Atualizar agora'}
    </Button>
  )
}
