import { apiRequest } from '../api-client';
import { Proveedor, ProveedorIn, ProveedorUpdate } from '../types';

export async function listarProveedores(tiendaId: number): Promise<Proveedor[]> {
  return apiRequest<Proveedor[]>(`/api/proveedor/listar/${tiendaId}/`);
}

export async function crearProveedor(data: ProveedorIn): Promise<Proveedor> {
  return apiRequest<Proveedor>('/api/proveedor/crear/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function actualizarProveedor(id: number, data: ProveedorUpdate): Promise<Proveedor> {
  return apiRequest<Proveedor>(`/api/proveedor/actualizar/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function eliminarProveedor(id: number): Promise<void> {
  return apiRequest<void>(`/api/proveedor/eliminar/${id}/`, {
    method: 'DELETE',
  });
}
