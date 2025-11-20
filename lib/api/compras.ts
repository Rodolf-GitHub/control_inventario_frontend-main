import { apiRequest } from '../api-client';
import { Compra, CompraIn, DetalleCompra, DetalleCompraUpdate } from '../types';

export async function crearCompra(data: CompraIn): Promise<Compra> {
  return apiRequest<Compra>('/api/compra/crear/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function editarDetalle(detalleId: number, data: DetalleCompraUpdate): Promise<DetalleCompra> {
  return apiRequest<DetalleCompra>(`/api/compra/detalle/editar/${detalleId}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function crearDetalle(compraId: number, data: { producto_id: number; cantidad: number; inventario_anterior: number; }): Promise<DetalleCompra> {
  return apiRequest<DetalleCompra>(`/api/compra/detalle/crear/${compraId}/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function eliminarDetalle(detalleId: number): Promise<void> {
  return apiRequest<void>(`/api/compra/detalle/eliminar/${detalleId}/`, {
    method: 'DELETE',
  });
}

export async function comprasPorRango(
  fechaInicio?: string,
  fechaFin?: string,
  limit: number = 3,
  tiendaId?: number,
  proveedorId?: number,
  order: string = 'asc'
): Promise<Compra[]> {
  const params = new URLSearchParams();
  if (fechaInicio) params.append('fecha_inicio', fechaInicio);
  if (fechaFin) params.append('fecha_fin', fechaFin);
  params.append('limit', limit.toString());
  if (order) params.append('order', order);

  // New route: /api/compra/rango/{proveedor_id}/
  if (typeof proveedorId === 'number') {
    return apiRequest<Compra[]>(`/api/compra/rango/${proveedorId}/?${params.toString()}`);
  }

  // Fallback if no proveedor selected (empty list or throw)
  return Promise.resolve([]);
}

export async function eliminarCompra(compraId: number): Promise<void> {
  return apiRequest<void>(`/api/compra/eliminar/${compraId}/`, {
    method: 'DELETE',
  });
}
