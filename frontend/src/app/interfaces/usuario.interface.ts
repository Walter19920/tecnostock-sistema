import { Rol } from './auth.interface';

/** Modelo de datos para un usuario en el sistema. */
export interface UsuarioItem {
  id_usuario: number;
  username: string;
  nombre_completo: string;
  nombre?: string;
  rol: Rol | string;
  activo: boolean;
  fecha_creacion?: string;
}

/** Payload para registrar un nuevo usuario vía POST /usuarios/. */
export interface UsuarioCreate {
  nombre_completo: string;
  username: string;
  password: string;
  rol: Rol | string;
}
