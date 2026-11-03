/** Credenciales enviadas a POST /auth/login (form-urlencoded OAuth2). */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Roles soportados por la interfaz. El backend devuelve el campo `rol`
 * del usuario (p. ej. 'ADMIN' o 'ALMACENERO'); estos son los valores
 * normalizados que usa el frontend para separar las vistas.
 */
export type Rol = 'ADMIN' | 'ALMACENERO';

export const ROL_ADMIN: Rol = 'ADMIN';
export const ROL_ALMACENERO: Rol = 'ALMACENERO';

/** Nombre visible de cada rol en la UI. */
export const ETIQUETA_ROL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  ALMACENERO: 'Almacenero',
};

/** Datos públicos del usuario autenticado (schema UsuarioOut). */
export interface Usuario {
  id_usuario: number;
  username: string;
  nombre: string;
  rol: string;
}

/** Respuesta JWT de /auth/login (schema TokenResponse). */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}
