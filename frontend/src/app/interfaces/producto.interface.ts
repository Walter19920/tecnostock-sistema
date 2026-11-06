/** Producto del inventario (schema ProductoOut). */
export interface Producto {
  id_producto: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  id_categoria: number;
  categoria: string;
  precio_compra: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
  imagenUrl?: string | null;
  imagen_url?: string | null;
}

/** Payload para crear un producto (schema ProductoCreate). */
export interface ProductoCreate {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  id_categoria: number;
  precio_compra: number;
  precio_venta: number;
  stock_inicial?: number;
  stock_minimo: number;
  imagenUrl?: string | null;
  imagen_url?: string | null;
}

/** Payload para actualizar un producto (schema ProductoUpdate; no modifica stock). */
export interface ProductoUpdate {
  id_producto: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  id_categoria: number;
  precio_compra: number;
  precio_venta: number;
  stock_minimo: number;
  imagenUrl?: string | null;
  imagen_url?: string | null;
}
