'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Plus, Pencil, Trash2, Package, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Nav } from '@/components/layout/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Producto, Tienda, Proveedor } from '@/lib/types';
import { listarTiendas } from '@/lib/api/tiendas';
import { listarProveedores } from '@/lib/api/proveedores';
import { listarProductos, crearProducto, actualizarProducto, eliminarProducto, moverProducto } from '@/lib/api/productos';
import { Toaster } from '@/components/ui/toaster';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { toastSuccess, toastError } from '@/lib/toast-helper';

export default function ProductosPage() {
  const { data: tiendas } = useSWR<Tienda[]>('tiendas', listarTiendas);
  const [selectedTienda, setSelectedTienda] = useState<number | null>(null);
  // set first tienda by default when tiendas load
  useEffect(() => {
    if (!selectedTienda && tiendas && tiendas.length > 0) {
      setSelectedTienda(tiendas[0].id ?? null);
    }
  }, [tiendas]);
  const { data: proveedores } = useSWR<Proveedor[] | null>(
    selectedTienda ? `proveedores-${selectedTienda}` : null,
    () => (selectedTienda ? listarProveedores(selectedTienda) : Promise.resolve([]))
  );

  const [selectedProveedor, setSelectedProveedor] = useState<number | null>(null);
  // set first proveedor by default when proveedores load
  useEffect(() => {
    if ((selectedProveedor === null || selectedProveedor === undefined) && proveedores && proveedores.length > 0) {
      setSelectedProveedor(proveedores[0].id ?? null);
    }
  }, [proveedores]);
  const { data: productos, mutate: mutateProductos } = useSWR<Producto[] | null>(
    selectedProveedor ? `productos-${selectedProveedor}` : null,
    () => (selectedProveedor ? listarProductos(selectedProveedor) : Promise.resolve([]))
  );
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNombre, setEditingNombre] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  

  const filteredProveedores = proveedores || [];
  const filteredProductos = productos || [];

  const displayedProductos = filteredProductos;

  const handleEdit = (producto: Producto) => {
    setEditingId(producto.id!);
    setEditingNombre(producto.nombre);
  };

  const handleSaveEdit = () => {
    if (!editingNombre.trim()) return;
    if (!editingId) return;
    actualizarProducto(editingId, { nombre: editingNombre })
      .then(() => mutateProductos())
      .then(() => {
        setEditingId(null);
        toastSuccess({ title: 'Producto actualizado' });
      })
      .catch((error) => toastError(error));
  };

  const handleCreate = () => {
    if (!newNombre.trim() || !selectedProveedor) return;
    crearProducto({ nombre: newNombre, proveedor_id: selectedProveedor })
      .then(() => mutateProductos())
      .then(() => {
        setNewNombre('');
        setCreatingNew(false);
        toastSuccess({ title: 'Producto creado' });
      })
      .catch((error) => toastError(error));
  };

  const handleDelete = async (id: number) => {
    try {
      await eliminarProducto(id);
      await mutateProductos();
      toastSuccess({ title: 'Producto eliminado' });
    } catch (error) {
      toastError(error as any);
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const producto = displayedProductos[index];
    if (!producto || !producto.id) return;
    try {
      await moverProducto(producto.id, direction === 'up' ? 'arriba' : 'abajo');
      await mutateProductos();
      toastSuccess({ title: 'Producto movido' });
    } catch (err) {
      toastError(err as any);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold">Productos</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setCreatingNew(true)} disabled={!selectedProveedor} title="Nuevo Producto">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="mb-3 bg-blue-50">
          <CardContent className="py-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Tienda</label>
                <Select
                  value={selectedTienda?.toString() || ''}
                  onValueChange={(value) => {
                    setSelectedTienda(parseInt(value));
                    setSelectedProveedor(null);
                  }}
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
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Proveedor</label>
                <Select
                  value={selectedProveedor?.toString() || ''}
                  onValueChange={(value) => setSelectedProveedor(parseInt(value))}
                  disabled={!selectedTienda}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProveedores.map((proveedor) => (
                      <SelectItem key={proveedor.id} value={proveedor.id!.toString()}>
                        {proveedor.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {creatingNew && (
          <Card className="mb-4 border-primary">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-chart-3" />
                <Input
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Nombre del producto"
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
          {displayedProductos.map((producto, idx) => (
            <Card key={producto.id}>
              <CardContent className="pt-4">
                {editingId === producto.id ? (
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-chart-3" />
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
                      <Package className="h-5 w-5 text-chart-3" />
                      <div>
                        <div className="font-medium">{producto.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {proveedores?.find(p => p.id === producto.proveedor)?.nombre}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 items-center">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(producto)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDialog
                        title="Eliminar producto"
                        description={"¿Estás seguro que deseas eliminar este producto? Este producto se eliminará de las compras en las que esté asociado."}
                        confirmLabel="Eliminar producto"
                        onConfirm={() => producto.id ? handleDelete(producto.id) : undefined}
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
                      <Button size="icon" variant="ghost" onClick={() => moveItem(idx, 'up')} title="Subir">
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => moveItem(idx, 'down')} title="Bajar">
                        <ArrowDown className="h-4 w-4" />
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
