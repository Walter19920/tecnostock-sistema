/** Tipo de movimiento de stock (schema MovimientoOut: "ENTRADA" | "SALIDA"). */
export type TipoMovimiento = 'ENTRADA' | 'SALIDA';

/** Movimiento de inventario (schema MovimientoOut). */
export interface Movimiento {
  id_movimiento: number;
  tipo: TipoMovimiento;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  fecha: string;
  usuario: string;
  observacion: string | null;
}

/** Payload para registrar una entrada (schema EntradaCreate). */
export interface EntradaCreate {
  id_producto: number;
  cantidad: number;
  precio_compra: number;
  observacion?: string | null;
}

/** Payload para registrar una salida (schema SalidaCreate). */
export interface SalidaCreate {
  id_producto: number;
  cantidad: number;
  precio_venta: number;
  observacion?: string | null;
}

/** Filtros de consulta de movimientos (endpoint GET /movimientos/). */
export interface ParametrosMovimiento {
  pagina?: number;
  tamanio_pagina?: number;
  tipo?: TipoMovimiento;
  id_producto?: number;
}
