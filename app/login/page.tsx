"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { loginApi } from '@/lib/api/usuarios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Toaster } from '@/components/ui/toaster';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Iniciar sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
