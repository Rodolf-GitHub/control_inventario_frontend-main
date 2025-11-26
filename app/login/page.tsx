"use client";

import { useState } from 'react';
import packageJson from '../../package.json';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { loginApi } from '@/lib/api/usuarios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Toaster } from '@/components/ui/toaster';
import { Store } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const version = packageJson?.version ?? '';
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await loginApi(username, password);
      if (res) {
        // res contains token and user info (username, permisos, es_superusuario)
        login(res as any);
        toast({ title: 'Login exitoso', description: 'Redirigiendo...' });
        router.push('/');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'No se pudo iniciar sesión', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="fixed top-4 right-4 z-50 pointer-events-none">
        <div className="text-xs text-muted-foreground bg-muted/10 px-2 py-1 rounded-md">{version ? `v${version}` : 'v...'}</div>
      </div>
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-blue-50 p-3">
              <Store className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-center">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground text-center">Accede con tu usuario y contraseña</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-3 mt-2">
            <Input placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="flex justify-center">
              <Button type="submit" className="w-full max-w-xs" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
