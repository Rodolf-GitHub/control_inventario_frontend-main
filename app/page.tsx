'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Plus, Pencil, Trash2, StoreIcon, Check, X } from 'lucide-react';
import { Nav } from '@/components/layout/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { listarTiendas, crearTienda, actualizarTienda, eliminarTienda } from '@/lib/api/tiendas';
import { Tienda } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { toastSuccess, toastError } from '@/lib/toast-helper';

export default function TiendasPage() {
  const { data: tiendas, mutate } = useSWR<Tienda[]>('tiendas', listarTiendas);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNombre, setEditingNombre] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const { toast } = useToast();

  const handleEdit = (tienda: Tienda) => {
    setEditingId(tienda.id || null);
    setEditingNombre(tienda.nombre);
  };

  const handleSaveEdit = () => {
    if (!editingNombre.trim() || !editingId) return;
    actualizarTienda(editingId, { nombre: editingNombre })
      .then(() => mutate())
      .then(() => {
        setEditingId(null);
        setEditingNombre('');
        toastSuccess({ title: 'Tienda actualizada' });
      })
      .catch((error) => toastError(error));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingNombre('');
  };

  const handleCreate = () => {
    if (!newNombre.trim()) return;
    crearTienda({ nombre: newNombre })
      .then(() => mutate())
      .then(() => {
        setNewNombre('');
        setCreatingNew(false);
        toastSuccess({ title: 'Tienda creada' });
      })
      .catch((error) => toastError(error));
  };

  const handleDelete = async (id: number) => {
    try {
      await eliminarTienda(id);
      await mutate();
      toastSuccess({ title: 'Tienda eliminada' });
    } catch (error) {
      toastError(error as any);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Tiendas</h1>
          <Button size="sm" onClick={() => setCreatingNew(true)} title="Nueva Tienda">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {creatingNew && (
          <Card className="mb-4 border-primary">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <StoreIcon className="h-5 w-5 text-primary" />
                <Input
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Nombre de la tienda"
                  className="flex-1"
                  autoFocus
                />
                <Button size="icon" variant="default" onClick={handleCreate} title="Guardar">
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => setCreatingNew(false)} title="Cancelar">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {(tiendas || []).map((tienda) => (
            <Card key={tienda.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-4">
                {editingId === tienda.id ? (
                  <div className="flex items-center gap-2">
                    <StoreIcon className="h-5 w-5 text-primary" />
                    <Input
                      value={editingNombre}
                      onChange={(e) => setEditingNombre(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="icon" variant="default" onClick={handleSaveEdit} title="Guardar">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={handleCancelEdit} title="Cancelar">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StoreIcon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{tienda.nombre}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(tienda)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDialog
                        title="Eliminar tienda"
                        description={"¿Estás seguro que deseas eliminar esta tienda? Si la eliminas se eliminarán todos los proveedores, productos y compras asociadas a esta tienda."}
                        confirmLabel="Eliminar tienda"
                        onConfirm={() => tienda.id ? handleDelete(tienda.id) : undefined}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </ConfirmDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
