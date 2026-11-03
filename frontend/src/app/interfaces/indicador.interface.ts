/** KPIs del dashboard (schema IndicadorDashboard). */
export interface IndicadorDashboard {
  total_productos: number;
  total_entradas_mes: number;
  total_salidas_mes: number;
  valor_inventario: number;
  productos_stock_bajo: number;
}

/** Producto con stock por debajo del mínimo (schema ProductoStockBajoOut). */
export interface ProductoStockBajo {
  id_producto: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  categoria: string;
}
