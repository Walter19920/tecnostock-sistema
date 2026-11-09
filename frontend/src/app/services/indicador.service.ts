import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { IndicadorDashboard, ProductoStockBajo } from '../interfaces/indicador.interface';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class IndicadorService {
  private readonly http = inject(HttpClient);

  readonly dashboard = signal<IndicadorDashboard | null>(null);
  readonly stockBajo = signal<ProductoStockBajo[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  /** GET /indicadores/dashboard — KPIs principales. */
  obtenerDashboard(): Observable<IndicadorDashboard> {
    this.cargando.set(true);
    this.error.set(null);

    return this.http.get<IndicadorDashboard>(`${API_URL}/indicadores/dashboard`).pipe(
      tap({
        next: (respuesta) => {
          this.dashboard.set(respuesta);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.cargando.set(false);
          this.error.set(
            err.status === 0
              ? 'No se pudo conectar con el backend (localhost:8000).'
              : 'No se pudieron cargar los indicadores.',
          );
        },
      }),
    );
  }

  /** GET /indicadores/stock-bajo — productos bajo el stock mínimo. */
  obtenerStockBajo(): Observable<ProductoStockBajo[]> {
    this.error.set(null);

    return this.http.get<ProductoStockBajo[]>(`${API_URL}/indicadores/stock-bajo`).pipe(
      tap({
        next: (lista) => this.stockBajo.set(lista),
        error: (err: HttpErrorResponse) =>
          this.error.set(
            err.status === 0
              ? 'No se pudo conectar con el backend (localhost:8000).'
              : 'No se pudo cargar el stock bajo.',
          ),
      }),
    );
  }
}
