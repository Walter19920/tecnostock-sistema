import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';

import { UsuarioCreate, UsuarioItem } from '../interfaces/usuario.interface';
import { CLAVE_USUARIOS_LOCAL } from './auth.service';

const API_URL = 'http://localhost:8000';

/** Usuarios semilla predeterminados para visualización inicial si la API no está disponible */
const USUARIOS_SEMILLA: UsuarioItem[] = [
  {
    id_usuario: 1,
    username: 'admin',
    nombre_completo: 'Administrador General',
    rol: 'ADMIN',
    activo: true,
    fecha_creacion: '2026-01-15T08:00:00Z',
  },
  {
    id_usuario: 2,
    username: 'almacen',
    nombre_completo: 'Carlos Almacenero',
    rol: 'ALMACENERO',
    activo: true,
    fecha_creacion: '2026-02-01T09:30:00Z',
  },
  {
    id_usuario: 3,
    username: 'maria',
    nombre_completo: 'María Almacenera',
    rol: 'ALMACENERO',
    activo: true,
    fecha_creacion: '2026-02-10T10:00:00Z',
  },
];

function cargarUsuariosIniciales(): UsuarioItem[] {
  try {
    const raw = localStorage.getItem(CLAVE_USUARIOS_LOCAL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return USUARIOS_SEMILLA;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);

  /** Listado reactivo de usuarios mediante Signals */
  readonly usuarios = signal<UsuarioItem[]>(cargarUsuariosIniciales());
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    // Asegurar que la semilla quede guardada en localStorage si aún no existía
    if (!localStorage.getItem(CLAVE_USUARIOS_LOCAL)) {
      this.guardarEnLocalStorage(this.usuarios());
    }
  }

  /** Métricas computadas */
  readonly total = computed(() => this.usuarios().length);
  readonly totalAdmins = computed(
    () =>
      this.usuarios().filter(
        (u) => u.rol.toUpperCase() === 'ADMIN' || u.rol.toLowerCase().includes('administrador'),
      ).length,
  );
  readonly totalAlmaceneros = computed(
    () =>
      this.usuarios().filter(
        (u) => u.rol.toUpperCase() === 'ALMACENERO' || u.rol.toLowerCase().includes('almacenero'),
      ).length,
  );

  /**
   * GET /usuarios/
   * Consume la API para listar todos los usuarios registrados.
   */
  listar(): Observable<UsuarioItem[]> {
    this.cargando.set(true);
    this.error.set(null);

    return this.http.get<UsuarioItem[]>(`${API_URL}/usuarios/`).pipe(
      tap({
        next: (lista) => {
          if (Array.isArray(lista) && lista.length > 0) {
            this.usuarios.set(lista);
            this.guardarEnLocalStorage(lista);
          }
          this.cargando.set(false);
        },
      }),
      catchError((err: HttpErrorResponse) => {
        this.cargando.set(false);
        if (err.status === 404 || err.status === 0) {
          // Endpoint aún no expuesto o backend offline: mantener datos locales
          return of(this.usuarios());
        }
        this.error.set(
          err.error?.detail || 'No se pudo cargar la lista de usuarios. Inténtalo más tarde.',
        );
        return throwError(() => err);
      }),
    );
  }

  /** Alias para compatibilidad de nomenclatura */
  obtenerTodos(): Observable<UsuarioItem[]> {
    return this.listar();
  }

  /**
   * POST /usuarios/
   * Registra un nuevo trabajador en el sistema y actualiza el Signal y localStorage.
   */
  registrar(nuevoUsuario: UsuarioCreate): Observable<UsuarioItem> {
    this.cargando.set(true);
    this.error.set(null);

    return this.http.post<UsuarioItem>(`${API_URL}/usuarios/`, nuevoUsuario).pipe(
      tap({
        next: (creado) => {
          this.usuarios.update((actuales) => {
            const actualizados = [...actuales, creado];
            this.guardarEnLocalStorage(actualizados);
            return actualizados;
          });
          this.cargando.set(false);
        },
      }),
      catchError((err: HttpErrorResponse) => {
        this.cargando.set(false);
        // Si el endpoint devuelve 404/400/0 creamos el registro localmente
        if (err.status === 404 || err.status === 400 || err.status === 0) {
          const fallback: UsuarioItem = {
            id_usuario: this.generarIdTemporal(),
            username: nuevoUsuario.username.trim(),
            nombre_completo: nuevoUsuario.nombre_completo.trim(),
            rol: nuevoUsuario.rol,
            activo: true,
            fecha_creacion: new Date().toISOString(),
          };
          this.usuarios.update((actuales) => {
            const actualizados = [...actuales, fallback];
            this.guardarEnLocalStorage(actualizados);
            return actualizados;
          });
          return of(fallback);
        }

        const mensaje = err.error?.detail || 'No se pudo registrar el usuario en el servidor.';
        this.error.set(mensaje);
        return throwError(() => err);
      }),
    );
  }

  /** Alias para compatibilidad de nomenclatura */
  crear(nuevoUsuario: UsuarioCreate): Observable<UsuarioItem> {
    return this.registrar(nuevoUsuario);
  }

  /** Cambiar estado activo / inactivo localmente */
  cambiarEstado(idUsuario: number): void {
    this.usuarios.update((lista) => {
      const actualizados = lista.map((u) =>
        u.id_usuario === idUsuario ? { ...u, activo: !u.activo } : u,
      );
      this.guardarEnLocalStorage(actualizados);
      return actualizados;
    });
  }

  limpiarError(): void {
    this.error.set(null);
  }

  private guardarEnLocalStorage(lista: UsuarioItem[]): void {
    try {
      localStorage.setItem(CLAVE_USUARIOS_LOCAL, JSON.stringify(lista));
    } catch {}
  }

  private generarIdTemporal(): number {
    const ids = this.usuarios().map((u) => u.id_usuario);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }
}
