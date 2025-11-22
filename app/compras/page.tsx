"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import useSWR from 'swr';
import { Plus, Trash2, ShoppingCart, Calendar, Edit2, Pencil, Package, Check, X, RefreshCw, Download } from 'lucide-react';
import { Nav } from '@/components/layout/nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { listarTiendas } from '@/lib/api/tiendas';
import { listarProveedores } from '@/lib/api/proveedores';
import { listarProductos } from '@/lib/api/productos';
import { comprasPorRango, crearCompra, eliminarCompra, editarDetalle, crearDetalle, eliminarDetalle } from '@/lib/api/compras';
import { Compra, Tienda, Proveedor, DetalleCompra } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { toastSuccess, toastError } from '@/lib/toast-helper';

export default function ComprasPage() {
  const { data: tiendas } = useSWR<Tienda[]>('tiendas', listarTiendas);
  const [selectedTienda, setSelectedTienda] = useState<number | null>(null);
  const [selectedProveedor, setSelectedProveedor] = useState<number | null>(null);
  
  // Auto-select primera tienda cuando carga
  useEffect(() => {
    if (!selectedTienda && tiendas && tiendas.length > 0) {
      setSelectedTienda(tiendas[0].id ?? null);
    }
  }, [tiendas]);
  
  const { data: proveedores } = useSWR(
    selectedTienda ? `proveedores-${selectedTienda}` : null,
    () => selectedTienda ? listarProveedores(selectedTienda) : null
  );

  // default select first proveedor when proveedores load (if none selected)
  useEffect(() => {
    if ((selectedProveedor === null || selectedProveedor === undefined) && proveedores && proveedores.length > 0) {
      setSelectedProveedor(proveedores[0].id ?? null);
    }
  }, [proveedores]);

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [limit, setLimit] = useState(3);

  // sanitize limit (avoid passing NaN) and only fetch when a proveedor is selected
  const safeLimit = Number.isFinite(limit) ? limit : undefined;
  const shouldFetchCompras = selectedProveedor != null;

  const { data: compras, mutate, isLoading } = useSWR(
    // Only fetch when proveedor is selected; otherwise skip request
    shouldFetchCompras ? ['compras', selectedTienda, selectedProveedor, fechaInicio, fechaFin, safeLimit] : null,
    () => comprasPorRango(fechaInicio || undefined, fechaFin || undefined, safeLimit, selectedTienda ?? undefined, selectedProveedor ?? undefined),
    { refreshInterval: 0 }
  );

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [editingDetalle, setEditingDetalle] = useState<DetalleCompra | null>(null);
  
  const [proveedorId, setProveedorId] = useState<string>('');
  const [fechaCompra, setFechaCompra] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [inventarioAnterior, setInventarioAnterior] = useState('');
  const { toast } = useToast();
  const [inventario, setInventario] = useState<any[]>([]);
  const skipRebuildRef = useRef(false);
  const { user } = useAuth();
  const canViewInventory = !!(user?.es_superusuario || (user?.permisos || []).some((p: any) => p?.puede_ver_inventario_compras));
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [colsCompras, setColsCompras] = useState<Compra[]>([]);
  // Detail dialog states (operate on compra detalles)
  const [selectedCompraForDetailDelete, setSelectedCompraForDetailDelete] = useState<number | null>(null);
  const [selectedDetalleToDelete, setSelectedDetalleToDelete] = useState<number | null>(null);

  const [selectedCompraForDetailAdd, setSelectedCompraForDetailAdd] = useState<number | null>(null);
  const [selectedProductoToAdd, setSelectedProductoToAdd] = useState<number | null>(null);
  const [addCantidad, setAddCantidad] = useState<number>(0);
  const [addInventarioAnterior, setAddInventarioAnterior] = useState<number>(0);
  // Product management dialog states (operate on compra detalles)
  const [openDeleteProductDialog, setOpenDeleteProductDialog] = useState(false);
  const [openAddProductDialog, setOpenAddProductDialog] = useState(false);
  const [selectedProveedorForProduct, setSelectedProveedorForProduct] = useState<number | null>(null);
  const { data: productosForDialog } = useSWR(
    selectedProveedorForProduct ? `productos-${selectedProveedorForProduct}` : null,
    () => (selectedProveedorForProduct ? listarProductos(selectedProveedorForProduct) : Promise.resolve([]))
  );
  const handleCreateCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crearCompra({
        proveedor_id: parseInt(proveedorId),
        fecha_compra: fechaCompra,
      });
      toastSuccess({
        title: 'Compra creada',
        description: 'La compra se creó correctamente con detalles en cero',
      });
      mutate();
      setOpenCreateDialog(false);
      setProveedorId('');
      setFechaCompra('');
      // No resetear selectedTienda ni selectedProveedor para mantener los filtros
    } catch (error) {
      toastError(error);
    }
  };

  const handleEditDetalle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDetalle?.id) return;
    
    try {
      await editarDetalle(editingDetalle.id, {
        cantidad: parseInt(cantidad),
        inventario_anterior: parseInt(inventarioAnterior),
      });
      toastSuccess({
        title: 'Detalle actualizado',
        description: 'El detalle se actualizó correctamente',
      });
      mutate();
      setOpenEditDialog(false);
      setEditingDetalle(null);
      setCantidad('');
      setInventarioAnterior('');
    } catch (error) {
      toastError(error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await eliminarCompra(id);
      mutate();
      toastSuccess({
        title: 'Compra eliminada',
        description: 'La compra se eliminó correctamente',
      });
    } catch (error) {
      toastError(error);
    }
  };
  const openDetalleEdit = (detalle: DetalleCompra) => {
    setEditingDetalle(detalle);
    setCantidad(detalle.cantidad.toString());
    setInventarioAnterior(detalle.inventario_anterior.toString());
    setOpenEditDialog(true);
  };

  const getProveedorNombre = (proveedorId: number) => {
    const allProveedores = proveedores || [];
    return allProveedores.find((p) => p.id === proveedorId)?.nombre || 'Desconocido';
  };

  const handleFilter = () => {
    mutate();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    // Extract date portion directly from backend string to avoid timezone shifts
    // Supports formats like "2024-11-08" or "2024-11-08T00:00:00"
    const datePart = dateString.split('T')[0]; // Get "2024-11-08"
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}`;
  };

  // Build inventory table from compras (use up to 3 latest compras)
  useEffect(() => {
    if (!compras || compras.length === 0) {
      setInventario([]);
      return;
    }

    // sort ascending by date and take the last `limit` purchases so columns go left->right oldest->newest
    const sortedAsc = [...compras].sort((a, b) => (a.fecha_compra || '').localeCompare(b.fecha_compra || ''));
    const cols = sortedAsc.slice(Math.max(0, sortedAsc.length - limit));
    setColsCompras(cols);

    const map = new Map<number, any>();

    cols.forEach((compra, colIdx) => {
      compra.detalles.forEach((detalle) => {
        // Get producto ID from detalle
        const pid = detalle.producto ?? null;
        const productName = detalle.producto_nombre ?? `Producto ${pid ?? 'unk'}`;

        // ensure a unique key for the map entry
        const key = pid ?? `${productName}-${detalle.id}`;
        if (!map.has(key)) {
          map.set(key, {
            id: pid ?? key,
            producto: productName,
          });
        }

        const item = map.get(key);
        const idx = colIdx + 1;
        item[`fecha${idx}`] = compra.fecha_compra;
        // cantidad is expected to be numeric
        const cantidad = typeof detalle.cantidad === 'number' ? detalle.cantidad : parseInt(String(detalle.cantidad || '0')) || 0;
        // inventario_anterior can be non-numeric (e.g. '?') so parse safely
        const rawAnterior = detalle.inventario_anterior;
        const anteriorNum = typeof rawAnterior === 'number' ? rawAnterior : (() => {
          const parsed = parseInt(String(rawAnterior));
          return Number.isFinite(parsed) ? parsed : null;
        })();

        item[`col${idx}Compra`] = cantidad;
        item[`col${idx}Anterior`] = anteriorNum;
        // Mostrar exactamente lo que trae el backend en `inventario_anterior`.
        // No realizar cálculos locales (antes se sumaba `anterior + cantidad`).
        item[`col${idx}Inv`] = anteriorNum;
        item[`col${idx}DetalleId`] = detalle.id;
      });
    });

    // If this rebuild was triggered by a local optimistic update, skip it once
    if (skipRebuildRef.current) {
      skipRebuildRef.current = false;
      return;
    }

    setInventario(Array.from(map.values()));
  }, [compras]);

  const handleCellClick = (id: number, field: string, currentValue: number) => {
    setEditingCell({ id, field });
    setEditValue(currentValue.toString());
  };

  const handleCellSave = async (itemId: number, field: string) => {
    const newValue = parseInt(editValue) || 0;
    // Debug log: entry
    // eslint-disable-next-line no-console
    console.log('[handleCellSave] enter', { itemId, field, editValue, newValue });
    const updated = inventario.map((it) => {
      if (it.id !== itemId) return it;
      return { ...it, [field]: newValue };
    });
    setInventario(updated);
    setEditingCell(null);

    // If this cell maps to a detalle id, call API to update
    const compraMatch = field.match(/col(\d+)Compra/);
    const invMatch = field.match(/col(\d+)Inv/);

    if (compraMatch) {
      const colIdx = parseInt(compraMatch[1], 10);
      const item = updated.find((i) => i.id === itemId);
      const detalleId = item?.[`col${colIdx}DetalleId`];
      if (detalleId) {
        // Debug log: detalle info
        // eslint-disable-next-line no-console
        console.log('[handleCellSave] compra edit - detalleId found', { detalleId, newValue });
        try {
          // Send only the edited column (cantidad). Backend should treat this as a PATCH.
          const payload = { cantidad: newValue };
          // eslint-disable-next-line no-console
          console.log('[handleCellSave] sending editarDetalle (compra)', { detalleId, payload });
          const editarResp = await editarDetalle(detalleId, payload);
          // eslint-disable-next-line no-console
          console.log('[handleCellSave] editarDetalle response (compra)', { detalleId, editarResp });
          const t = toast({ title: 'Actualizado', description: 'Cantidad actualizada correctamente' });
          setTimeout(() => t.dismiss(), 500);
          // Optimistically update the compras cache so future reads use the edited cantidad
          try {
            if (typeof mutate === 'function' && compras) {
              const newCompras = (compras || []).map((c: any) => ({
                ...c,
                detalles: Array.isArray(c.detalles) ? c.detalles.map((d: any) => d.id === detalleId ? { ...d, cantidad: newValue } : d) : c.detalles,
              }));
              // update cache without revalidation
              // set flag to skip the subsequent rebuild of inventory from compras
              skipRebuildRef.current = true;
              // @ts-ignore
              mutate(newCompras, false);
            }
          } catch (err) {
            // ignore
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[handleCellSave] editarDetalle error', error);
          toastError(error);
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('[handleCellSave] compra edit - detalleId NOT found', { itemId, field, detalleId });
        toastError(new Error('No se encontró el detalle para actualizar'));
      }
    } else if (invMatch) {
      const colIdx = parseInt(invMatch[1], 10);
      const item = updated.find((i) => i.id === itemId);
      const detalleId = item?.[`col${colIdx}DetalleId`];
      const currentCompra = item?.[`col${colIdx}Compra`] || 0;
      // When editing the inventory cell we will send the absolute value
      // the user entered for the inventory cell (no diffs).
      const newInv = newValue;
      const newInventarioAnterior = newInv; // send absolute value, not difference
      if (detalleId) {
        // Debug log: detalle info for inv edit
        // eslint-disable-next-line no-console
        console.log('[handleCellSave] inv edit - detalleId found', { detalleId, currentCompra, newInv, newInventarioAnterior });
        try {
          // Send only the edited column (inventario_anterior) as the absolute value.
          const payload = { inventario_anterior: newInventarioAnterior };
          // eslint-disable-next-line no-console
          console.log('[handleCellSave] sending editarDetalle (inv)', { detalleId, payload });
          const editarRespInv = await editarDetalle(detalleId, payload);
          // eslint-disable-next-line no-console
          console.log('[handleCellSave] editarDetalle response (inv)', { detalleId, editarRespInv });
          // Update state fields for anterior and inv to reflect the entered absolute value
          const anteriorField = `col${colIdx}Anterior`;
          const invField = `col${colIdx}Inv`;
          const newUpdated = updated.map((it) => it.id === itemId ? { ...it, [anteriorField]: newInventarioAnterior, [invField]: newInv } : it);
          setInventario(newUpdated);
          const t = toast({ title: 'Actualizado', description: 'Detalle actualizado correctamente' });
          setTimeout(() => t.dismiss(), 500);
          try {
            if (typeof mutate === 'function' && compras) {
              const newCompras = (compras || []).map((c: any) => ({
                ...c,
                detalles: Array.isArray(c.detalles) ? c.detalles.map((d: any) => d.id === detalleId ? { ...d, inventario_anterior: newInventarioAnterior } : d) : c.detalles,
              }));
              // update cache without revalidation
              // set flag to skip the subsequent rebuild of inventory from compras
              skipRebuildRef.current = true;
              // @ts-ignore
              mutate(newCompras, false);
            }
          } catch (err) {
            // ignore
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[handleCellSave] editarDetalle error (inv)', error);
          toastError(error);
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('[handleCellSave] inv edit - detalleId NOT found', { itemId, field, detalleId });
        toastError({ title: 'Advertencia', description: 'No se encontró el detalle para actualizar' });
      }
    }
  };

  // Delete detalle (from a specific compra)
  const handleDeleteDetalleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetalleToDelete) {
      toastError({ title: 'Error', description: 'Seleccione un detalle' });
      return;
    }
    try {
      await eliminarDetalle(selectedDetalleToDelete);
      toastSuccess({ title: 'Detalle eliminado', description: 'El detalle se eliminó correctamente' });
      setOpenDeleteProductDialog(false);
      setSelectedDetalleToDelete(null);
      mutate();
    } catch (error) {
      toastError(error);
    }
  };

  // Add detalle to a compra
  const handleAddDetalleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompraForDetailAdd || !selectedProductoToAdd) {
      toastError({ title: 'Error', description: 'Seleccione compra y producto' });
      return;
    }
    try {
      await crearDetalle(selectedCompraForDetailAdd, {
        producto_id: selectedProductoToAdd,
        cantidad: addCantidad,
        inventario_anterior: addInventarioAnterior,
      });
      toastSuccess({ title: 'Detalle creado', description: 'El detalle se creó correctamente' });
      setOpenAddProductDialog(false);
      setSelectedProductoToAdd(null);
      setAddCantidad(0);
      setAddInventarioAnterior(0);
      mutate();
    } catch (error) {
      toastError(error);
    }
  };

  const exportComprasPdf = () => {
    try {
      const wrapper = document.getElementById('compras-table-wrapper');
      if (!wrapper) {
        toastError({ title: 'Error', description: 'No se encontró la tabla a exportar' });
        return;
      }
      const clone = wrapper.cloneNode(true) as HTMLElement;

      // Inline computed styles from original into the clone so colors are preserved
      const origNodes = wrapper.querySelectorAll('*');
      const cloneNodes = clone.querySelectorAll('*');
      for (let i = 0; i < origNodes.length; i++) {
        const o = origNodes[i] as HTMLElement;
        const c = cloneNodes[i] as HTMLElement | undefined;
        if (!c || !o) continue;
        try {
          const cs = window.getComputedStyle(o);
          if (cs.backgroundColor) c.style.backgroundColor = cs.backgroundColor;
          if (cs.color) c.style.color = cs.color;
          if (cs.fontWeight) c.style.fontWeight = cs.fontWeight;
          if (cs.border) c.style.border = cs.border;
          if (cs.padding) c.style.padding = cs.padding;
          if (cs.textAlign) c.style.textAlign = cs.textAlign;
        } catch (err) {
          // ignore
        }
      }

      // Remove suggestion spans and inventory columns and any buttons from the clone
      clone.querySelectorAll('.no-print-suggestion').forEach((el) => el.remove());
      clone.querySelectorAll('.inv-col').forEach((el) => el.remove());
      clone.querySelectorAll('button').forEach((el) => el.remove());

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Inventario Compras</title><style>body{font-family:Inter,system-ui,Arial,Helvetica,sans-serif;margin:20px;-webkit-print-color-adjust:exact;print-color-adjust:exact}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px;text-align:center;font-size:12px}th{background:#f3f4f6;font-weight:600}</style></head><body>${clone.innerHTML}</body></html>`;

      const w = window.open('', '_blank');
      if (!w) {
        toastError({ title: 'Error', description: 'No se pudo abrir la ventana para imprimir' });
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      setTimeout(() => {
        try {
          w.focus();
          w.print();
        } catch (err) {
          console.error('print error', err);
        }
      }, 500);
    } catch (error) {
      console.error('exportComprasPdf error', error);
      toastError({ title: 'Error', description: 'Falló la exportación a PDF' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-full px-0 py-2 sm:py-4">
        <div className="mb-2 sm:mb-4 flex items-center justify-between px-2 sm:px-4">
          <h1 className="text-lg sm:text-2xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-chart-1" />
            <span className="hidden sm:inline">Inventario de Compras</span>
            <span className="sm:hidden">Inventario</span>
          </h1>
            <div className="flex items-center gap-2">
            <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
              <DialogTrigger asChild>
                <Button size="icon" className="h-8 w-8 sm:h-9 sm:w-9" title="Nueva Compra">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Compra</DialogTitle>
                <DialogDescription>
                  Crea una nueva compra. Se generarán detalles automáticamente para cada producto del proveedor.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCompra} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tienda-create">Tienda</Label>
                  <Select value={selectedTienda?.toString() || ''} onValueChange={(value) => setSelectedTienda(parseInt(value))} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una tienda" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiendas?.map((tienda) => (
                        <SelectItem key={tienda.id} value={tienda.id!.toString()}>
                          {tienda.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proveedor-create">Proveedor</Label>
                  <Select value={proveedorId} onValueChange={setProveedorId} required disabled={!selectedTienda}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {proveedores?.map((proveedor) => (
                        <SelectItem key={proveedor.id} value={proveedor.id!.toString()}>
                          {proveedor.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-compra">Fecha de Compra</Label>
                  <Input
                    id="fecha-compra"
                    type="date"
                    value={fechaCompra}
                    onChange={(e) => setFechaCompra(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpenCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Crear</Button>
                </div>
              </form>
              </DialogContent>
            </Dialog>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 sm:h-9 sm:w-9"
              title="Actualizar compras"
              onClick={() => { if (typeof mutate === 'function') mutate(); }}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 sm:h-9 sm:w-9"
              title="Exportar tabla a PDF"
              onClick={() => exportComprasPdf()}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="mb-3 mx-2 sm:mx-4 bg-blue-50">
          <CardContent className="py-3">
            <div className="space-y-3">
              {/* Fila 1: Tienda + Proveedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tienda</Label>
                  <Select value={selectedTienda?.toString() || ''} onValueChange={(v) => { setSelectedTienda(v ? parseInt(v) : null); setSelectedProveedor(null); }}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Selecciona tienda" />
                    </SelectTrigger>
                    <SelectContent>
                      {(tiendas || []).map((t) => (
                        <SelectItem key={t.id} value={t.id!.toString()}>{t.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Proveedor</Label>
                  <Select value={selectedProveedor?.toString() || ''} onValueChange={(v) => setSelectedProveedor(v ? parseInt(v) : null)} disabled={!selectedTienda}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Selecciona proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {(proveedores || []).map((p) => (
                        <SelectItem key={p.id} value={p.id!.toString()}>{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Fila 2: Fechas + Límite + Filtrar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="fecha-inicio" className="text-xs">Inicio</Label>
                  <Input
                    id="fecha-inicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="h-9 text-xs px-2 w-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fecha-fin" className="text-xs">Fin</Label>
                  <Input
                    id="fecha-fin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="h-9 text-xs px-2 w-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="limit" className="text-xs">Límite</Label>
                  <Input
                    id="limit"
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value))}
                    min="1"
                    max="100"
                    className="h-9 text-xs px-2 w-full"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleFilter} size="sm" className="h-9 w-full text-xs">
                    Filtrar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        

        {isLoading ? (
          <Card className="animate-pulse mt-6">
            <CardHeader>
              <div className="h-6 w-32 rounded bg-muted" />
            </CardHeader>
          </Card>
        ) : inventario && inventario.length > 0 ? (
          <>
            {/* toolbar removed per UX request (icons were duplicated) */}

            <div id="compras-table-wrapper" className="rounded-lg border bg-card overflow-x-auto shadow-sm mx-0 sm:mx-2">
            <Table>
              <TableHeader>
                <TableRow>
                  {canViewInventory && colsCompras.map((c, idx) => (
                    <TableHead key={`inv-${c.id}`} className="inv-col bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 w-[50px] sm:w-16 text-center text-[10px] sm:text-xs p-0.5 sm:p-1">
                      {formatDate(c.fecha_compra)}
                    </TableHead>
                  ))}
                  <TableHead className="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-200 text-center font-semibold text-[10px] sm:text-sm p-0.5 sm:p-1 min-w-[70px] sm:min-w-[100px]">
                    Producto
                  </TableHead>
                  {colsCompras.map((c, idx) => (
                    <TableHead key={`compra-h-${c.id}`} className="bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200 w-[60px] sm:w-20 text-center text-[10px] sm:text-xs p-0.5 sm:p-1">
                      <div className="flex flex-col items-center gap-1">
                        <ConfirmDialog
                          title="Eliminar compra"
                          description={"¿Estás seguro que deseas eliminar esta compra? Esta acción eliminará la compra de esta fecha ."}
                          confirmLabel="Eliminar compra"
                          onConfirm={() => c?.id ? handleDelete(c.id) : undefined}
                        >
                          <Button size="icon" variant="ghost" className="h-6 w-6 p-0" title="Eliminar compra">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </ConfirmDialog>
                        <span className="text-[10px] sm:text-xs">{formatDate(c.fecha_compra)}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventario.map((item) => (
                  <TableRow key={item.id}>
                    {/* inventory columns (left) */}
                    {canViewInventory && colsCompras.map((c, idx) => {
                      const field = `col${idx + 1}Inv`;
                      const editingField = editingCell?.field === field && editingCell?.id === item.id;
                      const cellValue = item[field];
                      const display = (cellValue === null || cellValue === undefined || cellValue === 0) ? '-' : String(cellValue);
                      return (
                        <TableCell
                          key={`invcell-${item.id}-${idx}`}
                          className={`inv-col bg-blue-50/50 dark:bg-blue-950/20 text-center p-0.5 sm:p-1 ${!editingField ? 'cursor-pointer' : ''}`}
                          onClick={!editingField ? () => handleCellClick(item.id, field, cellValue ?? 0) : undefined}
                        >
                                {editingField ? (
                                  <Input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => handleCellSave(item.id, field)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCellSave(item.id, field)}
                                    className="w-[45px] sm:w-12 h-5 sm:h-6 text-[10px] sm:text-xs mx-auto text-center p-0"
                                    autoFocus
                                  />
                                ) : (
                                  <div className="flex flex-col items-center gap-0">
                                    <span
                                      className="text-blue-700 dark:text-blue-300 font-semibold text-[10px] sm:text-sm hover:bg-blue-100/50 dark:hover:bg-blue-900/30 px-0.5 py-0.5 rounded"
                                    >
                                      {display}
                                    </span>
                                  </div>
                                )}
                        </TableCell>
                      );
                    })}

                    <TableCell className="bg-green-50/60 dark:bg-green-950/30 font-medium text-center text-[10px] sm:text-sm p-0.5 sm:p-1">
                      {item.producto}
                    </TableCell>

                    {/* compra columns (right) */}
                    {colsCompras.map((c, idx) => {
                      const compraField = `col${idx + 1}Compra`;
                      const anteriorField = `col${idx + 1}Anterior`;
                      const editingField = editingCell?.field === compraField && editingCell?.id === item.id;

                      // compute suggestion values once so we can show them both in edit and read modes
                      const compraVal = item[compraField] ?? 0;
                      const compraDisplay = compraVal === 0 ? '-' : String(compraVal);
                      const currInv = item[`col${idx + 1}Inv`];
                      const prevInv = idx > 0 ? item[`col${idx}Inv`] : undefined;
                      const showSuggestion = typeof prevInv === 'number' && typeof currInv === 'number' && prevInv > currInv;
                      const suggestion = showSuggestion ? (prevInv - currInv) : null;

                      return (
                        <TableCell
                          key={`compcell-${item.id}-${idx}`}
                          className={`bg-red-50/50 dark:bg-red-950/20 text-center p-0.5 sm:p-1 ${!editingField ? 'cursor-pointer' : ''}`}
                          onClick={!editingField ? () => handleCellClick(item.id, compraField, item[compraField] || 0) : undefined}
                        >
                          <div className="flex flex-col items-center gap-0">
                                {editingField ? (
                              <>
                                <Input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => handleCellSave(item.id, compraField)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleCellSave(item.id, compraField)}
                                  className="w-[45px] sm:w-12 h-5 sm:h-6 text-[10px] sm:text-xs mx-auto text-center p-0"
                                  autoFocus
                                />
                                {showSuggestion ? (
                                  <span className="no-print-suggestion text-[8px] text-green-600 dark:text-green-400">{suggestion}</span>
                                ) : (
                                  <span className="text-[7px] sm:text-[8px] text-muted-foreground">&nbsp;</span>
                                )}
                              </>
                            ) : (
                              <>
                                <span
                                  className="font-semibold text-red-700 dark:text-red-300 text-[10px] sm:text-sm hover:bg-red-100/50 dark:hover:bg-red-900/30 px-0.5 py-0.5 rounded"
                                >
                                  {compraDisplay}
                                </span>
                                {showSuggestion ? (
                                  <span className="no-print-suggestion text-[8px] text-green-600 dark:text-green-400">{suggestion}</span>
                                ) : (
                                  <span className="text-[7px] sm:text-[8px] text-muted-foreground">&nbsp;</span>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </>
        ) : (
          <Card className="mt-6">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">No hay compras</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comienza creando tu primera compra
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Detalle de Compra</DialogTitle>
            <DialogDescription>
              Modifica la cantidad y el inventario anterior del producto
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditDetalle} className="space-y-4">
            <div className="space-y-2">
              <Label>Producto</Label>
              <Input
                value={editingDetalle?.producto_nombre || `Producto ${editingDetalle?.producto}`}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                required
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inventario-anterior">Inventario Anterior</Label>
              <Input
                id="inventario-anterior"
                type="number"
                value={inventarioAnterior}
                onChange={(e) => setInventarioAnterior(e.target.value)}
                required
                min="0"
              />
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                Inventario Nuevo:{' '}
                <span className="font-semibold text-primary">
                  {(parseInt(inventarioAnterior) || 0) + (parseInt(cantidad) || 0)}
                </span>
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">Actualizar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogo: Eliminar Producto */}
      <Dialog open={openDeleteProductDialog} onOpenChange={setOpenDeleteProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
            <DialogDescription>Selecciona tienda, proveedor y producto a eliminar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeleteDetalleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Compra</Label>
              <Select value={selectedCompraForDetailDelete?.toString() || ''} onValueChange={(v) => { setSelectedCompraForDetailDelete(v ? parseInt(v) : null); setSelectedDetalleToDelete(null); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una compra" />
                </SelectTrigger>
                <SelectContent>
                  {colsCompras?.map((c) => (
                    <SelectItem key={c.id} value={c.id!.toString()}>{formatDate(c.fecha_compra)} - #{c.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Detalle (producto)</Label>
              <Select value={selectedDetalleToDelete?.toString() || ''} onValueChange={(v) => setSelectedDetalleToDelete(v ? parseInt(v) : null)} disabled={!selectedCompraForDetailDelete}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un detalle" />
                </SelectTrigger>
                <SelectContent>
                  {(colsCompras.find((c) => c.id === selectedCompraForDetailDelete)?.detalles || []).map((d) => (
                    <SelectItem key={d.id} value={d.id!.toString()}>{d.producto_nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenDeleteProductDialog(false)}>Cancelar</Button>
              <Button type="submit">Eliminar detalle</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogo: Añadir Producto */}
      <Dialog open={openAddProductDialog} onOpenChange={setOpenAddProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Producto</DialogTitle>
            <DialogDescription>Selecciona proveedor y nombre del producto a crear.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddDetalleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Compra</Label>
              <Select value={selectedCompraForDetailAdd?.toString() || ''} onValueChange={(v) => {
                const id = v ? parseInt(v) : null;
                setSelectedCompraForDetailAdd(id);
                setSelectedProductoToAdd(null);
                // set proveedor so productosForDialog can load
                const compra = colsCompras.find((c) => c.id === id);
                if (compra) setSelectedProveedorForProduct(compra.proveedor as number);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una compra" />
                </SelectTrigger>
                <SelectContent>
                  {colsCompras?.map((c) => (
                    <SelectItem key={c.id} value={c.id!.toString()}>{formatDate(c.fecha_compra)} - #{c.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Producto</Label>
              <Select value={selectedProductoToAdd?.toString() || ''} onValueChange={(v) => setSelectedProductoToAdd(v ? parseInt(v) : null)} disabled={!selectedProveedorForProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {productosForDialog?.map((pr) => (
                    <SelectItem key={pr.id} value={pr.id!.toString()}>{pr.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 grid grid-cols-2 gap-2">
              <div>
                <Label>Cantidad</Label>
                <Input type="number" value={addCantidad} onChange={(e) => setAddCantidad(parseInt(e.target.value || '0'))} />
              </div>
              <div>
                <Label>Inventario Anterior</Label>
                <Input type="number" value={addInventarioAnterior} onChange={(e) => setAddInventarioAnterior(parseInt(e.target.value || '0'))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenAddProductDialog(false)}>Cancelar</Button>
              <Button type="submit">Crear detalle</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
