import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Rol } from '../../interfaces/auth.interface';
import { UsuarioCreate, UsuarioItem } from '../../interfaces/usuario.interface';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <div class="container-fluid py-4 px-4">
      <!-- CABECERA DE LA VISTA -->
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div class="d-flex align-items-center gap-2">
            <h1 class="h3 fw-bold text-dark mb-0">Gestión de Usuarios</h1>
            <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1">
              {{ servicio.total() }} trabajadores
            </span>
          </div>
          <p class="text-muted small mb-0 mt-1">
            Administra el personal del sistema, credenciales y permisos de acceso
          </p>
        </div>

        <button
          class="btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm px-3 py-2"
          type="button"
          (click)="abrirModalNuevo()"
        >
          <i class="bi bi-person-plus-fill"></i>
          <span>+ Nuevo usuario</span>
        </button>
      </div>

      <!-- TARJETAS RESUMEN DE PERSONAL -->
      <div class="row g-3 mb-4">
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-body p-3 d-flex align-items-center gap-3">
              <div
                class="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center"
                style="width: 46px; height: 46px;"
              >
                <i class="bi bi-people-fill fs-5"></i>
              </div>
              <div>
                <span class="text-muted small d-block">Total Personal</span>
                <span class="h5 fw-bold text-dark mb-0">{{ servicio.total() }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-body p-3 d-flex align-items-center gap-3">
              <div
                class="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center"
                style="width: 46px; height: 46px; background: linear-gradient(135deg, #1e3a8a, #2563eb) !important;"
              >
                <i class="bi bi-shield-lock-fill fs-5"></i>
              </div>
              <div>
                <span class="text-muted small d-block">Administradores</span>
                <span class="h5 fw-bold text-dark mb-0">{{ servicio.totalAdmins() }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-body p-3 d-flex align-items-center gap-3">
              <div
                class="bg-info bg-opacity-10 text-info rounded-3 d-flex align-items-center justify-content-center"
                style="width: 46px; height: 46px;"
              >
                <i class="bi bi-box-seam-fill fs-5"></i>
              </div>
              <div>
                <span class="text-muted small d-block">Almaceneros</span>
                <span class="h5 fw-bold text-dark mb-0">{{ servicio.totalAlmaceneros() }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-body p-3 d-flex align-items-center gap-3">
              <div
                class="bg-success bg-opacity-10 text-success rounded-3 d-flex align-items-center justify-content-center"
                style="width: 46px; height: 46px;"
              >
                <i class="bi bi-check-circle-fill fs-5"></i>
              </div>
              <div>
                <span class="text-muted small d-block">Usuarios Activos</span>
                <span class="h5 fw-bold text-dark mb-0">{{ usuariosActivos() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MENSAJE DE ÉXITO -->
      @if (exitoMensaje()) {
        <div
          class="alert alert-success border-0 shadow-sm d-flex align-items-center justify-content-between mb-4 rounded-3 py-2 px-3"
          role="alert"
        >
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-check-circle-fill fs-5"></i>
            <span>{{ exitoMensaje() }}</span>
          </div>
          <button
            class="btn-close shadow-none btn-sm"
            type="button"
            aria-label="Cerrar"
            (click)="exitoMensaje.set(null)"
          ></button>
        </div>
      }

      <!-- ALERTA DE ERROR DE SERVICIO -->
      @if (servicio.error()) {
        <div
          class="alert alert-danger border-0 shadow-sm d-flex align-items-center mb-4 rounded-3"
          role="alert"
        >
          <i class="bi bi-exclamation-triangle-fill fs-5 me-2"></i>
          <div>{{ servicio.error() }}</div>
        </div>
      }

      <!-- FILTROS Y BÚSQUEDA -->
      <div class="card border-0 shadow-sm rounded-4 mb-4">
        <div class="card-body p-3">
          <div class="row g-2 align-items-center justify-content-between">
            <!-- Input de búsqueda -->
            <div class="col-12 col-md-6 col-lg-5">
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0">
                  <i class="bi bi-search text-muted"></i>
                </span>
                <input
                  class="form-control border-start-0 ps-0"
                  type="text"
                  placeholder="Buscar por nombre o usuario..."
                  [value]="busqueda()"
                  (input)="actualizarBusqueda($event)"
                />
                @if (busqueda()) {
                  <button
                    class="btn btn-outline-secondary border-start-0"
                    type="button"
                    (click)="limpiarBusqueda()"
                  >
                    <i class="bi bi-x"></i>
                  </button>
                }
              </div>
            </div>

            <!-- Botones de filtro por Rol -->
            <div class="col-12 col-md-6 col-lg-6 d-flex justify-content-md-end gap-1 flex-wrap">
              <button
                class="btn btn-sm"
                [class.btn-primary]="filtroRol() === 'TODOS'"
                [class.btn-light]="filtroRol() !== 'TODOS'"
                type="button"
                (click)="filtroRol.set('TODOS')"
              >
                Todos ({{ servicio.total() }})
              </button>
              <button
                class="btn btn-sm"
                [class.btn-primary]="filtroRol() === 'ADMIN'"
                [class.btn-light]="filtroRol() !== 'ADMIN'"
                type="button"
                (click)="filtroRol.set('ADMIN')"
              >
                <i class="bi bi-shield-lock me-1"></i>Admins ({{ servicio.totalAdmins() }})
              </button>
              <button
                class="btn btn-sm"
                [class.btn-primary]="filtroRol() === 'ALMACENERO'"
                [class.btn-light]="filtroRol() !== 'ALMACENERO'"
                type="button"
                (click)="filtroRol.set('ALMACENERO')"
              >
                <i class="bi bi-box-seam me-1"></i>Almaceneros ({{ servicio.totalAlmaceneros() }})
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TABLA DE USUARIOS ESTILO SAAS -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light border-bottom">
                <tr>
                  <th
                    scope="col"
                    class="ps-4 py-3 text-muted text-uppercase fs-7 font-monospace"
                    style="width: 70px;"
                  >
                    # ID
                  </th>
                  <th scope="col" class="py-3 text-muted text-uppercase fs-7">
                    Nombre completo / Usuario
                  </th>
                  <th scope="col" class="py-3 text-muted text-uppercase fs-7">Rol</th>
                  <th scope="col" class="py-3 text-muted text-uppercase fs-7">Estado</th>
                  <th scope="col" class="py-3 text-muted text-uppercase fs-7">Fecha de Alta</th>
                  <th
                    scope="col"
                    class="pe-4 py-3 text-end text-muted text-uppercase fs-7"
                    style="width: 130px;"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (usuario of usuariosFiltrados(); track usuario.id_usuario) {
                  <tr>
                    <!-- ID -->
                    <td class="ps-4 font-monospace text-muted small fw-semibold">
                      #{{ usuario.id_usuario.toString().padStart(3, '0') }}
                    </td>

                    <!-- NOMBRE COMPLETO / USUARIO -->
                    <td>
                      <div class="d-flex align-items-center gap-3">
                        <div
                          class="avatar-circulo rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                          [class.bg-admin]="esRolAdmin(usuario.rol)"
                          [class.bg-almacen]="!esRolAdmin(usuario.rol)"
                        >
                          {{
                            obtenerIniciales(
                              usuario.nombre_completo || usuario.nombre || usuario.username
                            )
                          }}
                        </div>
                        <div>
                          <div class="fw-bold text-dark">
                            {{ usuario.nombre_completo || usuario.nombre || 'Sin nombre' }}
                          </div>
                          <div class="text-muted small d-flex align-items-center gap-1">
                            <i class="bi bi-person-fill text-secondary"></i>
                            <span>&#64;{{ usuario.username }}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- ROL (BADGE ADMINISTRADOR / ALMACENERO) -->
                    <td>
                      @if (esRolAdmin(usuario.rol)) {
                        <span
                          class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5"
                        >
                          <i class="bi bi-shield-lock-fill"></i>
                          <span>Administrador</span>
                        </span>
                      } @else {
                        <span
                          class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5"
                        >
                          <i class="bi bi-box-seam-fill"></i>
                          <span>Almacenero</span>
                        </span>
                      }
                    </td>

                    <!-- ESTADO -->
                    <td>
                      @if (usuario.activo) {
                        <span
                          class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1.5"
                        >
                          <span
                            class="spinner-grow spinner-grow-sm p-0 m-0"
                            style="width: 6px; height: 6px;"
                            role="status"
                          ></span>
                          Activo
                        </span>
                      } @else {
                        <span
                          class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1.5"
                        >
                          <span
                            class="rounded-circle bg-secondary d-inline-block"
                            style="width: 6px; height: 6px;"
                          ></span>
                          Inactivo
                        </span>
                      }
                    </td>

                    <!-- FECHA DE ALTA -->
                    <td class="text-secondary small">
                      {{
                        usuario.fecha_creacion
                          ? (usuario.fecha_creacion | date: 'dd/MM/yyyy')
                          : 'Registrado'
                      }}
                    </td>

                    <!-- ACCIONES -->
                    <td class="pe-4 text-end">
                      <button
                        class="btn btn-light btn-sm rounded-3 border-0 shadow-sm me-1"
                        [class.text-danger]="usuario.activo"
                        [class.text-success]="!usuario.activo"
                        type="button"
                        [title]="usuario.activo ? 'Desactivar usuario' : 'Activar usuario'"
                        (click)="alternarEstado(usuario)"
                      >
                        <i
                          class="bi"
                          [class.bi-toggle2-on]="usuario.activo"
                          [class.bi-toggle2-off]="!usuario.activo"
                        ></i>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="text-center text-muted py-5">
                      @if (servicio.cargando()) {
                        <div class="d-flex flex-column align-items-center gap-2">
                          <div
                            class="spinner-border text-primary spinner-border-sm"
                            role="status"
                          ></div>
                          <span class="small">Cargando personal…</span>
                        </div>
                      } @else {
                        <div class="d-flex flex-column align-items-center gap-2 py-3">
                          <i class="bi bi-people fs-1 text-secondary opacity-50"></i>
                          <p class="mb-0 text-secondary fw-medium">No se encontraron usuarios</p>
                          <button
                            class="btn btn-sm btn-outline-primary mt-2"
                            (click)="abrirModalNuevo()"
                          >
                            + Registrar un nuevo trabajador
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

      <!-- MODAL FLOTANTE CON BACKDROP BLUR (REGISTRAR NUEVO TRABAJADOR) -->
      @if (modalAbierto()) {
        <div
          class="modal fade show d-block"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          style="background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);"
        >
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <!-- MODAL HEADER -->
              <div class="modal-header bg-light border-bottom px-4 py-3">
                <div class="d-flex align-items-center gap-2">
                  <div
                    class="bg-primary text-white rounded-3 p-2 d-flex align-items-center justify-content-center"
                    style="width: 36px; height: 36px;"
                  >
                    <i class="bi bi-person-plus-fill fs-5"></i>
                  </div>
                  <div>
                    <h2 class="modal-title h6 fw-bold text-dark mb-0">Registrar Nuevo Usuario</h2>
                    <p class="text-muted small mb-0">
                      Completa los datos del trabajador para darle acceso
                    </p>
                  </div>
                </div>
                <button
                  class="btn-close shadow-none"
                  type="button"
                  aria-label="Cerrar"
                  (click)="cerrarModal()"
                ></button>
              </div>

              <!-- MODAL BODY CON FORMULARIO -->
              <form [formGroup]="formulario" (ngSubmit)="guardarUsuario()" novalidate>
                <div class="modal-body p-4">
                  <!-- ERROR DENTRO DEL MODAL -->
                  @if (errorModal()) {
                    <div
                      class="alert alert-danger py-2 mb-3 rounded-3 d-flex align-items-center"
                      role="alert"
                    >
                      <i class="bi bi-exclamation-octagon-fill me-2"></i>
                      <small>{{ errorModal() }}</small>
                    </div>
                  }

                  <!-- CAMPO: NOMBRE COMPLETO -->
                  <div class="mb-3">
                    <label class="form-label small fw-semibold text-secondary" for="usr-nombre">
                      Nombre completo <span class="text-danger">*</span>
                    </label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-person-vcard"></i></span>
                      <input
                        class="form-control"
                        id="usr-nombre"
                        type="text"
                        formControlName="nombre_completo"
                        placeholder="Ej. Juan Pérez Quispe"
                        [class.is-invalid]="esInvalido('nombre_completo')"
                      />
                    </div>
                    @if (obtenerMensajeError('nombre_completo'); as msg) {
                      <div class="invalid-feedback d-block">{{ msg }}</div>
                    }
                  </div>

                  <!-- CAMPO: USUARIO -->
                  <div class="mb-3">
                    <label class="form-label small fw-semibold text-secondary" for="usr-username">
                      Usuario de acceso <span class="text-danger">*</span>
                    </label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-person"></i></span>
                      <input
                        class="form-control"
                        id="usr-username"
                        type="text"
                        formControlName="username"
                        placeholder="Ej. jperez"
                        autocomplete="off"
                        [class.is-invalid]="esInvalido('username')"
                      />
                    </div>
                    @if (obtenerMensajeError('username'); as msg) {
                      <div class="invalid-feedback d-block">{{ msg }}</div>
                    }
                  </div>

                  <!-- CAMPO: CONTRASEÑA -->
                  <div class="mb-3">
                    <label class="form-label small fw-semibold text-secondary" for="usr-password">
                      Contraseña <span class="text-danger">*</span>
                    </label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-lock"></i></span>
                      <input
                        class="form-control"
                        id="usr-password"
                        [type]="mostrarPasswordModal() ? 'text' : 'password'"
                        formControlName="password"
                        placeholder="Mínimo 6 caracteres"
                        autocomplete="new-password"
                        [class.is-invalid]="esInvalido('password')"
                      />
                      <button
                        class="btn btn-outline-secondary"
                        type="button"
                        (click)="mostrarPasswordModal.set(!mostrarPasswordModal())"
                        [attr.aria-label]="mostrarPasswordModal() ? 'Ocultar' : 'Mostrar'"
                      >
                        <i
                          class="bi"
                          [class.bi-eye]="!mostrarPasswordModal()"
                          [class.bi-eye-slash]="mostrarPasswordModal()"
                        ></i>
                      </button>
                    </div>
                    @if (obtenerMensajeError('password'); as msg) {
                      <div class="invalid-feedback d-block">{{ msg }}</div>
                    }
                  </div>

                  <!-- CAMPO: SELECTOR DE ROL -->
                  <div class="mb-3">
                    <label class="form-label small fw-semibold text-secondary" for="usr-rol">
                      Selector de Rol <span class="text-danger">*</span>
                    </label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-shield-check"></i></span>
                      <select
                        class="form-select"
                        id="usr-rol"
                        formControlName="rol"
                        [class.is-invalid]="esInvalido('rol')"
                      >
                        <option value="ALMACENERO">Almacenero</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </div>
                    @if (obtenerMensajeError('rol'); as msg) {
                      <div class="invalid-feedback d-block">{{ msg }}</div>
                    }
                    <div class="form-text small text-muted mt-1">
                      {{
                        formulario.get('rol')?.value === 'ADMIN'
                          ? 'Acceso completo al sistema, inventario, categorías y gestión de personal.'
                          : 'Acceso a inventario de stock, registro de entradas y salidas.'
                      }}
                    </div>
                  </div>
                </div>

                <!-- MODAL FOOTER -->
                <div class="modal-footer bg-light border-top px-4 py-3">
                  <button
                    class="btn btn-light rounded-3 px-3"
                    type="button"
                    (click)="cerrarModal()"
                    [disabled]="guardando()"
                  >
                    Cancelar
                  </button>
                  <button
                    class="btn btn-primary rounded-3 px-4 d-inline-flex align-items-center gap-2"
                    type="submit"
                    [disabled]="guardando()"
                  >
                    @if (guardando()) {
                      <span
                        class="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      <span>Guardando…</span>
                    } @else {
                      <i class="bi bi-check-lg"></i>
                      <span>Guardar usuario</span>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .avatar-circulo {
        width: 38px;
        height: 38px;
        font-size: 0.85rem;
        letter-spacing: 0.5px;
        flex-shrink: 0;
      }
      .bg-admin {
        background: linear-gradient(135deg, #1e3a8a, #2563eb);
      }
      .bg-almacen {
        background: linear-gradient(135deg, #0e7490, #06b6d4);
      }
      .fs-7 {
        font-size: 0.75rem;
      }
    `,
  ],
})
export class UsuariosComponent implements OnInit {
  protected readonly servicio = inject(UsuarioService);
  private readonly fb = inject(FormBuilder);

  /** Signals de estado del componente */
  protected readonly busqueda = signal('');
  protected readonly filtroRol = signal<'TODOS' | 'ADMIN' | 'ALMACENERO'>('TODOS');
  protected readonly modalAbierto = signal(false);
  protected readonly mostrarPasswordModal = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorModal = signal<string | null>(null);
  protected readonly exitoMensaje = signal<string | null>(null);
  protected readonly enviado = signal(false);

  /** Formulario reactivo de registro */
  protected readonly formulario: FormGroup = this.fb.group({
    nombre_completo: ['', [Validators.required, Validators.minLength(3)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol: ['ALMACENERO' as Rol, [Validators.required]],
  });

  /** Cálculo de usuarios activos */
  protected readonly usuariosActivos = computed(
    () => this.servicio.usuarios().filter((u) => u.activo).length,
  );

  /** Filtrado reactivo de usuarios por búsqueda y rol */
  protected readonly usuariosFiltrados = computed(() => {
    const query = this.busqueda().trim().toLowerCase();
    const rol = this.filtroRol();
    const lista = this.servicio.usuarios();

    return lista.filter((usuario) => {
      // Filtro de rol
      if (rol === 'ADMIN' && !this.esRolAdmin(usuario.rol)) {
        return false;
      }
      if (rol === 'ALMACENERO' && this.esRolAdmin(usuario.rol)) {
        return false;
      }

      // Filtro de búsqueda
      if (!query) {
        return true;
      }
      const nombre = (usuario.nombre_completo || usuario.nombre || '').toLowerCase();
      const username = usuario.username.toLowerCase();
      return nombre.includes(query) || username.includes(query);
    });
  });

  ngOnInit(): void {
    this.servicio.listar().subscribe({
      error: () => {
        // El servicio maneja el error y mantiene los datos
      },
    });
  }

  actualizarBusqueda(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.busqueda.set(input.value);
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  esRolAdmin(rol: string | Rol): boolean {
    const r = (rol || '').toUpperCase();
    return r === 'ADMIN' || r.includes('ADMINISTRADOR');
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return 'US';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  abrirModalNuevo(): void {
    this.formulario.reset({
      nombre_completo: '',
      username: '',
      password: '',
      rol: 'ALMACENERO',
    });
    this.enviado.set(false);
    this.errorModal.set(null);
    this.mostrarPasswordModal.set(false);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.errorModal.set(null);
  }

  alternarEstado(usuario: UsuarioItem): void {
    this.servicio.cambiarEstado(usuario.id_usuario);
    this.exitoMensaje.set(
      `Estado de "${usuario.nombre_completo || usuario.username}" actualizado a ${
        !usuario.activo ? 'Activo' : 'Inactivo'
      }.`,
    );
    setTimeout(() => this.exitoMensaje.set(null), 3500);
  }

  esInvalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    if (!control) return false;
    return control.invalid && (control.touched || control.dirty || this.enviado());
  }

  obtenerMensajeError(campo: string): string | null {
    if (!this.esInvalido(campo)) return null;
    const errors = this.formulario.get(campo)?.errors;
    if (!errors) return null;

    if (errors['required']) return 'Este campo es obligatorio.';
    if (errors['minlength']) {
      return `Debe tener al menos ${errors['minlength'].requiredLength} caracteres.`;
    }
    return 'Valor inválido.';
  }

  guardarUsuario(): void {
    this.enviado.set(true);
    if (this.formulario.invalid) {
      return;
    }

    this.guardando.set(true);
    this.errorModal.set(null);

    const valorForm = this.formulario.value;
    const nuevo: UsuarioCreate = {
      nombre_completo: valorForm.nombre_completo.trim(),
      username: valorForm.username.trim(),
      password: valorForm.password,
      rol: valorForm.rol,
    };

    this.servicio.registrar(nuevo).subscribe({
      next: (usuarioCreado) => {
        this.guardando.set(false);
        this.cerrarModal();
        this.exitoMensaje.set(
          `Usuario "${usuarioCreado.nombre_completo || usuarioCreado.username}" registrado correctamente.`,
        );
        setTimeout(() => this.exitoMensaje.set(null), 4000);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorModal.set(
          err?.error?.detail || 'No se pudo registrar el usuario. Revisa los datos ingresados.',
        );
      },
    });
  }
}
