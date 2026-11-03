/** Categoría de productos (schema CategoriaOut). */
export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

/** Payload para crear una categoría (schema CategoriaCreate). */
export interface CategoriaCreate {
  nombre: string;
  descripcion?: string | null;
}

/** Payload para actualizar una categoría (schema CategoriaUpdate). */
export interface CategoriaUpdate {
  id_categoria: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}
