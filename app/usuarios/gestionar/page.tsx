import React, { Suspense } from 'react';
import { Nav } from '@/components/layout/nav';
import GestionarPermisosClient from './GestionarPermisosClient';

export default function GestionarPermisosPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-xl font-semibold mb-4">Gestión de permisos</h1>
        <Suspense fallback={<div>Cargando...</div>}>
          <GestionarPermisosClient />
        </Suspense>
      </main>
    </div>
  );
}
