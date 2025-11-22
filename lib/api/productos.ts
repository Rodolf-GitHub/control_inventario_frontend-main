import { apiRequest } from '../api-client';
import { Producto, ProductoIn, ProductoUpdate } from '../types';

export async function listarProductos(proveedorId: number): Promise<Producto[]> {
  return apiRequest<Producto[]>(`/api/producto/listar/${proveedorId}/`);
}

export async function crearProducto(data: ProductoIn): Promise<Producto> {
  return apiRequest<Producto>('/api/producto/crear/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function actualizarProducto(id: number, data: ProductoUpdate): Promise<Producto> {
  return apiRequest<Producto>(`/api/producto/actualizar/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function eliminarProducto(id: number): Promise<void> {
  return apiRequest<void>(`/api/producto/eliminar/${id}/`, {
    method: 'DELETE',
  });
}

export async function moverProducto(productoId: number, direccion: 'arriba' | 'abajo') {
  return apiRequest('/api/producto/mover/', {
    method: 'POST',
    body: JSON.stringify({ producto_id: productoId, direccion }),
  });
}
