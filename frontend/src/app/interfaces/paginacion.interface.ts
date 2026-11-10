/** Respuesta paginada estándar de la API (schema PaginacionResponse). */
export interface Paginacion<T> {
  items: T[];
  pagina: number;
  tamanio_pagina: number;
  total_registros: number;
  total_paginas: number;
}

/** Parámetros de consulta para endpoints paginados. */
export interface ParametrosPaginacion {
  pagina?: number;
  tamanio_pagina?: number;
  busqueda?: string;
  solo_activos?: boolean;
}
