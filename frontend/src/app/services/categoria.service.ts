import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import {
  Categoria,
  CategoriaCreate,
  CategoriaUpdate,
} from '../interfaces/categoria.interface';

const API_URL = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);

  readonly categorias = signal<Categoria[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  /** GET /categorias/ — lista de categorías activas. */
  obtenerTodas(): Observable<Categoria[]> {
    this.cargando.set(true);
    this.error.set(null);

    return this.http.get<Categoria[]>(`${API_URL}/categorias/`).pipe(
      tap({
        next: (lista) => {
          this.categorias.set(lista);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('No se pudieron cargar las categorías.');
        },
      }),
    );
  }

  /** POST /categorias/ — añade la nueva categoría al listado. */
  crear(categoria: CategoriaCreate): Observable<Categoria> {
    this.error.set(null);

    return this.http.post<Categoria>(`${API_URL}/categorias/`, categoria).pipe(
      tap({
        next: (nueva) => this.categorias.set([...this.categorias(), nueva]),
        error: () => this.error.set('No se pudo crear la categoría.'),
      }),
    );
  }

  /** PUT /categorias/ — actualiza (el id viaja en el cuerpo). */
  actualizar(categoria: CategoriaUpdate): Observable<Categoria> {
    this.error.set(null);

    return this.http.put<Categoria>(`${API_URL}/categorias/`, categoria).pipe(
      tap({
        next: (actualizada) =>
          this.categorias.set(
            this.categorias().map((c) =>
              c.id_categoria === actualizada.id_categoria ? actualizada : c,
            ),
          ),
        error: () => this.error.set('No se pudo actualizar la categoría.'),
      }),
    );
  }
}
