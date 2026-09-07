'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !user.user_metadata?.is_admin) {
    throw new Error('Acesso restrito a administradores.')
  }
  return supabase
}

function parseForm(formData: FormData) {
  const score = Number(formData.get('score_tendencia'))
  return {
    nome: String(formData.get('nome') ?? '').trim(),
    categoria: String(formData.get('categoria') ?? '').trim(),
    nicho: String(formData.get('nicho') ?? '').trim(),
    link_afiliado: String(formData.get('link_afiliado') ?? '').trim() || null,
    plataforma: String(formData.get('plataforma') ?? '').trim() || null,
    score_tendencia: Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0,
  }
}

export async function createProduct(formData: FormData) {
  const supabase = await requireAdmin()
  const values = parseForm(formData)
  if (!values.nome || !values.categoria || !values.nicho) {
    return { error: 'Nome, categoria e nicho são obrigatórios.' }
  }
  const { error } = await supabase.from('products').insert(values)
  if (error) return { error: 'Falha ao criar produto.' }
  revalidatePath('/admin/products')
  revalidatePath('/produtos')
  return { success: true }
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await requireAdmin()
  const values = parseForm(formData)
  if (!values.nome || !values.categoria || !values.nicho) {
    return { error: 'Nome, categoria e nicho são obrigatórios.' }
  }
  const { error } = await supabase.from('products').update(values).eq('id', id)
  if (error) return { error: 'Falha ao atualizar produto.' }
  revalidatePath('/admin/products')
  revalidatePath('/produtos')
  return { success: true }
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return { error: 'Falha ao excluir produto.' }
  revalidatePath('/admin/products')
  revalidatePath('/produtos')
  return { success: true }
}
