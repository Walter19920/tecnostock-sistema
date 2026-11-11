import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';

import { UsuarioCreate, UsuarioItem } from '../interfaces/usuario.interface';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);

  /** Listado reactivo de usuarios mediante Signals */
  readonly usuarios = signal<UsuarioItem[]>([]);
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
   * GET /auth/usuarios/
   * Carga la lista oficial de usuarios directamente desde la base de datos SQL Server.
   */
  listar(): Observable<UsuarioItem[]> {
    this.cargando.set(true);
    this.error.set(null);

    return this.http.get<UsuarioItem[]>(`${API_URL}/auth/usuarios`).pipe(
      tap({
        next: (lista) => {
          this.usuarios.set(lista);
          this.cargando.set(false);
        },
      }),
      catchError((err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(
          err.error?.detail || 'No se pudo cargar la lista de usuarios desde el servidor.',
        );
        return throwError(() => err);
      }),
    );
  }

  /** Alias para compatibilidad */
  obtenerTodos(): Observable<UsuarioItem[]> {
    return this.listar();
  }

  /**
   * POST /auth/usuarios/
   * Registra un nuevo trabajador en SQL Server.
   */
  registrar(nuevoUsuario: UsuarioCreate): Observable<UsuarioItem> {
    this.cargando.set(true);
    this.error.set(null);

    return this.http.post<UsuarioItem>(`${API_URL}/auth/usuarios`, nuevoUsuario).pipe(
      tap({
        next: (creado) => {
          this.usuarios.update((actuales) => [...actuales, creado]);
          this.cargando.set(false);
        },
      }),
      catchError((err: HttpErrorResponse) => {
        this.cargando.set(false);
        const mensaje = err.error?.detail || 'No se pudo registrar el usuario en el servidor.';
        this.error.set(mensaje);
        return throwError(() => err);
      }),
    );
  }

  /** Alias para compatibilidad */
  crear(nuevoUsuario: UsuarioCreate): Observable<UsuarioItem> {
    return this.registrar(nuevoUsuario);
  }

  /**
   * PATCH /auth/usuarios/{id}/estado?activo={boolean}
   * Cambia el estado (Activo/Inactivo) consumiendo el Stored Procedure en SQL Server.
   */
  cambiarEstado(idUsuario: number, activo: boolean): Observable<any> {
    return this.http
      .patch(`${API_URL}/auth/usuarios/${idUsuario}/estado?activo=${activo}`, {})
      .pipe(
        tap({
          next: () => {
            this.usuarios.update((lista) =>
              lista.map((u) => (u.id_usuario === idUsuario ? { ...u, activo } : u)),
            );
          },
        }),
      );
  }
  /**
   * PATCH /auth/usuarios/{id}/password
   * Actualiza la contraseña de un usuario ejecutando sp_CambiarPasswordUsuario.
   */
  cambiarPassword(idUsuario: number, nuevaPassword: string): Observable<any> {
    return this.http.patch(`${API_URL}/auth/usuarios/${idUsuario}/password`, {
      nueva_password: nuevaPassword,
    });
  }
  limpiarError(): void {
    this.error.set(null);
  }
}
