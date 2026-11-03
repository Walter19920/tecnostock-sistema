import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';

import { UsuarioCreate, UsuarioItem } from '../interfaces/usuario.interface';

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
];

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);

  /** Listado reactivo de usuarios mediante Signals */
  readonly usuarios = signal<UsuarioItem[]>(USUARIOS_SEMILLA);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

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
   * Registra un nuevo trabajador en el sistema y actualiza el Signal.
   */
  registrar(nuevoUsuario: UsuarioCreate): Observable<UsuarioItem> {
    this.cargando.set(true);
    this.error.set(null);

    return this.http.post<UsuarioItem>(`${API_URL}/usuarios/`, nuevoUsuario).pipe(
      tap({
        next: (creado) => {
          this.usuarios.update((actuales) => [...actuales, creado]);
          this.cargando.set(false);
        },
      }),
      catchError((err: HttpErrorResponse) => {
        this.cargando.set(false);
        // Si el endpoint devuelve 404 (aún no en backend) creamos el registro localmente
        if (err.status === 404 || err.status === 0) {
          const fallback: UsuarioItem = {
            id_usuario: this.generarIdTemporal(),
            username: nuevoUsuario.username.trim(),
            nombre_completo: nuevoUsuario.nombre_completo.trim(),
            rol: nuevoUsuario.rol,
            activo: true,
            fecha_creacion: new Date().toISOString(),
          };
          this.usuarios.update((actuales) => [...actuales, fallback]);
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
    this.usuarios.update((lista) =>
      lista.map((u) => (u.id_usuario === idUsuario ? { ...u, activo: !u.activo } : u)),
    );
  }

  limpiarError(): void {
    this.error.set(null);
  }

  private generarIdTemporal(): number {
    const ids = this.usuarios().map((u) => u.id_usuario);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }
}
