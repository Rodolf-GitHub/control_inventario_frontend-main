"use client";

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Key, Settings, RefreshCw, Trash2, Plus, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { crearUsuarioApi, superResetPasswordApi, changePasswordApi, listarUsuariosApi, eliminarUsuarioApi } from '@/lib/api/usuarios';
import { listarTiendas } from '@/lib/api/tiendas';
import { useAuth } from '@/lib/auth';
import { Nav } from '@/components/layout/nav';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ui/confirm-dialog';

export default function UsuariosPage() {
  const { token, isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [uUsername, setUUsername] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [tiendas, setTiendas] = useState<{ id?: number; nombre: string }[] | null>(null);

  const [loadingChange, setLoadingChange] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');

  // listar usuarios (solo para superusuarios)
  const { data: usuarios, error: usuariosError, mutate } = useSWR(
    () => (user?.es_superusuario ? ['usuarios', token] : null),
    () => listarUsuariosApi(token || undefined),
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
    loadTiendas();
  }, [isAuthenticated, router]);

  async function loadTiendas() {
    try {
      const t = await listarTiendas();
      setTiendas(Array.isArray(t) ? t : []);
    } catch (err) {
      setTiendas([]);
    }
  }

  const handleCreate = async () => {
    if (!uUsername || !uPassword) return;
    setLoadingCreate(true);
    try {
      await crearUsuarioApi({ username: uUsername, password: uPassword }, token || undefined);
      toast({ title: 'Usuario creado' });
      setUUsername('');
      setUPassword('');
      mutate && mutate();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Error al crear usuario', variant: 'destructive' });
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleSuperReset = async (usuarioId: number, newPassword: string) => {
    try {
      await superResetPasswordApi(usuarioId, { new_password: newPassword }, token || undefined);
      toast({ title: 'Password reseteada' });
      mutate && mutate();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Error al resetear', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (usuarioId: number) => {
    try {
      await eliminarUsuarioApi(usuarioId, token || undefined);
      toast({ title: 'Usuario eliminado' });
      mutate && mutate();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Error al eliminar usuario', variant: 'destructive' });
    }
  };

  const handleChangePassword = async () => {
    if (!oldPass || !newPass) return;
    setLoadingChange(true);
    try {
      await changePasswordApi({ old_password: oldPass, new_password: newPass }, token || undefined);
      toast({ title: 'Password cambiada' });
      setOldPass('');
      setNewPass('');
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Error al cambiar password', variant: 'destructive' });
    } finally {
      setLoadingChange(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-xl font-semibold mb-4">Gestión de Usuarios</h1>

        {/* Current user info + change password modal */}
        <Card className="mb-4">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Usuario</div>
                <div className="font-medium">{user?.username || '—'}</div>
                <div className="text-sm mt-2">{user?.es_superusuario ? 'Superusuario' : 'Usuario normal'}</div>
                {user?.permisos && Array.isArray(user.permisos) && (
                  <div className="mt-2 text-sm">
                    <div className="font-medium">Permisos:</div>
                    <ul className="list-disc pl-5">
                      {user.permisos.map((p: any, idx: number) => {
                        const tiendaNombre = (tiendas && tiendas.find(t => t.id === p.tienda)?.nombre) || (p.tienda ? `Tienda ${p.tienda}` : 'Global');
                        const activos = Object.keys(p).filter((k) => k.startsWith('puede') && p[k]);
                        const labels = activos.map((k) => k.replace(/^puede_/, '').replace(/_/g, ' ')).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
                        return (
                          <li key={idx}>
                            <div className="font-medium">{tiendaNombre}</div>
                            <div className="text-sm">{labels || 'Sin permisos asignados'}</div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger>
                    <Button size="icon" variant="outline" title="Cambiar contraseña">
                      <Key className="h-4 w-4 text-sky-600" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cambiar mi contraseña</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <Input placeholder="Contraseña actual" type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} />
                      <Input placeholder="Nueva contraseña" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                    </div>
                    <DialogFooter>
                      <Button onClick={handleChangePassword} disabled={loadingChange}>{loadingChange ? 'Cambiando...' : 'Cambiar'}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button size="icon" variant="outline" title="Cerrar sesión" onClick={() => { logout(); router.push('/login'); }}>
                  <LogOut className="h-4 w-4 text-rose-500" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Superuser section: list users */}
        {user?.es_superusuario && (
          <Card>
            <CardContent>
              <h2 className="font-medium mb-2">Usuarios del sistema</h2>
              {usuariosError && (
                <div className="text-destructive">No se pudo cargar la lista de usuarios: {String(usuariosError.message || usuariosError)}</div>
              )}
              {!usuarios && !usuariosError && <div>Cargando usuarios...</div>}
              {usuarios && Array.isArray(usuarios) && (
                <>
                  {/* Desktop: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr>
                          <th className="text-left p-2">ID</th>
                          <th className="text-left p-2">Usuario</th>
                          <th className="text-left p-2">Super</th>
                          <th className="text-left p-2">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuarios.map((u: any) => (
                          <tr key={u.id} className="border-t">
                            <td className="p-2">{u.id}</td>
                            <td className="p-2">{u.username}</td>
                            <td className="p-2">{u.es_superusuario ? 'Sí' : 'No'}</td>
                            <td className="p-2">
                              <div className="flex gap-2 items-center">
                                <Button size="icon" variant="outline" onClick={() => {
                                  const pw = prompt('Nueva contraseña para ' + u.username);
                                  if (pw) handleSuperReset(u.id, pw);
                                }} title={`Resetear contraseña de ${u.username}`}>
                                  <Key className="h-4 w-4 text-sky-600" />
                                </Button>

                                <Button size="icon" variant="ghost" onClick={() => router.push(`/usuarios/gestionar?id=${u.id}`)} title={`Gestionar permisos de ${u.username}`}>
                                  <Settings className="h-4 w-4 text-emerald-600" />
                                </Button>

                                <ConfirmDialog
                                  title="Eliminar usuario"
                                  description={`¿Eliminar usuario ${u.username}? Esta acción no se puede deshacer.`}
                                  confirmLabel="Eliminar usuario"
                                  onConfirm={() => handleDeleteUser(u.id)}
                                >
                                  <Button size="icon" variant="destructive" title={`Eliminar usuario ${u.username}`}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </ConfirmDialog>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: cards */}
                  <div className="md:hidden grid grid-cols-1 gap-3">
                    {usuarios.map((u: any) => (
                      <div key={`card-${u.id}`} className="p-3 bg-card rounded-lg border flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Usuario</div>
                          <div className="font-medium">{u.username}</div>
                          <div className="text-xs text-muted-foreground mt-1">ID: {u.id} · {u.es_superusuario ? 'Super' : 'User'}</div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="icon" variant="outline" onClick={() => {
                            const pw = prompt('Nueva contraseña para ' + u.username);
                            if (pw) handleSuperReset(u.id, pw);
                          }} title={`Resetear contraseña de ${u.username}`}>
                            <Key className="h-4 w-4 text-sky-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => router.push(`/usuarios/gestionar?id=${u.id}`)} title={`Gestionar permisos de ${u.username}`}>
                            <Settings className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <ConfirmDialog
                            title="Eliminar usuario"
                            description={`¿Eliminar usuario ${u.username}? Esta acción no se puede deshacer.`}
                            confirmLabel="Eliminar usuario"
                            onConfirm={() => handleDeleteUser(u.id)}
                          >
                            <Button size="icon" variant="destructive" title={`Eliminar usuario ${u.username}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </ConfirmDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create user (only visible to superusers) */}
        {user?.es_superusuario && (
          <Card className="mt-4">
            <CardContent>
              <h2 className="font-medium mb-2">Crear Usuario</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
                <Input placeholder="Usuario" value={uUsername} onChange={(e) => setUUsername(e.target.value)} />
                <Input placeholder="Password" value={uPassword} onChange={(e) => setUPassword(e.target.value)} />
                <div className="sm:col-span-2 flex justify-end">
                  <Button size="icon" variant="outline" title="Crear usuario" onClick={handleCreate} disabled={loadingCreate}>
                    <Plus className="h-4 w-4 text-emerald-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Toaster />
    </div>
  );
}
