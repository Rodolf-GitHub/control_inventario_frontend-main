'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Plus, Pencil, Trash2, Users, Check, X } from 'lucide-react';
import { Nav } from '@/components/layout/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Proveedor, Tienda } from '@/lib/types';
import { listarTiendas } from '@/lib/api/tiendas';
import { listarProveedores, crearProveedor, actualizarProveedor, eliminarProveedor } from '@/lib/api/proveedores';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { toastSuccess, toastError } from '@/lib/toast-helper';

export default function ProveedoresPage() {
  const { data: tiendas } = useSWR<Tienda[]>('tiendas', listarTiendas);
  const [selectedTienda, setSelectedTienda] = useState<number | null>(null);
  // set first tienda by default when tiendas load
  useEffect(() => {
    if (!selectedTienda && tiendas && tiendas.length > 0) {
      setSelectedTienda(tiendas[0].id ?? null);
    }
  }, [tiendas]);
  const { data: proveedores, mutate: mutateProveedores } = useSWR<Proveedor[] | null>(
    selectedTienda ? `proveedores-${selectedTienda}` : null,
    () => (selectedTienda ? listarProveedores(selectedTienda) : Promise.resolve([]))
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNombre, setEditingNombre] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const { toast } = useToast();

  const filteredProveedores = proveedores || [];

  const handleEdit = (proveedor: Proveedor) => {
    setEditingId(proveedor.id!);
    setEditingNombre(proveedor.nombre);
  };

  const handleSaveEdit = () => {
    if (!editingNombre.trim()) return;
    if (!editingId) return;
    actualizarProveedor(editingId, { nombre: editingNombre })
      .then(() => mutateProveedores())
      .then(() => {
        setEditingId(null);
        toastSuccess({ title: 'Proveedor actualizado' });
      })
      .catch((error) => toastError(error));
  };

  const handleCreate = () => {
    if (!newNombre.trim() || !selectedTienda) return;
    crearProveedor({ nombre: newNombre, tienda_id: selectedTienda })
      .then(() => mutateProveedores())
      .then(() => {
        setNewNombre('');
        setCreatingNew(false);
        toastSuccess({ title: 'Proveedor creado' });
      })
      .catch((error) => toastError(error));
  };

  const handleDelete = (id: number) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    eliminarProveedor(id)
      .then(() => mutateProveedores())
      .then(() => toastSuccess({ title: 'Proveedor eliminado' }))
      .catch((error) => toastError(error));
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold">Proveedores</h1>
          <Button size="sm" onClick={() => setCreatingNew(true)} disabled={!selectedTienda} title="Nuevo Proveedor">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Card className="mb-3 bg-blue-50">
          <CardContent className="py-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Tienda</label>
              <Select
                value={selectedTienda?.toString() || ''}
                onValueChange={(value) => setSelectedTienda(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tienda" />
                </SelectTrigger>
                <SelectContent>
                  {(tiendas || []).map((tienda) => (
                    <SelectItem key={tienda.id} value={tienda.id!.toString()}>
                      {tienda.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {creatingNew && (
          <Card className="mb-4 border-primary">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                <Input
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Nombre del proveedor"
                  className="flex-1"
                  autoFocus
                />
                <Button size="icon" onClick={handleCreate} title="Guardar">
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
          {filteredProveedores.map((proveedor) => (
            <Card key={proveedor.id}>
              <CardContent className="pt-4">
                {editingId === proveedor.id ? (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" />
                    <Input
                      value={editingNombre}
                      onChange={(e) => setEditingNombre(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="icon" onClick={handleSaveEdit} title="Guardar">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => setEditingId(null)} title="Cancelar">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-accent" />
                      <div>
                        <div className="font-medium">{proveedor.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {tiendas?.find(t => t.id === proveedor.tienda)?.nombre}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(proveedor)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => proveedor.id && handleDelete(proveedor.id)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
