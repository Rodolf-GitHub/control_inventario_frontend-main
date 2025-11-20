"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getPermisosUsuarioApi, actualizarPermisoApi, eliminarPermisoApi, crearPermisoApi } from '@/lib/api/usuarios';
import { listarTiendas } from '@/lib/api/tiendas';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Check, X, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Nav } from '@/components/layout/nav';

export default function GestionarPermisosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const idParam = searchParams.get('id');
  const usuarioId = idParam ? Number(idParam) : NaN;

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
    if (!idParam) return;
    loadPermisos();
    loadTiendas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, idParam]);

  async function loadPermisos() {
    if (!usuarioId) return;
    setLoading(true);
    try {
      const res = await getPermisosUsuarioApi(usuarioId, token || undefined);
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
      loadPermisos();
    } catch (err: any) {
      toast({ title: 'Error', description: String(err?.message || err), variant: 'destructive' });
    }
  }

  async function handleDelete(permisoId: number) {
    if (!confirm('Eliminar permiso?')) return;
    try {
      await eliminarPermisoApi(permisoId, token || undefined);
      toast({ title: 'Permiso eliminado' });
      loadPermisos();
    } catch (err: any) {
      toast({ title: 'Error', description: String(err?.message || err), variant: 'destructive' });
    }
  }

  async function handleCreate() {
    if (!newTiendaId || !usuarioId) return;
    setCreating(true);
    try {
      // send usuario_id to match backend expectations
      await crearPermisoApi({ usuario_id: usuarioId, tienda_id: Number(newTiendaId), ...newPermisos }, token || undefined);
      toast({ title: 'Permiso creado' });
      setNewTiendaId('');
      loadPermisos();
    } catch (err: any) {
      const desc = err?.message || JSON.stringify(err) || String(err);
      toast({ title: 'Error', description: desc, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  }

  if (!idParam) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="mx-auto max-w-4xl px-4 py-6">
          <h1 className="text-xl font-semibold mb-4">Gestión de permisos</h1>
          <div className="p-4 bg-card rounded">No se indicó el usuario. Usa <code>/usuarios/gestionar?id=&lt;USER_ID&gt;</code></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-xl font-semibold mb-4">Gestión de permisos - Usuario {idParam}</h1>

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
      </main>
    </div>
  );
}
