/** Credenciales enviadas a POST /auth/login (form-urlencoded OAuth2). */
export interface LoginRequest {
  username: string;
  password: string;
}

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
