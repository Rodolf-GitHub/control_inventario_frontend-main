"use client"

import * as React from 'react'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog'
import { Button } from './button'

type ConfirmDialogProps = {
  title?: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => Promise<void> | void
  children: React.ReactNode // trigger element
}

export function ConfirmDialog({ title = 'Confirmar', description, confirmLabel = 'Eliminar', cancelLabel = 'Cancelar', onConfirm, children }: ConfirmDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await onConfirm()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && (
          <div className="mt-2">
            <DialogDescription>{description}</DialogDescription>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>{cancelLabel}</Button>
          <Button className="ml-2" variant="destructive" onClick={handleConfirm} disabled={loading}>{loading ? 'Eliminando...' : confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmDialog
