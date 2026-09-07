'use client'

import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createProduct, deleteProduct, updateProduct } from '@/app/admin/products/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Product } from '@/lib/types'

export function AdminProductsClient({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [pending, startTransition] = useTransition()

  function openCreate() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setOpen(true)
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = editing
        ? await updateProduct(editing.id, formData)
        : await createProduct(formData)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(editing ? 'Produto atualizado.' : 'Produto criado.')
      setOpen(false)
      setEditing(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteProduct(id)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Produto excluído.')
    })
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate} className="gap-2 bg-cta text-cta-foreground hover:bg-cta/90">
          <Plus className="size-4" />
          Novo produto
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {products.map((p) => (
          <Card key={p.id} className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg neon-gradient font-display text-sm font-bold text-primary-foreground">
                {p.score_tendencia}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.nome}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.categoria} · {p.nicho} {p.plataforma ? `· ${p.plataforma}` : ''}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={pending}
                onClick={() => handleDelete(p.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {products.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum produto ainda. Crie o primeiro.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? 'Editar produto' : 'Novo produto'}
            </DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <Field name="nome" label="Nome" defaultValue={editing?.nome} required />
            <div className="grid grid-cols-2 gap-3">
              <Field
                name="categoria"
                label="Categoria"
                defaultValue={editing?.categoria}
                required
              />
              <Field name="nicho" label="Nicho" defaultValue={editing?.nicho} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                name="plataforma"
                label="Plataforma"
                defaultValue={editing?.plataforma ?? ''}
              />
              <Field
                name="score_tendencia"
                label="Score (0-100)"
                type="number"
                defaultValue={String(editing?.score_tendencia ?? 0)}
              />
            </div>
            <Field
              name="link_afiliado"
              label="Link de afiliado"
              type="url"
              defaultValue={editing?.link_afiliado ?? ''}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={pending}
                className="bg-cta text-cta-foreground hover:bg-cta/90"
              >
                {pending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Field({
  name,
  label,
  defaultValue,
  type = 'text',
  required,
}: {
  name: string
  label: string
  defaultValue?: string
  type?: string
  required?: boolean
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="bg-background/60"
        min={type === 'number' ? 0 : undefined}
        max={type === 'number' ? 100 : undefined}
      />
    </div>
  )
}
