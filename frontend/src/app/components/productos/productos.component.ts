import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { Producto, ProductoCreate, ProductoUpdate } from '../../interfaces/producto.interface';
import { AuthService } from '../../services/auth.service';
import { CategoriaService } from '../../services/categoria.service';
import { ProductoService } from '../../services/producto.service';
import { entero, mensajeError, positivo, soloEspacios } from '../../utils/validaciones';

/** Etiqueta legible de cada campo para los mensajes de validación. */
const ETIQUETAS: Record<string, string> = {
  codigo: 'El código',
  nombre: 'El nombre',
  descripcion: 'La descripción',
  id_categoria: 'La categoría',
  precio_compra: 'El precio de compra',
  precio_venta: 'El precio de venta',
  stock_inicial: 'El stock inicial',
  stock_minimo: 'El stock mínimo',
  imagenUrl: 'La URL de la imagen',
};

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  template: `
    <div class="container-fluid py-4 px-4">
      <!-- CABECERA DE LA VISTA -->
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div class="d-flex align-items-center gap-2">
            <h1 class="h3 fw-bold text-dark mb-0">Productos</h1>
            <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1">
              {{ servicio.total() }} ítems
            </span>
          </div>
          <p class="text-muted small mb-0 mt-1">
            Gestión de inventario, precios de venta y stock mínimo
          </p>
        </div>

        <button
          class="btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm"
          type="button"
          (click)="abrirNuevo()"
        >
          <i class="bi bi-plus-lg"></i>
          <span>Nuevo producto</span>
        </button>
      </div>

      <!-- BARRA DE BÚSQUEDA FLOTANTE -->
      <div class="card border-0 shadow-sm rounded-4 mb-4">
        <div class="card-body p-2 px-3">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-search text-muted fs-5 ms-1"></i>
            <input
              class="form-control border-0 shadow-none py-2"
              id="prod-busqueda"
              placeholder="Buscar por código o nombre del producto..."
              [formControl]="busqueda"
            />
            @if (busqueda.value) {
              <button
                class="btn btn-sm btn-light text-muted rounded-circle"
                type="button"
                aria-label="Limpiar búsqueda"
                (click)="limpiarBusqueda()"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- ALERTA DE ERROR -->
      @if (servicio.error()) {
        <div
          class="alert alert-danger border-0 shadow-sm d-flex align-items-center mb-4 rounded-3"
          role="alert"
        >
          <i class="bi bi-exclamation-triangle-fill fs-5 me-2"></i>
          <div>{{ servicio.error() }}</div>
        </div>
      }

      <!-- TABLA DE PRODUCTOS -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light border-bottom">
                <tr>
                  <th scope="col" class="ps-4 py-3 text-muted text-uppercase fs-7 font-monospace">
                    Código
                  </th>
                  <th scope="col" class="py-3 text-muted text-uppercase fs-7">Producto</th>
                  <th scope="col" class="py-3 text-muted text-uppercase fs-7">Categoría</th>
                  <th scope="col" class="py-3 text-end text-muted text-uppercase fs-7">P. Venta</th>
                  <th scope="col" class="py-3 text-center text-muted text-uppercase fs-7">Stock</th>
                  <th scope="col" class="py-3 text-muted text-uppercase fs-7">Estado</th>
                  <th scope="col" class="pe-4 py-3 text-end text-muted text-uppercase fs-7">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (producto of servicio.productos(); track producto.id_producto) {
                  <tr>
                    <!-- CÓDIGO SKU -->
                    <td class="ps-4">
                      <span
                        class="badge bg-light text-secondary font-monospace border border-slate-200 px-2.5 py-1 rounded-2 fw-semibold"
                      >
                        {{ producto.codigo }}
                      </span>
                    </td>

                    <!-- NOMBRE E IMAGEN CON OBJECT-FIT Y PLACEHOLDER ALTERNATIVO -->
                    <td>
                      <div class="d-flex align-items-center gap-3">
                        <div
                          class="producto-img-box rounded-3 overflow-hidden shadow-sm d-flex align-items-center justify-content-center position-relative flex-shrink-0"
                        >
                          @if (
                            producto.imagenUrl && !imagenesConError().has(producto.id_producto)
                          ) {
                            <img
                              [src]="producto.imagenUrl"
                              [alt]="producto.nombre"
                              class="w-100 h-100 object-fit-cover rounded-3"
                              (error)="onTableImageError(producto.id_producto)"
                            />
                          } @else {
                            <div
                              class="w-100 h-100 d-flex align-items-center justify-content-center placeholder-gradiente border border-light-subtle rounded-3"
                              [title]="producto.categoria || 'Producto'"
                            >
                              <i class="bi" [class]="obtenerIconoCategoria(producto.categoria)"></i>
                            </div>
                          }
                        </div>
                        <div>
                          <span class="fw-bold text-dark d-block">{{ producto.nombre }}</span>
                          @if (producto.descripcion) {
                            <span
                              class="text-muted fs-7 d-block text-truncate"
                              style="max-width: 260px;"
                            >
                              {{ producto.descripcion }}
                            </span>
                          }
                        </div>
                      </div>
                    </td>

                    <!-- CATEGORÍA BADGE -->
                    <td>
                      <span
                        class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-3 py-1 font-medium"
                      >
                        {{ producto.categoria }}
                      </span>
                    </td>

                    <!-- PRECIO VENTA -->
                    <td class="text-end fw-bold text-dark font-monospace">
                      {{ producto.precio_venta | currency: 'PEN' : 'S/ ' }}
                    </td>

                    <!-- STOCK CON ALERTA DE STOCK BAJO -->
                    <td class="text-center">
                      @if (producto.stock_actual <= producto.stock_minimo) {
                        <span
                          class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1.5"
                        >
                          <i class="bi bi-exclamation-triangle-fill fs-7"></i>
                          <span>{{ producto.stock_actual }}</span>
                        </span>
                      } @else if (producto.stock_actual <= producto.stock_minimo * 2) {
                        <span
                          class="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25 rounded-pill px-3 py-1"
                        >
                          {{ producto.stock_actual }}
                        </span>
                      } @else {
                        <span
                          class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1"
                        >
                          {{ producto.stock_actual }}
                        </span>
                      }
                    </td>

                    <!-- ESTADO BADGE -->
                    <td>
                      @if (producto.activo) {
                        <span
                          class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5"
                        >
                          <span
                            class="rounded-circle bg-success d-inline-block"
                            style="width: 6px; height: 6px;"
                          ></span>
                          Activo
                        </span>
                      } @else {
                        <span
                          class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5"
                        >
                          <span
                            class="rounded-circle bg-secondary d-inline-block"
                            style="width: 6px; height: 6px;"
                          ></span>
                          Inactivo
                        </span>
                      }
                    </td>

                    <!-- ACCIONES -->
                    <td class="pe-4 text-end">
                      <div class="d-inline-flex gap-1">
                        <button
                          class="btn btn-light btn-sm rounded-3 border-0 shadow-sm text-muted hover-blue"
                          type="button"
                          title="Editar producto"
                          (click)="abrirEditar(producto)"
                        >
                          <i class="bi bi-pencil-fill"></i>
                        </button>
                        @if (producto.activo) {
                          <button
                            class="btn btn-light btn-sm rounded-3 border-0 shadow-sm text-muted hover-danger"
                            type="button"
                            title="Desactivar producto"
                            (click)="desactivar(producto)"
                          >
                            <i class="bi bi-slash-circle-fill text-danger text-opacity-75"></i>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="text-center text-muted py-5">
                      @if (servicio.cargando()) {
                        <div class="d-flex flex-column align-items-center gap-2">
                          <div
                            class="spinner-border text-primary spinner-border-sm"
                            role="status"
                          ></div>
                          <span class="small">Cargando productos…</span>
                        </div>
                      } @else {
                        <div class="d-flex flex-column align-items-center gap-2 py-3">
                          <i class="bi bi-box-seam fs-1 text-slate-300"></i>
                          <p class="mb-0 text-secondary fw-medium">No se encontraron productos</p>
                          <button
                            class="btn btn-sm btn-outline-primary mt-2"
                            (click)="abrirNuevo()"
                          >
                            Registrar primer producto
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
        <div
          class="card-footer bg-light border-top px-4 py-2.5 text-muted small d-flex justify-content-between align-items-center"
        >
          <span>Mostrando {{ servicio.productos().length }} registro(s)</span>
          <span class="fw-semibold text-secondary">TecnoStock Inventory System</span>
        </div>
      </div>

      <!-- MODAL POP-UP EDITAR / NUEVO PRODUCTO -->
      @if (modalAbierto()) {
        <div
          class="modal fade show d-block"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          style="background-color: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px);"
        >
          <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <form
              class="modal-content border-0 shadow-lg rounded-4 overflow-hidden"
              [formGroup]="formulario"
              (ngSubmit)="guardar()"
              novalidate
            >
              <!-- MODAL HEADER -->
              <div class="modal-header bg-light border-bottom px-4 py-3">
                <div class="d-flex align-items-center gap-2">
                  <div
                    class="bg-primary text-white rounded-2 p-1.5 d-flex align-items-center justify-content-center"
                    style="width: 28px; height: 28px;"
                  >
                    <i class="bi bi-box-seam fs-6"></i>
                  </div>
                  <h2 class="modal-title h6 fw-bold text-dark mb-0">
                    {{ editandoId() === null ? 'Nuevo Producto' : 'Editar Producto' }}
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
                <div class="row g-3">
                  <div class="col-12 col-md-6">
                    <label class="form-label small fw-semibold text-secondary" for="prod-codigo"
                      >Código SKU *</label
                    >
                    <input
                      class="form-control rounded-3 py-2 px-3 font-monospace"
                      id="prod-codigo"
                      formControlName="codigo"
                      placeholder="Ej. PROD-004"
                      [class.is-invalid]="!!errorDe('codigo')"
                    />
                    @if (errorDe('codigo'); as error) {
                      <div class="invalid-feedback d-block">{{ error }}</div>
                    }
                  </div>

                  <div class="col-12 col-md-6">
                    <label class="form-label small fw-semibold text-secondary" for="prod-nombre"
                      >Nombre del producto *</label
                    >
                    <input
                      class="form-control rounded-3 py-2 px-3"
                      id="prod-nombre"
                      formControlName="nombre"
                      placeholder="Ej. Monitor LG 27 UltraGear"
                      [class.is-invalid]="!!errorDe('nombre')"
                    />
                    @if (errorDe('nombre'); as error) {
                      <div class="invalid-feedback d-block">{{ error }}</div>
                    }
                  </div>

                  <div class="col-12 col-md-6">
                    <label class="form-label small fw-semibold text-secondary" for="prod-categoria"
                      >Categoría *</label
                    >
                    <select
                      class="form-select rounded-3 py-2 px-3"
                      id="prod-categoria"
                      formControlName="id_categoria"
                      [class.is-invalid]="!!errorDe('id_categoria')"
                    >
                      <option [ngValue]="null" disabled>
                        {{
                          categorias.cargando()
                            ? 'Cargando categorías…'
                            : 'Selecciona una categoría'
                        }}
                      </option>
                      @for (categoria of categorias.categorias(); track categoria.id_categoria) {
                        <option [ngValue]="categoria.id_categoria">
                          {{ categoria.nombre }}
                        </option>
                      }
                    </select>
                    @if (errorDe('id_categoria'); as error) {
                      <div class="invalid-feedback d-block">{{ error }}</div>
                    }
                  </div>

                  <div class="col-12 col-md-6">
                    <label
                      class="form-label small fw-semibold text-secondary"
                      for="prod-descripcion"
                      >Descripción corta</label
                    >
                    <input
                      class="form-control rounded-3 py-2 px-3"
                      id="prod-descripcion"
                      formControlName="descripcion"
                      placeholder="Especificaciones o modelo..."
                      [class.is-invalid]="!!errorDe('descripcion')"
                    />
                    @if (errorDe('descripcion'); as error) {
                      <div class="invalid-feedback d-block">{{ error }}</div>
                    }
                  </div>

                  <!-- CAMPO: URL DE LA IMAGEN CON LIVE PREVIEW -->
                  <div class="col-12">
                    <label class="form-label small fw-semibold text-secondary" for="prod-imagen">
                      URL de la imagen del producto
                    </label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-image"></i></span>
                      <input
                        class="form-control rounded-end-3 py-2 px-3"
                        id="prod-imagen"
                        formControlName="imagenUrl"
                        placeholder="https://ejemplo.com/foto-producto.jpg"
                        (input)="errorImagenModal.set(false)"
                        [class.is-invalid]="!!errorDe('imagenUrl')"
                      />
                    </div>
                    @if (errorDe('imagenUrl'); as error) {
                      <div class="invalid-feedback d-block">{{ error }}</div>
                    }

                    <!-- LIVE PREVIEW DE LA IMAGEN MEDIANTE SIGNALS -->
                    <div class="mt-2.5 p-3 bg-light rounded-3 border">
                      <div class="d-flex align-items-center justify-content-between mb-2">
                        <span
                          class="small fw-semibold text-secondary d-flex align-items-center gap-1.5"
                        >
                          <i class="bi bi-eye text-primary"></i>Vista Previa en Tiempo Real
                        </span>
                        @if (imagenUrlPreview() && !errorImagenModal()) {
                          <span
                            class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-0.5"
                          >
                            <i class="bi bi-check2 me-1"></i>URL válida
                          </span>
                        }
                      </div>

                      <div class="d-flex align-items-center gap-3">
                        <div
                          class="rounded-3 border overflow-hidden shadow-sm d-flex align-items-center justify-content-center flex-shrink-0"
                          style="width: 72px; height: 72px; min-width: 72px;"
                        >
                          @if (imagenUrlPreview() && !errorImagenModal()) {
                            <img
                              [src]="imagenUrlPreview()"
                              alt="Vista previa"
                              class="w-100 h-100 object-fit-cover rounded-3"
                              (error)="onModalImageError()"
                            />
                          } @else {
                            <!-- PLACEHOLDER ALTERNATIVO CON GRADIENTE Y BORDE SUAVE -->
                            <div
                              class="w-100 h-100 d-flex flex-column align-items-center justify-content-center placeholder-gradiente p-1 text-center"
                            >
                              <i
                                class="bi"
                                [class]="iconoCategoriaActual()"
                                style="font-size: 1.4rem; color: #2563eb;"
                              ></i>
                              <span class="fs-8 text-secondary mt-0.5">Sin imagen</span>
                            </div>
                          }
                        </div>

                        <div class="small flex-grow-1">
                          @if (imagenUrlPreview() && errorImagenModal()) {
                            <div class="text-danger d-flex align-items-center gap-1.5 fw-medium">
                              <i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                              <span
                                >No se pudo cargar la imagen desde la URL. Mostrando contenedor de
                                reserva.</span
                              >
                            </div>
                          } @else if (imagenUrlPreview()) {
                            <div
                              class="text-success mb-1 fw-semibold d-flex align-items-center gap-1"
                            >
                              <i class="bi bi-check-circle-fill"></i>Previsualizando correctamente
                            </div>
                            <span
                              class="text-muted text-truncate d-block"
                              style="max-width: 380px;"
                            >
                              {{ imagenUrlPreview() }}
                            </span>
                          } @else {
                            <span class="text-muted">
                              Pega una URL (JPG, PNG, WebP) para previsualizar la fotografía del
                              producto. Si no ingresas una URL o si la imagen falla, se utilizará el
                              contenedor alternativo con gradiente y el icono de la categoría.
                            </span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="col-6 col-md-3">
                    <label class="form-label small fw-semibold text-secondary" for="prod-compra"
                      >P. Compra (S/)</label
                    >
                    <input
                      class="form-control rounded-3 py-2 px-3 font-monospace"
                      id="prod-compra"
                      formControlName="precio_compra"
                      type="number"
                      min="0"
                      step="0.01"
                      [class.is-invalid]="!!errorDe('precio_compra')"
                    />
                    @if (errorDe('precio_compra'); as error) {
                      <div class="invalid-feedback d-block">{{ error }}</div>
                    }
                  </div>

                  <div class="col-6 col-md-3">
                    <label class="form-label small fw-semibold text-secondary" for="prod-venta"
                      >P. Venta (S/) *</label
                    >
                    <input
                      class="form-control rounded-3 py-2 px-3 font-monospace"
                      id="prod-venta"
                      formControlName="precio_venta"
                      type="number"
                      min="0"
                      step="0.01"
                      [class.is-invalid]="!!errorDe('precio_venta')"
                    />
                    @if (errorDe('precio_venta'); as error) {
                      <div class="invalid-feedback d-block">{{ error }}</div>
                    }
                  </div>

                  @if (editandoId() === null) {
                    <div class="col-6 col-md-3">
                      <label class="form-label small fw-semibold text-secondary" for="prod-stock"
                        >Stock inicial</label
                      >
                      <input
                        class="form-control rounded-3 py-2 px-3 font-monospace"
                        id="prod-stock"
                        formControlName="stock_inicial"
                        type="number"
                        min="0"
                        [class.is-invalid]="!!errorDe('stock_inicial')"
                      />
                      @if (errorDe('stock_inicial'); as error) {
                        <div class="invalid-feedback d-block">{{ error }}</div>
                      }
                    </div>
                  }

                  <div class="col-6 col-md-3">
                    <label class="form-label small fw-semibold text-secondary" for="prod-minimo"
                      >Stock mínimo *</label
                    >
                    <input
                      class="form-control rounded-3 py-2 px-3 font-monospace"
                      id="prod-minimo"
                      formControlName="stock_minimo"
                      type="number"
                      min="0"
                      [class.is-invalid]="!!errorDe('stock_minimo')"
                    />
                    @if (errorDe('stock_minimo'); as error) {
                      <div class="invalid-feedback d-block">{{ error }}</div>
                    }
                  </div>
                </div>
              </div>

              <!-- MODAL FOOTER -->
              <div class="modal-footer bg-light border-top px-4 py-3">
                @if (!formularioValido()) {
                  <span class="small text-muted me-auto">
                    <i class="bi bi-info-circle me-1"></i>Completa los campos obligatorios
                  </span>
                }
                <button
                  class="btn btn-outline-secondary rounded-3 px-3 py-2 text-sm fw-semibold"
                  type="button"
                  (click)="cerrarModal()"
                >
                  Cancelar
                </button>
                <button
                  class="btn btn-primary rounded-3 px-4 py-2 text-sm fw-semibold d-inline-flex align-items-center gap-2"
                  type="submit"
                >
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
  styles: [
    `
      .producto-img-box {
        width: 42px;
        height: 42px;
        min-width: 42px;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }
      .producto-img-box:hover {
        transform: scale(1.08);
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15) !important;
      }
      .placeholder-gradiente {
        background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
      }
      .fs-7 {
        font-size: 0.75rem;
      }
      .fs-8 {
        font-size: 0.65rem;
      }
      .object-fit-cover {
        object-fit: cover !important;
      }
    `,
  ],
})
export class ProductosComponent implements OnInit {
  protected readonly servicio = inject(ProductoService);
  protected readonly categorias = inject(CategoriaService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);

  /** Búsqueda reactiva con debounce (Reactive Forms). */
  protected readonly busqueda = new FormControl('', { nonNullable: true });

  protected readonly modalAbierto = signal(false);
  protected readonly editandoId = signal<number | null>(null);
  protected readonly errorImagenModal = signal(false);
  protected readonly imagenesConError = signal<Set<number>>(new Set());

  /** Reactive Forms con Signals: validación en tiempo real del producto. */
  protected readonly formulario = new FormGroup({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(/^[A-Za-z0-9._-]+$/),
        soloEspacios(),
      ],
    }),
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
      validators: [Validators.maxLength(300)],
    }),
    id_categoria: new FormControl<number | null>(null, { validators: [Validators.required] }),
    imagenUrl: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
    precio_compra: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    precio_venta: new FormControl<number | null>(null, {
      validators: [Validators.required, positivo()],
    }),
    stock_inicial: new FormControl<number | null>(null, {
      validators: [Validators.min(0), entero()],
    }),
    stock_minimo: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0), entero()],
    }),
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

  /** Live Preview de la imagen ingresada mediante Signals. */
  protected readonly imagenUrlPreview = computed(() => {
    const raw = this.cambiosFormulario()?.imagenUrl;
    return typeof raw === 'string' ? raw.trim() : '';
  });

  /** Icono representativo según la categoría seleccionada en el formulario. */
  protected readonly iconoCategoriaActual = computed(() => {
    const idCat = this.cambiosFormulario()?.id_categoria;
    if (!idCat) return 'bi-box-seam';
    const cat = this.categorias.categorias().find((c) => c.id_categoria === idCat);
    return this.obtenerIconoCategoria(cat?.nombre);
  });

  private readonly suscripcionBusqueda = this.busqueda.valueChanges
    .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
    .subscribe((texto) =>
      this.servicio.obtenerTodos({ busqueda: texto }).subscribe({ error: () => undefined }),
    );

  ngOnInit(): void {
    if (!this.auth.autenticado()) {
      void this.router.navigate(['/login']);
      return;
    }
    this.servicio.obtenerTodos().subscribe({ error: () => undefined });
    this.categorias.obtenerTodas().subscribe({ error: () => undefined });
  }

  /** Mensaje de validación del campo (solo si es inválido y ya fue tocado). */
  protected errorDe(nombre: string): string | null {
    return mensajeError(this.formulario.get(nombre), ETIQUETAS[nombre] ?? 'Este campo');
  }

  limpiarBusqueda(): void {
    this.busqueda.setValue('');
  }

  onModalImageError(): void {
    this.errorImagenModal.set(true);
  }

  onTableImageError(idProducto: number): void {
    this.imagenesConError.update((set) => {
      const nuevo = new Set(set);
      nuevo.add(idProducto);
      return nuevo;
    });
  }

  obtenerIconoCategoria(categoria?: string | null): string {
    const c = (categoria || '').toLowerCase();
    if (c.includes('laptop') || c.includes('notebook') || c.includes('comput'))
      return 'bi-laptop text-primary fs-5';
    if (
      c.includes('perif') ||
      c.includes('accesorio') ||
      c.includes('mouse') ||
      c.includes('teclado')
    )
      return 'bi-mouse text-primary fs-5';
    if (c.includes('monitor') || c.includes('pantalla')) return 'bi-display text-primary fs-5';
    if (c.includes('audio') || c.includes('auricular') || c.includes('parlante'))
      return 'bi-headphones text-primary fs-5';
    if (c.includes('red') || c.includes('conectividad') || c.includes('router'))
      return 'bi-router text-primary fs-5';
    if (
      c.includes('almacenamiento') ||
      c.includes('disco') ||
      c.includes('ssd') ||
      c.includes('usb')
    )
      return 'bi-hdd text-primary fs-5';
    return 'bi-box-seam-fill text-primary fs-5';
  }

  abrirNuevo(): void {
    this.editandoId.set(null);
    this.errorImagenModal.set(false);
    this.formulario.reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      id_categoria: null,
      imagenUrl: '',
      precio_compra: null,
      precio_venta: null,
      stock_inicial: null,
      stock_minimo: null,
    });
    this.modalAbierto.set(true);
  }

  abrirEditar(producto: Producto): void {
    this.editandoId.set(producto.id_producto);
    this.errorImagenModal.set(false);
    this.formulario.reset({
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? '',
      id_categoria: producto.id_categoria,
      imagenUrl: producto.imagenUrl ?? producto.imagen_url ?? '',
      precio_compra: producto.precio_compra,
      precio_venta: producto.precio_venta,
      stock_inicial: null,
      stock_minimo: producto.stock_minimo,
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

    const valores = this.formulario.getRawValue();
    const codigo = valores.codigo.trim();
    const nombre = valores.nombre.trim();
    const descripcion = valores.descripcion.trim() || null;
    const id_categoria = valores.id_categoria!;
    const imagenUrl = valores.imagenUrl.trim() || null;
    const precio_compra = valores.precio_compra ?? 0;
    const precio_venta = valores.precio_venta!;
    const stock_minimo = valores.stock_minimo!;

    if (this.editandoId() === null) {
      const datos: ProductoCreate = {
        codigo,
        nombre,
        descripcion,
        id_categoria,
        imagenUrl,
        imagen_url: imagenUrl,
        precio_compra,
        precio_venta,
        stock_inicial: valores.stock_inicial ?? 0,
        stock_minimo,
      };
      this.servicio
        .crear(datos)
        .subscribe({ next: () => this.cerrarModal(), error: () => undefined });
      return;
    }

    const datos: ProductoUpdate = {
      id_producto: this.editandoId()!,
      codigo,
      nombre,
      descripcion,
      id_categoria,
      imagenUrl,
      imagen_url: imagenUrl,
      precio_compra,
      precio_venta,
      stock_minimo,
    };
    this.servicio
      .actualizar(datos)
      .subscribe({ next: () => this.cerrarModal(), error: () => undefined });
  }

  desactivar(producto: Producto): void {
    if (!window.confirm('¿Desactivar el producto "' + producto.nombre + '"?')) {
      return;
    }
    this.servicio.desactivar(producto.id_producto).subscribe({ error: () => undefined });
  }
}
