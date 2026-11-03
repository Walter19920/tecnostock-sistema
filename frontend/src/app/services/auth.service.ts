import { Injectable, computed, inject, signal } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import {
  AuthResponse,
  ETIQUETA_ROL,
  ROL_ADMIN,
  ROL_ALMACENERO,
  Rol,
  Usuario,
} from '../interfaces/auth.interface';

const API_URL = 'http://localhost:8000';
/** Clave de almacenamiento del token en localStorage. */
export const CLAVE_TOKEN = 'token';
const CLAVE_TOKEN_LEGADO = 'tecnostock_token';
const CLAVE_USUARIO = 'tecnostock_usuario';
/** Clave del rol activo elegido/guardado en el frontend. */
export const CLAVE_ROL = 'tecnostock_rol';

/**
 * Normaliza el `rol` crudo devuelto por el backend (p. ej. 'ADMIN',
 * 'Administrador General', 'ALMACENERO') a un Rol conocido por la UI.
 * Devuelve null si el valor no corresponde a ninguno de los dos roles.
 */
export function normalizarRol(rol: string | null | undefined): Rol | null {
  if (!rol) {
    return null;
  }
  const valor = rol.trim().toLowerCase();
  if (valor === 'admin' || valor.startsWith('administrador')) {
    return ROL_ADMIN;
  }
  if (valor === 'almacenero') {
    return ROL_ALMACENERO;
  }
  return null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  /** Token JWT persistido en localStorage (señal de estado de autenticación). */
  readonly token = signal<string | null>(this.leerToken());
  /** Usuario autenticado persistido en localStorage. */
  readonly usuario = signal<Usuario | null>(this.leerUsuario());
  /** Rol activo en el frontend (derivado del usuario devuelto por el backend). */
  readonly rol = signal<Rol | null>(this.leerRol());
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  /** true cuando hay token guardado. */
  readonly autenticado = computed(() => this.token() !== null);
  readonly esAdmin = computed(() => this.rol() === ROL_ADMIN);
  readonly esAlmacenero = computed(() => this.rol() === ROL_ALMACENERO);
  readonly etiquetaRol = computed(() => (this.rol() ? ETIQUETA_ROL[this.rol()!] : 'Sin rol'));
  /** Ruta de inicio según el rol activo (/admin o /almacen). */
  readonly rutaInicio = computed(() => (this.esAlmacenero() ? '/almacen' : '/admin'));

  /**
   * POST /auth/login — OAuth2 form-urlencoded (username/password vía HttpParams).
   * Guarda access_token en localStorage bajo la clave `token` y actualiza la Signal.
   * El rol activo se resuelve con el que devuelve el backend.
   * Errores 401/422/0 se traducen a un mensaje legible en la Signal `error`.
   */
  login(usuario: string, password: string): Observable<AuthResponse> {
    this.cargando.set(true);
    this.error.set(null);

    const body = new HttpParams().set('username', usuario).set('password', password);

    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, body, {
        headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
      })
      .pipe(
        tap({
          next: (respuesta) => {
            const rolResuelto = normalizarRol(respuesta.usuario?.rol) ?? ROL_ADMIN;
            localStorage.setItem(CLAVE_TOKEN, respuesta.access_token);
            localStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
            localStorage.setItem(CLAVE_ROL, rolResuelto);
            this.token.set(respuesta.access_token);
            this.usuario.set(respuesta.usuario);
            this.rol.set(rolResuelto);
            this.cargando.set(false);
          },
          error: (err: HttpErrorResponse) => {
            this.cargando.set(false);
            this.error.set(this.mensajeError(err));
          },
        }),
      );
  }

  /** Cierra la sesión y limpia localStorage. */
  logout(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_TOKEN_LEGADO);
    localStorage.removeItem(CLAVE_USUARIO);
    localStorage.removeItem(CLAVE_ROL);
    this.token.set(null);
    this.usuario.set(null);
    this.rol.set(null);
  }

  /** Limpia el mensaje de error (al volver a escribir en el formulario). */
  limpiarError(): void {
    this.error.set(null);
  }

  /** Traduce la respuesta HTTP de error a un mensaje amigable para el login. */
  private mensajeError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'No se pudo conectar con el backend (http://localhost:8000). Verifica que esté en ejecución.';
    }
    const detalle = err.error?.detail;
    if (typeof detalle === 'string' && detalle.trim()) {
      return detalle; // 401 "Credenciales incorrectas", 500 con detalle, etc.
    }
    if (err.status === 401) {
      return 'Usuario o contraseña incorrectos.';
    }
    if (err.status === 422) {
      return 'Datos de inicio de sesión inválidos.';
    }
    return `Error del servidor (${err.status}). Inténtalo de nuevo.`;
  }

  /** Lee el token; migra la clave antigua `tecnostock_token` si existía. */
  private leerToken(): string | null {
    const token = localStorage.getItem(CLAVE_TOKEN);
    if (token) {
      return token;
    }
    const legado = localStorage.getItem(CLAVE_TOKEN_LEGADO);
    if (legado) {
      localStorage.setItem(CLAVE_TOKEN, legado);
      localStorage.removeItem(CLAVE_TOKEN_LEGADO);
      return legado;
    }
    return null;
  }

  private leerUsuario(): Usuario | null {
    const crudo = localStorage.getItem(CLAVE_USUARIO);
    if (!crudo) {
      return null;
    }
    try {
      return JSON.parse(crudo) as Usuario;
    } catch {
      return null;
    }
  }

  /** Lee el rol guardado; si no existe, lo deriva del usuario persistido. */
  private leerRol(): Rol | null {
    const guardado = normalizarRol(localStorage.getItem(CLAVE_ROL));
    if (guardado) {
      return guardado;
    }
    // Sesiones antiguas: se toma el rol del usuario guardado en localStorage.
    return normalizarRol(this.leerUsuario()?.rol);
  }
}
