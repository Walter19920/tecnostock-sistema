import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { Producto, ProductoCreate, ProductoUpdate } from '../interfaces/producto.interface';
import { Paginacion, ParametrosPaginacion } from '../interfaces/paginacion.interface';

const API_URL = 'http://localhost:8000';
const CLAVE_IMAGENES_LOCAL = 'tecnostock_productos_imagenes';

/**
 * URLs de demostración predeterminadas para los productos iniciales del sistema.
 */
const IMAGENES_SEMILLA: Record<string, string> = {
  'PROD-001':
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=240&auto=format&fit=crop&q=80',
  'PROD-002':
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=240&auto=format&fit=crop&q=80',
  'PROD-003':
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=240&auto=format&fit=crop&q=80',
};

function leerImagenesLocales(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CLAVE_IMAGENES_LOCAL);
    return raw ? { ...IMAGENES_SEMILLA, ...JSON.parse(raw) } : { ...IMAGENES_SEMILLA };
  } catch {
    return { ...IMAGENES_SEMILLA };
  }
}

function guardarImagenLocal(idOcodigo: string | number, url: string | null | undefined): void {
  try {
    const mapa = leerImagenesLocales();
    const clave = String(idOcodigo).trim();
    if (url && url.trim()) {
      mapa[clave] = url.trim();
    } else {
      delete mapa[clave];
    }
    localStorage.setItem(CLAVE_IMAGENES_LOCAL, JSON.stringify(mapa));
  } catch {}
}

function enriquecerProducto(producto: Producto): Producto {
  const mapa = leerImagenesLocales();
  const url =
    producto.imagenUrl ||
    producto.imagen_url ||
    mapa[String(producto.id_producto)] ||
    mapa[producto.codigo] ||
    null;

  return {
    ...producto,
    imagenUrl: url,
    imagen_url: url,
  };
}

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
            const enriquecidos = pagina.items.map(enriquecerProducto);
            this.productos.set(enriquecidos);
            this.total.set(pagina.total_registros);
            this.cargando.set(false);
          },
          error: (err: HttpErrorResponse) => {
            this.cargando.set(false);
            this.error.set(
              err.status === 0
                ? 'No se pudo conectar con el backend (localhost:8000).'
                : 'No se pudieron cargar los productos.',
            );
          },
        }),
      );
  }

  /** GET /productos/{id_producto} */
  obtenerPorId(idProducto: number): Observable<Producto> {
    return this.http
      .get<Producto>(`${API_URL}/productos/${idProducto}`)
      .pipe(tap({ next: (p) => enriquecerProducto(p) }));
  }

  /** POST /productos/ — añade el nuevo producto al listado y persiste su imagen. */
  crear(producto: ProductoCreate): Observable<Producto> {
    this.error.set(null);

    const urlImagen = producto.imagenUrl || producto.imagen_url || null;

    return this.http.post<Producto>(`${API_URL}/productos/`, producto).pipe(
      tap({
        next: (nuevo) => {
          if (urlImagen) {
            guardarImagenLocal(nuevo.id_producto, urlImagen);
            guardarImagenLocal(nuevo.codigo, urlImagen);
          }
          const nuevoEnriquecido = enriquecerProducto({
            ...nuevo,
            imagenUrl: urlImagen,
            imagen_url: urlImagen,
          });
          this.productos.set([...this.productos(), nuevoEnriquecido]);
          this.total.update((t) => t + 1);
        },
        error: () => this.error.set('No se pudo crear el producto.'),
      }),
    );
  }

  /** PUT /productos/ — actualiza (el id viaja en el cuerpo; no modifica stock). */
  actualizar(producto: ProductoUpdate): Observable<Producto> {
    this.error.set(null);

    const urlImagen = producto.imagenUrl || producto.imagen_url || null;
    guardarImagenLocal(producto.id_producto, urlImagen);
    guardarImagenLocal(producto.codigo, urlImagen);

    return this.http.put<Producto>(`${API_URL}/productos/`, producto).pipe(
      tap({
        next: (actualizado) => {
          const enriquecido = enriquecerProducto({
            ...actualizado,
            imagenUrl: urlImagen,
            imagen_url: urlImagen,
          });
          this.productos.set(
            this.productos().map((p) =>
              p.id_producto === enriquecido.id_producto ? enriquecido : p,
            ),
          );
        },
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
