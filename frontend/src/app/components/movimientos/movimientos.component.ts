import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TipoMovimiento } from '../../interfaces/movimiento.interface';
import { AuthService } from '../../services/auth.service';
import { MovimientoService } from '../../services/movimiento.service';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="container-fluid py-4 px-4">
      <!-- CABECERA DE LA VISTA -->
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div class="d-flex align-items-center gap-2">
            <h1 class="h3 fw-bold text-dark mb-0">Movimientos</h1>
            <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1">
              {{ servicio.movimientos().length }} registros
            </span>
          </div>
          <p class="text-muted small mb-0 mt-1">Historial de entradas, salidas y kardex general de almacén</p>
        </div>

        <button class="btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm" type="button" (click)="abrirNuevo()">
          <i class="bi bi-plus-lg"></i>
          <span>Nuevo movimiento</span>
        </button>
      </div>

      <!-- ALERTA DE ERROR -->
      @if (servicio.error()) {
        <div class="alert alert-danger border-0 shadow-sm d-flex align-items-center mb-4 rounded-3" role="alert">
          <i class="bi bi-exclamation-triangle-fill fs-5 me-2"></i>
          <div>{{ servicio.error() }}</div>
        </div>
      }

      <!-- TABLA DE MOVIMIENTOS -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light border-bottom">
                <tr>
                  <th scope="col" class="ps-4 py-3 text-muted text-uppercase fs-7 font-monospace">Fecha y Hora</th>
                  <th scope="col" class="py-3 text-muted text-uppercase fs-7">Producto</th>
                  <th scope="col" class="py-3 text-muted text-uppercase fs-7">Tipo</th>
                  <th scope="col" class="py-3 text-end text-muted text-uppercase fs-7">Cant.</th>
                  <th scope="col" class="py-3 text-end text-muted text-uppercase fs-7">P. Unitario</th>
                  <th scope="col" class="py-3 text-end text-muted text-uppercase fs-7">Total</th>
                  <th scope="col" class="py-3 text-muted text-uppercase fs-7">Usuario</th>
                  <th scope="col" class="pe-4 py-3 text-muted text-uppercase fs-7">Observación</th>
                </tr>
              </thead>
              <tbody>
                @for (movimiento of servicio.movimientos(); track movimiento.id_movimiento) {
                  <tr>
                    <!-- FECHA Y HORA -->
                    <td class="ps-4 text-nowrap">
                      <div class="d-flex align-items-center gap-1.5 text-secondary font-monospace small">
                        <i class="bi bi-clock text-muted"></i>
                        <span>{{ movimiento.fecha | date: 'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                    </td>

                    <!-- PRODUCTO -->
                    <td>
                      <div class="d-flex align-items-center gap-2.5">
                        <div class="bg-primary bg-opacity-10 text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style="width: 34px; height: 34px;">
                          <i class="bi bi-box-seam-fill fs-6"></i>
                        </div>
                        <span class="fw-bold text-dark">{{ movimiento.producto }}</span>
                      </div>
                    </td>

                    <!-- TIPO (ENTRADA / SALIDA) BADGE -->
                    <td>
                      @if (movimiento.tipo === 'ENTRADA') {
                        <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1">
                          <i class="bi bi-arrow-down-left fs-7"></i>
                          <span>Entrada</span>
                        </span>
                      } @else {
                        <span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1">
                          <i class="bi bi-arrow-up-right fs-7"></i>
                          <span>Salida</span>
                        </span>
                      }
                    </td>

                    <!-- CANTIDAD -->
                    <td class="text-end font-monospace fw-bold text-dark">
                      {{ movimiento.cantidad }}
                    </td>

                    <!-- PRECIO UNITARIO -->
                    <td class="text-end font-monospace text-secondary">
                      {{ movimiento.precio_unitario | currency: 'PEN': 'S/ ' }}
                    </td>

                    <!-- TOTAL -->
                    <td class="text-end font-monospace fw-bold text-dark">
                      {{ movimiento.total | currency: 'PEN': 'S/ ' }}
                    </td>

                    <!-- USUARIO -->
                    <td>
                      <span class="badge bg-light text-secondary border border-slate-200 px-2.5 py-1 rounded-2 font-monospace fw-normal">
                        <i class="bi bi-person-fill me-1 text-slate-400"></i>{{ movimiento.usuario }}
                      </span>
                    </td>

                    <!-- OBSERVACIÓN -->
                    <td class="pe-4">
                      <span class="text-secondary small text-truncate d-inline-block" style="max-width: 220px;" [title]="movimiento.observacion">
                        {{ movimiento.observacion || '—' }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="text-center text-muted py-5">
                      @if (servicio.cargando()) {
                        <div class="d-flex flex-column align-items-center gap-2">
                          <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
                          <span class="small">Cargando historial de movimientos…</span>
                        </div>
                      } @else {
                        <div class="d-flex flex-column align-items-center gap-2 py-3">
                          <i class="bi bi-arrow-left-right fs-1 text-slate-300"></i>
                          <p class="mb-0 text-secondary fw-medium">No hay movimientos registrados</p>
                          <button class="btn btn-sm btn-outline-primary mt-2" (click)="abrirNuevo()">
                            Registrar primer movimiento
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
        <div class="card-footer bg-light border-top px-4 py-2.5 text-muted small d-flex justify-content-between align-items-center">
          <span>Mostrando {{ servicio.movimientos().length }} registro(s) de kardex</span>
          <span class="fw-semibold text-secondary">TecnoStock Inventory System</span>
        </div>
      </div>

      <!-- MODAL POP-UP REGISTRAR MOVIMIENTO -->
      @if (modalAbierto()) {
        <div
          class="modal fade show d-block"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          style="background-color: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px);"
        >
          <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <form class="modal-content border-0 shadow-lg rounded-4 overflow-hidden" (ngSubmit)="guardar()" novalidate>
              
              <!-- MODAL HEADER -->
              <div class="modal-header bg-light border-bottom px-4 py-3">
                <div class="d-flex align-items-center gap-2">
                  <div class="bg-primary text-white rounded-2 p-1.5 d-flex align-items-center justify-content-center" style="width: 28px; height: 28px;">
                    <i class="bi bi-arrow-left-right fs-6"></i>
                  </div>
                  <h2 class="modal-title h6 fw-bold text-dark mb-0">
                    Registrar Movimiento de Inventario
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
                <!-- PRODUCTO SELECT -->
                <div class="mb-3">
                  <label class="form-label small fw-semibold text-secondary" for="mov-producto">Producto de inventario *</label>
                  <select
                    class="form-select rounded-3 py-2 px-3"
                    id="mov-producto"
                    name="id_producto"
                    [class.is-invalid]="enviado() && !productoId()"
                    [ngModel]="productoId()"
                    (ngModelChange)="productoId.set($event)"
                  >
                    <option [ngValue]="null" disabled>Selecciona un producto...</option>
                    @for (producto of productos.productos(); track producto.id_producto) {
                      <option [ngValue]="producto.id_producto">
                        {{ producto.nombre }} ({{ producto.codigo }})
                      </option>
                    }
                  </select>
                  <div class="invalid-feedback">Selecciona un producto.</div>
                </div>

                <div class="row g-3">
                  <!-- TIPO DE MOVIMIENTO -->
                  <div class="col-6">
                    <label class="form-label small fw-semibold text-secondary" for="mov-tipo">Tipo de movimiento *</label>
                    <select
                      class="form-select rounded-3 py-2 px-3 fw-medium"
                      id="mov-tipo"
                      name="tipo"
                      [ngModel]="tipo()"
                      (ngModelChange)="tipo.set($event)"
                    >
                      <option value="ENTRADA">📥 Entrada (Compra)</option>
                      <option value="SALIDA">📤 Salida (Venta)</option>
                    </select>
                  </div>

                  <!-- CANTIDAD -->
                  <div class="col-6">
                    <label class="form-label small fw-semibold text-secondary" for="mov-cantidad">Cantidad un. *</label>
                    <input
                      class="form-control rounded-3 py-2 px-3 font-monospace"
                      id="mov-cantidad"
                      name="cantidad"
                      type="number"
                      min="1"
                      [class.is-invalid]="enviado() && cantidad() < 1"
                      [ngModel]="cantidad()"
                      (ngModelChange)="cantidad.set(+$event)"
                    />
                    <div class="invalid-feedback">Debe ser al menos 1.</div>
                  </div>
                </div>

                <!-- PRECIO UNITARIO DINÁMICO -->
                <div class="mb-3 mt-3">
                  <label class="form-label small fw-semibold text-secondary" for="mov-precio">
                    {{ tipo() === 'ENTRADA' ? 'Precio de compra unitario (S/) *' : 'Precio de venta unitario (S/) *' }}
                  </label>
                  <input
                    class="form-control rounded-3 py-2 px-3 font-monospace"
                    id="mov-precio"
                    name="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    [class.is-invalid]="enviado() && precio() <= 0"
                    [ngModel]="precio()"
                    (ngModelChange)="precio.set(+$event)"
                  />
                  <div class="invalid-feedback">Debe ser mayor a 0.</div>
                </div>

                <!-- OBSERVACIÓN -->
                <div class="mb-3">
                  <label class="form-label small fw-semibold text-secondary" for="mov-observacion">Observación o motivo</label>
                  <textarea
                    class="form-control rounded-3 py-2 px-3"
                    id="mov-observacion"
                    name="observacion"
                    rows="2"
                    placeholder="Ej. Compra a proveedor, venta a cliente..."
                    [ngModel]="observacion()"
                    (ngModelChange)="observacion.set($event)"
                  ></textarea>
                </div>
              </div>

              <!-- MODAL FOOTER -->
              <div class="modal-footer bg-light border-top px-4 py-3">
                <button class="btn btn-outline-secondary rounded-3 px-3 py-2 text-sm fw-semibold" type="button" (click)="cerrarModal()">
                  Cancelar
                </button>
                <button class="btn btn-primary rounded-3 px-4 py-2 text-sm fw-semibold d-inline-flex align-items-center gap-2" type="submit">
                  <i class="bi bi-check-lg"></i>
                  <span>Registrar movimiento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class MovimientosComponent implements OnInit {
  protected readonly servicio = inject(MovimientoService);
  protected readonly productos = inject(ProductoService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly modalAbierto = signal(false);
  protected readonly enviado = signal(false);

  protected readonly productoId = signal<number | null>(null);
  protected readonly tipo = signal<TipoMovimiento>('ENTRADA');
  protected readonly cantidad = signal(1);
  protected readonly precio = signal(0);
  protected readonly observacion = signal('');

  ngOnInit(): void {
    if (!this.auth.autenticado()) {
      void this.router.navigate(['/login']);
      return;
    }
    this.productos.obtenerTodos().subscribe({ error: () => undefined });
    this.servicio.obtenerTodos().subscribe({ error: () => undefined });
  }

  abrirNuevo(): void {
    this.productoId.set(null);
    this.tipo.set('ENTRADA');
    this.cantidad.set(1);
    this.precio.set(0);
    this.observacion.set('');
    this.enviado.set(false);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  guardar(): void {
    this.enviado.set(true);
    if (!this.productoId() || this.cantidad() < 1 || this.precio() <= 0) {
      return;
    }

    const id_producto = this.productoId()!;
    const cantidad = this.cantidad();
    const observacion = this.observacion().trim() || null;

    if (this.tipo() === 'ENTRADA') {
      this.servicio
        .registrarEntrada({ id_producto, cantidad, precio_compra: this.precio(), observacion })
        .subscribe({ next: () => this.cerrarModal(), error: () => undefined });
      return;
    }

    this.servicio
      .registrarSalida({ id_producto, cantidad, precio_venta: this.precio(), observacion })
      .subscribe({ next: () => this.cerrarModal(), error: () => undefined });
  }
}