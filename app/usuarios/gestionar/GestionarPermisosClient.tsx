"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getPermisosUsuarioApi, actualizarPermisoApi, eliminarPermisoApi, crearPermisoApi } from '@/lib/api/usuarios';
import { listarTiendas } from '@/lib/api/tiendas';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function GestionarPermisosClient({ usuarioId }: { usuarioId?: number }) {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // If usuarioId not provided from server, try to read from query string on client
  const [clientUsuarioId, setClientUsuarioId] = useState<number | undefined>(typeof usuarioId === 'number' ? usuarioId : undefined);

  useEffect(() => {
    if (clientUsuarioId === undefined) {
      const idStr = searchParams?.get?.('id') ?? undefined;
      const n = idStr ? Number(idStr) : undefined;
      if (Number.isFinite(n)) setClientUsuarioId(n as number);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [permisos, setPermisos] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTiendaId, setNewTiendaId] = useState<number | ''>('');
  const [tiendas, setTiendas] = useState<{ id?: number; nombre: string }[] | null>(null);
  const [newPermisos, setNewPermisos] = useState({
    puede_gestionar_proveedores: true,
    puede_gestionar_productos: true,
    puede_gestionar_compras: true,
    puede_editar_compras: true,
    puede_ver_inventario_compras: true,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const idToUse = Number.isFinite(usuarioId as number) ? (usuarioId as number) : clientUsuarioId;
    if (!Number.isFinite(idToUse as number)) return;
    loadPermisos(idToUse as number);
    loadTiendas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, usuarioId, clientUsuarioId]);

  async function loadPermisos(id: number) {
    if (!Number.isFinite(id)) return;
    setLoading(true);
    try {
      const res = await getPermisosUsuarioApi(id, token || undefined);
      setPermisos(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast({ title: 'Error', description: String(err?.message || err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function loadTiendas() {
    try {
      const t = await listarTiendas();
      setTiendas(Array.isArray(t) ? t : []);
    } catch (err: any) {
      toast({ title: 'Error', description: 'No se pudieron cargar las tiendas', variant: 'destructive' });
      setTiendas([]);
    }
  }

  async function handleToggle(permiso: any, field: string) {
    const data = { ...permiso, [field]: !permiso[field] };
    try {
      await actualizarPermisoApi(permiso.id, data, token || undefined);
      toast({ title: 'Permiso actualizado' });
      // Optimistic UI update
      setPermisos((prev) => prev ? prev.map(p => p.id === permiso.id ? { ...p, [field]: !p[field] } : p) : prev);
      const idToUse = Number.isFinite(usuarioId as number) ? (usuarioId as number) : clientUsuarioId;
      if (Number.isFinite(idToUse as number)) loadPermisos(idToUse as number);
    } catch (err: any) {
      toast({ title: 'Error', description: String(err?.message || err), variant: 'destructive' });
    }
  }

  async function handleDelete(permisoId: number) {
    if (!confirm('Eliminar permiso?')) return;
    try {
      await eliminarPermisoApi(permisoId, token || undefined);
      toast({ title: 'Permiso eliminado' });
      // Remove locally first
      setPermisos((prev) => prev ? prev.filter(p => p.id !== permisoId) : prev);
      const idToUse = Number.isFinite(usuarioId as number) ? (usuarioId as number) : clientUsuarioId;
      if (Number.isFinite(idToUse as number)) loadPermisos(idToUse as number);
    } catch (err: any) {
      toast({ title: 'Error', description: String(err?.message || err), variant: 'destructive' });
    }
  }

  async function handleCreate() {
    const idToUse = Number.isFinite(usuarioId as number) ? (usuarioId as number) : clientUsuarioId;
    if (!newTiendaId || !Number.isFinite(idToUse as number)) return;
    setCreating(true);
    try {
      await crearPermisoApi({ usuario_id: idToUse, tienda_id: Number(newTiendaId), ...newPermisos }, token || undefined);
      toast({ title: 'Permiso creado' });
      setNewTiendaId('');
      loadPermisos(idToUse as number);
    } catch (err: any) {
      const desc = err?.message || JSON.stringify(err) || String(err);
      toast({ title: 'Error', description: desc, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Card className="mb-4">
        <CardContent>
          <h2 className="font-medium mb-2">Permisos asignados</h2>
          {loading && <div>Cargando permisos...</div>}
          {!loading && permisos && permisos.length === 0 && <div>No hay permisos asignados.</div>}
          {permisos && permisos.length > 0 && (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Tienda</th>
                      <th className="text-left p-2">Gestionar Proveedores</th>
                      <th className="text-left p-2">Gestionar Productos</th>
                      <th className="text-left p-2">Gestionar Compras</th>
                      <th className="text-left p-2">Editar Compras</th>
                      <th className="text-left p-2">Ver Inventario</th>
                      <th className="text-left p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permisos.map((p: any) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-2">{(tiendas && tiendas.find(t => t.id === p.tienda)?.nombre) || p.tienda}</td>
                        <td className="p-2 text-center">
                          <Button size="icon" variant={p.puede_gestionar_proveedores ? 'outline' : 'ghost'} onClick={() => handleToggle(p, 'puede_gestionar_proveedores')} title="Toggle Gestionar Proveedores">
                            {p.puede_gestionar_proveedores ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-rose-500" />}
                          </Button>
                        </td>
                        <td className="p-2 text-center">
                          <Button size="icon" variant={p.puede_gestionar_productos ? 'outline' : 'ghost'} onClick={() => handleToggle(p, 'puede_gestionar_productos')} title="Toggle Gestionar Productos">
                            {p.puede_gestionar_productos ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-rose-500" />}
                          </Button>
                        </td>
                        <td className="p-2 text-center">
                          <Button size="icon" variant={p.puede_gestionar_compras ? 'outline' : 'ghost'} onClick={() => handleToggle(p, 'puede_gestionar_compras')} title="Toggle Gestionar Compras">
                            {p.puede_gestionar_compras ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-rose-500" />}
                          </Button>
                        </td>
                        <td className="p-2 text-center">
                          <Button size="icon" variant={p.puede_editar_compras ? 'outline' : 'ghost'} onClick={() => handleToggle(p, 'puede_editar_compras')} title="Toggle Editar Compras">
                            {p.puede_editar_compras ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-rose-500" />}
                          </Button>
                        </td>
                        <td className="p-2 text-center">
                          <Button size="icon" variant={p.puede_ver_inventario_compras ? 'outline' : 'ghost'} onClick={() => handleToggle(p, 'puede_ver_inventario_compras')} title="Toggle Ver Inventario">
                            {p.puede_ver_inventario_compras ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-rose-500" />}
                          </Button>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2 items-center">
                            <Button size="icon" variant="destructive" onClick={() => handleDelete(p.id)} title="Eliminar permiso">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden grid grid-cols-1 gap-3">
                {permisos.map((p: any) => (
                  <div key={`perm-${p.id}`} className="p-3 bg-card rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Tienda</div>
                        <div className="font-medium">{(tiendas && tiendas.find(t => t.id === p.tienda)?.nombre) || p.tienda}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="destructive" onClick={() => handleDelete(p.id)} title="Eliminar permiso">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Gestionar Proveedores</div>
                        <Button size="icon" variant={p.puede_gestionar_proveedores ? 'outline' : 'ghost'} onClick={() => handleToggle(p, 'puede_gestionar_proveedores')} title="Toggle Gestionar Proveedores">
                          {p.puede_gestionar_proveedores ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-rose-500" />}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Gestionar Productos</div>
                        <Button size="icon" variant={p.puede_gestionar_productos ? 'outline' : 'ghost'} onClick={() => handleToggle(p, 'puede_gestionar_productos')} title="Toggle Gestionar Productos">
                          {p.puede_gestionar_productos ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-rose-500" />}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Gestionar Compras</div>
                        <Button size="icon" variant={p.puede_gestionar_compras ? 'outline' : 'ghost'} onClick={() => handleToggle(p, 'puede_gestionar_compras')} title="Toggle Gestionar Compras">
                          {p.puede_gestionar_compras ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-rose-500" />}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Editar Compras</div>
                        <Button size="icon" variant={p.puede_editar_compras ? 'outline' : 'ghost'} onClick={() => handleToggle(p, 'puede_editar_compras')} title="Toggle Editar Compras">
                          {p.puede_editar_compras ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-rose-500" />}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between col-span-2">
                        <div className="text-sm">Ver Inventario</div>
                        <Button size="icon" variant={p.puede_ver_inventario_compras ? 'outline' : 'ghost'} onClick={() => handleToggle(p, 'puede_ver_inventario_compras')} title="Toggle Ver Inventario">
                          {p.puede_ver_inventario_compras ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-rose-500" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-medium mb-2">Crear permiso</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="block">
              <span className="text-sm">Tienda</span>
              <select className="mt-1 block w-full rounded-md border p-2" value={String(newTiendaId)} onChange={(e) => setNewTiendaId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Seleccione una tienda</option>
                {tiendas && tiendas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 gap-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <div className="text-sm">Gestionar Proveedores</div>
                <input type="checkbox" className="h-4 w-4" checked={!!newPermisos.puede_gestionar_proveedores} onChange={(e) => setNewPermisos({ ...newPermisos, puede_gestionar_proveedores: e.target.checked })} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">Gestionar Productos</div>
                <input type="checkbox" className="h-4 w-4" checked={!!newPermisos.puede_gestionar_productos} onChange={(e) => setNewPermisos({ ...newPermisos, puede_gestionar_productos: e.target.checked })} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">Gestionar Compras</div>
                <input type="checkbox" className="h-4 w-4" checked={!!newPermisos.puede_gestionar_compras} onChange={(e) => setNewPermisos({ ...newPermisos, puede_gestionar_compras: e.target.checked })} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">Editar Compras</div>
                <input type="checkbox" className="h-4 w-4" checked={!!newPermisos.puede_editar_compras} onChange={(e) => setNewPermisos({ ...newPermisos, puede_editar_compras: e.target.checked })} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">Ver Inventario Compras</div>
                <input type="checkbox" className="h-4 w-4" checked={!!newPermisos.puede_ver_inventario_compras} onChange={(e) => setNewPermisos({ ...newPermisos, puede_ver_inventario_compras: e.target.checked })} />
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="icon" variant="outline" title="Crear permiso" onClick={handleCreate} disabled={creating}>
              <Plus className="h-4 w-4 text-emerald-600" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
