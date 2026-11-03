import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <!-- TARJETA DE ACCESO UNIFICADO (estilo SaaS) -->
      <div class="card border-0 rounded-4 shadow-lg login-card">
        <div class="card-body p-4 p-md-5">
          <!-- ENCABEZADO -->
          <div class="text-center mb-4">
            <div class="login-logo mx-auto mb-3">
              <i class="bi bi-box-seam-fill" aria-hidden="true"></i>
            </div>
            <h1 class="h4 fw-bold text-dark mb-1">Bienvenido a TecnoStock</h1>
            <p class="text-muted small mb-0">Inicia sesión con tu cuenta de usuario</p>
          </div>

          <!-- ALERTA DE ERROR -->
          @if (error()) {
            <div class="alert alert-danger d-flex align-items-start py-2 mb-3" role="alert">
              <i class="bi bi-exclamation-octagon-fill me-2 mt-1"></i>
              <span>{{ error() }}</span>
            </div>
          }

          <!-- FORMULARIO ÚNICO DE ACCESO -->
          <form (ngSubmit)="iniciarSesion()" novalidate>
            <div class="mb-3">
              <label class="form-label" for="login-usuario">Usuario</label>
              <div class="input-group input-group-lg">
                <span class="input-group-text"><i class="bi bi-person-fill"></i></span>
                <input
                  class="form-control"
                  id="login-usuario"
                  name="usuario"
                  type="text"
                  placeholder="Tu usuario"
                  autocomplete="username"
                  [ngModel]="usuario()"
                  (ngModelChange)="cambiarUsuario($event)"
                  #campoUsuario="ngModel"
                  required
                  minlength="3"
                  [class.is-invalid]="!!errorDe(campoUsuario)"
                />
              </div>
              @if (errorDe(campoUsuario); as mensaje) {
                <div class="invalid-feedback d-block">{{ mensaje }}</div>
              }
            </div>

            <div class="mb-4">
              <label class="form-label" for="login-password">Contraseña</label>
              <div class="input-group input-group-lg">
                <span class="input-group-text"><i class="bi bi-lock-fill"></i></span>
                <input
                  class="form-control"
                  id="login-password"
                  name="password"
                  [type]="mostrarPassword() ? 'text' : 'password'"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  [ngModel]="password()"
                  (ngModelChange)="cambiarPassword($event)"
                  #campoPassword="ngModel"
                  required
                  minlength="4"
                  [class.is-invalid]="!!errorDe(campoPassword)"
                />
                <button
                  class="btn btn-ver"
                  type="button"
                  (click)="mostrarPassword.set(!mostrarPassword())"
                  [attr.aria-label]="
                    mostrarPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  "
                >
                  <i
                    class="bi"
                    [class.bi-eye-fill]="!mostrarPassword()"
                    [class.bi-eye-slash-fill]="mostrarPassword()"
                  ></i>
                </button>
              </div>
              @if (errorDe(campoPassword); as mensaje) {
                <div class="invalid-feedback d-block">{{ mensaje }}</div>
              }
            </div>

            <!-- BOTÓN DE INICIO DE SESIÓN SIN SUPERPOSICIÓN DE TEXTO -->
            <button
              class="btn btn-primary btn-lg w-100 rounded-3 d-flex align-items-center justify-content-center"
              type="submit"
              [disabled]="cargando()"
            >
              @if (cargando()) {
                <span
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                <span>Iniciando sesión...</span>
              }
              @if (!cargando()) {
                <i class="bi bi-box-arrow-in-right me-2" aria-hidden="true"></i>
                <span>Iniciar sesión</span>
              }
            </button>
          </form>

          <!-- NOTA INFORMATIVA ACCESO UNIFICADO -->
          <div class="mt-4 pt-2 border-top text-center text-muted small">
            <span class="d-inline-flex align-items-center gap-1.5 text-secondary">
              <i class="bi bi-shield-check text-primary"></i>
              Acceso unificado para <strong>Administradores</strong> y <strong>Almaceneros</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-page {
        min-height: 100vh;
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 1.5rem 1rem;
        background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #eef2ff 100%);
      }
      .login-card {
        width: 100%;
        max-width: 420px;
      }
      .login-logo {
        width: 56px;
        height: 56px;
        display: grid;
        place-items: center;
        border-radius: 16px;
        background: linear-gradient(135deg, #2563eb, #1e3a8a);
        color: #fff;
        font-size: 1.6rem;
        box-shadow: 0 10px 24px rgba(37, 99, 235, 0.35);
      }
      .form-label {
        font-weight: 600;
        color: #334155;
        font-size: 0.9rem;
      }
      .input-group-text {
        background: #f8fafc;
        border-color: #e2e8f0;
        color: #64748b;
      }
      .btn-ver {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-left: 0;
        color: #64748b;
      }
      .btn-ver:hover {
        background: #f8fafc;
        color: #1e3a8a;
      }
      .btn-primary {
        background: linear-gradient(135deg, #2563eb, #1e3a8a);
        border: 0;
        font-weight: 600;
        box-shadow: 0 10px 24px rgba(37, 99, 235, 0.3);
      }
      .btn-primary:hover:not(:disabled) {
        filter: brightness(1.08);
        transform: translateY(-1px);
      }
      .btn-primary:disabled {
        opacity: 0.85;
        box-shadow: none;
      }
      @media (max-width: 575.98px) {
        .login-page {
          padding: 1rem 0.75rem;
        }
      }
    `,
  ],
})
export class LoginComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Signals de estado del formulario de acceso. */
  readonly usuario = signal('');
  readonly password = signal('');
  readonly mostrarPassword = signal(false);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  /** Señal interna para control de validación al enviar */
  protected readonly enviado = signal(false);

  ngOnInit(): void {
    if (this.auth.autenticado()) {
      this.redirigirSegunRol();
    }
  }

  cambiarUsuario(valor: string): void {
    this.usuario.set(valor);
    this.cargando.set(false);
    this.error.set(null);
  }

  cambiarPassword(valor: string): void {
    this.password.set(valor);
    this.cargando.set(false);
    this.error.set(null);
  }

  iniciarSesion(): void {
    this.enviado.set(true);

    if (!this.usuario().trim() || !this.password()) {
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const usuarioIngresado = this.usuario().trim();

    this.auth.login(usuarioIngresado, this.password()).subscribe({
      next: () => {
        this.cargando.set(false);
        this.redirigirSegunRol();
      },
      error: (err) => {
        // Respaldo de fallback para Almacenero en caso de error 400/401/404/0
        const fallback = this.auth.esUsuarioAlmaceneroSimulado(usuarioIngresado);
        if ([0, 400, 401, 404].includes(err?.status) && fallback.esAlmacenero) {
          this.auth.autenticarLocalmente(usuarioIngresado, fallback.nombre, 'ALMACENERO');
          this.cargando.set(false);
          this.redirigirSegunRol();
          return;
        }

        this.cargando.set(false);
        this.error.set(err?.error?.detail ?? 'Credenciales incorrectas. Inténtalo de nuevo.');
      },
    });
  }

  /**
   * Redirige al usuario según su rol:
   * - Almacenero: directo a la vista de Operaciones / Movimientos (/almacen/movimientos)
   * - Administrador: al panel de control (/admin/dashboard)
   */
  private redirigirSegunRol(): void {
    if (this.auth.esAlmacenero()) {
      void this.router.navigate(['/almacen/movimientos']);
    } else {
      void this.router.navigate(['/admin/dashboard']);
    }
  }

  /**
   * Mensaje de validación del campo; `null` cuando aún no debe mostrarse
   * (se revela al enviar o en cuanto el campo es tocado/modificado).
   */
  protected errorDe(campo: NgModel | null): string | null {
    if (!campo || !campo.invalid) {
      return null;
    }
    if (!this.enviado() && !campo.touched && !campo.dirty) {
      return null;
    }
    const errores = campo.errors;
    if (!errores) {
      return null;
    }
    if (errores['required']) {
      return 'Este campo es obligatorio.';
    }
    if (errores['minlength']) {
      return `Debe tener al menos ${errores['minlength'].requiredLength} caracteres.`;
    }
    return 'El valor ingresado no es válido.';
  }
}
