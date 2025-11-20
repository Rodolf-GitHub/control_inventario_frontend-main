import { apiRequest } from '../api-client';
import { Tienda, TiendaIn } from '../types';

export async function listarTiendas(): Promise<Tienda[]> {
  return apiRequest<Tienda[]>('/api/tienda/listar/');
}

export async function crearTienda(data: TiendaIn): Promise<Tienda> {
  return apiRequest<Tienda>('/api/tienda/crear/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function actualizarTienda(id: number, data: TiendaIn): Promise<Tienda> {
  return apiRequest<Tienda>(`/api/tienda/actualizar/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function eliminarTienda(id: number): Promise<void> {
  return apiRequest<void>(`/api/tienda/eliminar/${id}/`, {
    method: 'DELETE',
  });
}
