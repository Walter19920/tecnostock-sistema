import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import {
  Categoria,
  CategoriaCreate,
  CategoriaUpdate,
} from '../../interfaces/categoria.interface';
import { AuthService } from '../../services/auth.service';
import { CategoriaService } from '../../services/categoria.service';
import { mensajeError, soloEspacios } from '../../utils/validaciones';

/** Etiqueta legible de cada campo para los mensajes de validación. */
const ETIQUETAS: Record<string, string> = {
  nombre: 'El nombre',
  descripcion: 'La descripción',
};

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="container-fluid py-4 px-4">
      <!-- CABECERA DE LA VISTA -->
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div class="d-flex align-items-center gap-2">
            <h1 class="h3 fw-bold text-dark mb-0">Categorías</h1>
            <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1">
              {{ servicio.categorias().length }} registradas
            </span>
          </div>
          <p class="text-muted small mb-0 mt-1">Gestiona las agrupaciones e inventario de tus productos</p>
        </div>

        <button class="btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm" type="button" (click)="abrirNuevo()">
          <i class="bi bi-plus-lg"></i>
          <span>Nueva categoría</span>
        </button>
      </div>

      <!-- ALERTA DE ERROR -->
      @if (servicio.error()) {
        <div class="alert alert-danger border-0 shadow-sm d-flex align-items-center mb-4 rounded-3" role="alert">
          <i class="bi bi-exclamation-triangle-fill fs-5 me-2"></i>
          <div>{{ servicio.error() }}</div>
        </div>
      }

      <!-- TABLA DE CATEGORÍAS -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light border-bottom">
                <tr>
                  <th scope="col" class="ps-4 py-3 text-muted text-uppercase fs-7 font-monospace" style="width: 80px;"># ID</th>
                  <th scope="col" class="py-3 text-muted text-uppercase fs-7">Nombre</th>
                  <th scope="col" class="py-3 text-muted text-uppercase fs-7">Descripción</th>
                  <th scope="col" class="py-3 text-muted text-uppercase fs-7">Estado</th>
                  <th scope="col" class="pe-4 py-3 text-end text-muted text-uppercase fs-7">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (categoria of servicio.categorias(); track categoria.id_categoria) {
                  <tr>
                    <!-- ID -->
                    <td class="ps-4 font-monospace text-muted small fw-semibold">
                      #{{ categoria.id_categoria.toString().padStart(3, '0') }}
                    </td>

                    <!-- NOMBRE E ICONO -->
                    <td>
                      <div class="d-flex align-items-center gap-3">
                        <div class="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                          <i class="bi bi-tag-fill fs-6"></i>
                        </div>
                        <span class="fw-bold text-dark">{{ categoria.nombre }}</span>
                      </div>
                    </td>

                    <!-- DESCRIPCIÓN -->
                    <td>
                      <span class="text-secondary small">
                        {{ categoria.descripcion || 'Sin descripción asignada' }}
                      </span>
                    </td>

                    <!-- ESTADO BADGE -->
                    <td>
                      @if (categoria.activo) {
                        <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1.5">
                          <span class="spinner-grow spinner-grow-sm p-0 m-0" style="width: 6px; height: 6px;" role="status"></span>
                          Activa
                        </span>
                      } @else {
                        <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1.5">
                          <span class="rounded-circle bg-secondary d-inline-block" style="width: 6px; height: 6px;"></span>
                          Inactiva
                        </span>
                      }
                    </td>

                    <!-- BOTÓN EDITAR -->
                    <td class="pe-4 text-end">
                      <button
                        class="btn btn-light btn-sm rounded-3 border-0 shadow-sm text-muted hover-blue"
                        type="button"
                        title="Editar categoría"
                        (click)="abrirEditar(categoria)"
                      >
                        <i class="bi bi-pencil-fill"></i>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="text-center text-muted py-5">
                      @if (servicio.cargando()) {
                        <div class="d-flex flex-column align-items-center gap-2">
                          <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
                          <span class="small">Cargando categorías…</span>
                        </div>
                      } @else {
                        <div class="d-flex flex-column align-items-center gap-2 py-3">
                          <i class="bi bi-tags fs-1 text-slate-300"></i>
                          <p class="mb-0 text-secondary fw-medium">No hay categorías registradas</p>
                          <button class="btn btn-sm btn-outline-primary mt-2" (click)="abrirNuevo()">
                            Crear la primera categoría
                          </button>
                        </div>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL POP-UP EDITAR / CREAR -->
      @if (modalAbierto()) {
        <div
          class="modal fade show d-block"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          style="background-color: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px);"
        >
          <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <form
              class="modal-content border-0 shadow-lg rounded-4 overflow-hidden"
              [formGroup]="formulario"
              (ngSubmit)="guardar()"
              novalidate
            >
              
              <!-- MODAL HEADER -->
              <div class="modal-header bg-light border-bottom px-4 py-3">
                <div class="d-flex align-items-center gap-2">
                  <div class="bg-primary text-white rounded-2 p-1.5 d-flex align-items-center justify-content-center" style="width: 28px; height: 28px;">
                    <i class="bi bi-tag fs-6"></i>
                  </div>
                  <h2 class="modal-title h6 fw-bold text-dark mb-0">
                    {{ editandoId() === null ? 'Nueva Categoría' : 'Editar Categoría' }}
                  </h2>
                </div>
                <button
                  class="btn-close shadow-none"
                  type="button"
                  aria-label="Cerrar"
                  (click)="cerrarModal()"
                ></button>
              </div>

              <!-- MODAL BODY -->
              <div class="modal-body p-4">
                <div class="mb-3">
                  <label class="form-label small fw-semibold text-secondary" for="cat-nombre">Nombre de la categoría *</label>
                  <input
                    class="form-control rounded-3 py-2 px-3"
                    id="cat-nombre"
                    formControlName="nombre"
                    placeholder="Ej. Lentes de contacto, Almacenamiento..."
                    [class.is-invalid]="!!errorDe('nombre')"
                    autofocus
                  />
                  @if (errorDe('nombre'); as error) {
                    <div class="invalid-feedback d-block">{{ error }}</div>
                  }
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-semibold text-secondary" for="cat-descripcion">Descripción detallada</label>
                  <textarea
                    class="form-control rounded-3 py-2 px-3"
                    id="cat-descripcion"
                    formControlName="descripcion"
                    rows="3"
                    placeholder="Escribe un breve resumen de lo que incluye esta categoría..."
                    [class.is-invalid]="!!errorDe('descripcion')"
                  ></textarea>
                  @if (errorDe('descripcion'); as error) {
                    <div class="invalid-feedback d-block">{{ error }}</div>
                  }
                </div>

                @if (editandoId() !== null) {
                  <div class="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                    <div>
                      <label class="form-check-label fw-semibold small text-dark d-block" for="cat-activa">Estado de la categoría</label>
                      <span class="text-muted fs-7">Permite seleccionar esta categoría en productos</span>
                    </div>
                    <div class="form-check form-switch mb-0">
                      <input
                        class="form-check-input fs-5"
                        type="checkbox"
                        role="switch"
                        id="cat-activa"
                        formControlName="activo"
                      />
                    </div>
                  </div>
                }
              </div>

              <!-- MODAL FOOTER -->
              <div class="modal-footer bg-light border-top px-4 py-3">
                @if (!formularioValido()) {
                  <span class="small text-muted me-auto">
                    <i class="bi bi-info-circle me-1"></i>Completa los campos obligatorios
                  </span>
                }
                <button class="btn btn-outline-secondary rounded-3 px-3 py-2 text-sm fw-semibold" type="button" (click)="cerrarModal()">
                  Cancelar
                </button>
                <button class="btn btn-primary rounded-3 px-4 py-2 text-sm fw-semibold d-inline-flex align-items-center gap-2" type="submit">
                  <i class="bi bi-check-lg"></i>
                  <span>Guardar cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class CategoriasComponent implements OnInit {
  protected readonly servicio = inject(CategoriaService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly modalAbierto = signal(false);
  protected readonly editandoId = signal<number | null>(null);

  /** Reactive Forms con Signals: validación en tiempo real de la categoría. */
  protected readonly formulario = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(120),
        soloEspacios(),
      ],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
    activo: new FormControl(true, { nonNullable: true }),
  });

  /** valueChanges del formulario expuesto como Signal. */
  private readonly cambiosFormulario = toSignal(this.formulario.valueChanges, {
    initialValue: this.formulario.getRawValue(),
  });
  /** Estado derivado del formulario (se recalcula con cada cambio). */
  protected readonly formularioValido = computed(() => {
    this.cambiosFormulario();
    return this.formulario.valid;
  });

  ngOnInit(): void {
    if (!this.auth.autenticado()) {
      void this.router.navigate(['/login']);
      return;
    }
    this.servicio.obtenerTodas().subscribe({ error: () => undefined });
  }

  /** Mensaje de validación del campo (solo si es inválido y ya fue tocado). */
  protected errorDe(nombre: 'nombre' | 'descripcion'): string | null {
    return mensajeError(this.formulario.get(nombre), ETIQUETAS[nombre] ?? 'Este campo');
  }

  abrirNuevo(): void {
    this.editandoId.set(null);
    this.formulario.reset({ nombre: '', descripcion: '', activo: true });
    this.modalAbierto.set(true);
  }

  abrirEditar(categoria: Categoria): void {
    this.editandoId.set(categoria.id_categoria);
    this.formulario.setValue({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion ?? '',
      activo: categoria.activo,
    });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { nombre, descripcion, activo } = this.formulario.getRawValue();
    const nombreLimpio = nombre.trim();
    const descripcionLimpia = descripcion.trim() || null;

    if (this.editandoId() === null) {
      const datos: CategoriaCreate = { nombre: nombreLimpio, descripcion: descripcionLimpia };
      this.servicio
        .crear(datos)
        .subscribe({ next: () => this.cerrarModal(), error: () => undefined });
      return;
    }

    const datos: CategoriaUpdate = {
      id_categoria: this.editandoId()!,
      nombre: nombreLimpio,
      descripcion: descripcionLimpia,
      activo,
    };
    this.servicio
      .actualizar(datos)
      .subscribe({ next: () => this.cerrarModal(), error: () => undefined });
  }
}