import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import {
  EntradaCreate,
  Movimiento,
  ParametrosMovimiento,
  SalidaCreate,
} from '../interfaces/movimiento.interface';
import { Paginacion } from '../interfaces/paginacion.interface';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class MovimientoService {
  private readonly http = inject(HttpClient);

  readonly movimientos = signal<Movimiento[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  /** GET /movimientos/ — paginado con filtros (requiere Bearer; lo adjunta el interceptor). */
  obtenerTodos(params: ParametrosMovimiento = {}): Observable<Paginacion<Movimiento>> {
    this.cargando.set(true);
    this.error.set(null);

    return this.http
      .get<Paginacion<Movimiento>>(`${API_URL}/movimientos/`, {
        params: this.construirParams(params),
      })
      .pipe(
        tap({
          next: (pagina) => {
            this.movimientos.set(pagina.items);
            this.cargando.set(false);
          },
          error: (err: HttpErrorResponse) => {
            this.cargando.set(false);
            this.error.set(
              err.status === 0
                ? 'No se pudo conectar con el backend (localhost:8000).'
                : 'No se pudieron cargar los movimientos.',
            );
          },
        }),
      );
  }

  /** POST /movimientos/entrada — incrementa stock (requiere Bearer). */
  registrarEntrada(registro: EntradaCreate): Observable<Movimiento> {
    this.error.set(null);

    return this.http.post<Movimiento>(`${API_URL}/movimientos/entrada`, registro).pipe(
      tap({
        next: (nuevo) => this.movimientos.set([nuevo, ...this.movimientos()]),
        error: () => this.error.set('No se pudo registrar la entrada.'),
      }),
    );
  }

  /** POST /movimientos/salida — decrementa stock (requiere Bearer). */
  registrarSalida(registro: SalidaCreate): Observable<Movimiento> {
    this.error.set(null);

    return this.http.post<Movimiento>(`${API_URL}/movimientos/salida`, registro).pipe(
      tap({
        next: (nuevo) => this.movimientos.set([nuevo, ...this.movimientos()]),
        error: () => this.error.set('No se pudo registrar la salida.'),
      }),
    );
  }

  private construirParams(params: ParametrosMovimiento): HttpParams {
    let httpParams = new HttpParams();
    if (params.pagina !== undefined) {
      httpParams = httpParams.set('pagina', params.pagina);
    }
    if (params.tamanio_pagina !== undefined) {
      httpParams = httpParams.set('tamanio_pagina', params.tamanio_pagina);
    }
    if (params.tipo) {
      httpParams = httpParams.set('tipo', params.tipo);
    }
    if (params.id_producto !== undefined) {
      httpParams = httpParams.set('id_producto', params.id_producto);
    }
    return httpParams;
  }
}
