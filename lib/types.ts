export interface Tienda {
  id?: number;
  nombre: string;
}

export interface TiendaIn {
  nombre: string;
}

export interface Proveedor {
  id?: number;
  nombre: string;
  tienda: number;
}

export interface ProveedorIn {
  nombre: string;
  tienda_id: number;
}

export interface ProveedorUpdate {
  nombre: string;
}

export interface Producto {
  id?: number;
  nombre: string;
  proveedor: number;
}

export interface ProductoIn {
  nombre: string;
  proveedor_id: number;
}

export interface ProductoUpdate {
  nombre: string;
}

export interface DetalleCompra {
  producto_nombre?: string | null;
  id?: number;
  compra: number;
  producto: number;
  cantidad: number;
  inventario_anterior: number;
}

export interface DetalleCompraUpdate {
  cantidad?: number;
  inventario_anterior?: number;
}

export interface Compra {
  id?: number;
  proveedor: number;
  fecha_compra: string;
  detalles: DetalleCompra[];
}

export interface CompraIn {
  proveedor_id: number;
  fecha_compra: string;
}
