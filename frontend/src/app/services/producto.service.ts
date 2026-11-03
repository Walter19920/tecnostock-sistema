import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import {
  Producto,
  ProductoCreate,
  ProductoUpdate,
} from '../interfaces/producto.interface';
import { Paginacion, ParametrosPaginacion } from '../interfaces/paginacion.interface';

const API_URL = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);

  readonly productos = signal<Producto[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  /** GET /productos/ — paginado (pagina, tamanio_pagina, busqueda). */
  obtenerTodos(params: ParametrosPaginacion = {}): Observable<Paginacion<Producto>> {
    this.cargando.set(true);
    this.error.set(null);

    return this.http
      .get<Paginacion<Producto>>(`${API_URL}/productos/`, {
        params: this.construirParams(params),
      })
      .pipe(
        tap({
          next: (pagina) => {
            this.productos.set(pagina.items);
            this.total.set(pagina.total_registros);
            this.cargando.set(false);
          },
          error: () => {
            this.cargando.set(false);
            this.error.set('No se pudieron cargar los productos.');
          },
        }),
      );
  }

  /** GET /productos/{id_producto} */
  obtenerPorId(idProducto: number): Observable<Producto> {
    return this.http.get<Producto>(`${API_URL}/productos/${idProducto}`);
  }

  /** POST /productos/ — añade el nuevo producto al listado. */
  crear(producto: ProductoCreate): Observable<Producto> {
    this.error.set(null);

    return this.http.post<Producto>(`${API_URL}/productos/`, producto).pipe(
      tap({
        next: (nuevo) => {
          this.productos.set([...this.productos(), nuevo]);
          this.total.update((t) => t + 1);
        },
        error: () => this.error.set('No se pudo crear el producto.'),
      }),
    );
  }

  /** PUT /productos/ — actualiza (el id viaja en el cuerpo; no modifica stock). */
  actualizar(producto: ProductoUpdate): Observable<Producto> {
    this.error.set(null);

    return this.http.put<Producto>(`${API_URL}/productos/`, producto).pipe(
      tap({
        next: (actualizado) =>
          this.productos.set(
            this.productos().map((p) =>
              p.id_producto === actualizado.id_producto ? actualizado : p,
            ),
          ),
        error: () => this.error.set('No se pudo actualizar el producto.'),
      }),
    );
  }

  /** PATCH /productos/{id_producto}/desactivar — baja lógica del producto. */
  desactivar(idProducto: number): Observable<Record<string, unknown>> {
    this.error.set(null);

    return this.http
      .patch<Record<string, unknown>>(`${API_URL}/productos/${idProducto}/desactivar`, {})
      .pipe(
        tap({
          next: () =>
            this.productos.set(
              this.productos().map((p) =>
                p.id_producto === idProducto ? { ...p, activo: false } : p,
              ),
            ),
          error: () => this.error.set('No se pudo desactivar el producto.'),
        }),
      );
  }

  private construirParams(params: ParametrosPaginacion): HttpParams {
    let httpParams = new HttpParams();
    if (params.pagina !== undefined) {
      httpParams = httpParams.set('pagina', params.pagina);
    }
    if (params.tamanio_pagina !== undefined) {
      httpParams = httpParams.set('tamanio_pagina', params.tamanio_pagina);
    }
    if (params.busqueda) {
      httpParams = httpParams.set('busqueda', params.busqueda);
    }
    return httpParams;
  }
}
