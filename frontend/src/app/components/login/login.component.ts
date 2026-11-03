import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page" translate="no">
      <section class="login-hero">
        <div class="hero-content">
          <div class="hero-logo"><i class="bi bi-box-seam"></i></div>
          <h1>TecnoStock</h1>
          <p class="hero-lead">
            Controla tu inventario, tus movimientos y tu stock en un solo lugar.
          </p>
          <ul class="hero-list">
            <li><i class="bi bi-graph-up-arrow"></i>Indicadores en tiempo real</li>
            <li><i class="bi bi-arrow-left-right"></i>Entradas y salidas al detalle</li>
            <li><i class="bi bi-bell"></i>Alertas de stock bajo</li>
          </ul>
        </div>
      </section>

      <section class="login-form-side">
        <div class="login-box">
          <div class="mb-4">
            <h2 class="login-title">Bienvenido de nuevo</h2>
            <p class="text-muted mb-0">Inicia sesión para gestionar tu inventario</p>
          </div>

          @if (auth.error()) {
            <div class="alert alert-danger d-flex align-items-start py-2" role="alert">
              <i class="bi bi-exclamation-octagon-fill me-2 mt-1"></i>
              <span>{{ auth.error() }}</span>
            </div>
          }

          <form (ngSubmit)="iniciarSesion()" novalidate>
            <div class="mb-3">
              <label class="form-label" for="login-usuario">Usuario</label>
              <div class="input-group input-group-lg">
                <span class="input-group-text"><i class="bi bi-person"></i></span>
                <input
                  class="form-control"
                  id="login-usuario"
                  name="usuario"
                  placeholder="Tu usuario"
                  autocomplete="username"
                  [class.is-invalid]="enviado() && !usuario().trim()"
                  [ngModel]="usuario()"
                  (ngModelChange)="onUsuario($event)"
                />
                <div class="invalid-feedback">Ingresa tu usuario.</div>
              </div>
            </div>

            <div class="mb-4">
              <label class="form-label" for="login-clave">Contraseña</label>
              <div class="input-group input-group-lg">
                <span class="input-group-text"><i class="bi bi-lock"></i></span>
                <input
                  class="form-control"
                  id="login-clave"
                  name="clave"
                  [type]="verClave() ? 'text' : 'password'"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  [class.is-invalid]="enviado() && !clave()"
                  [ngModel]="clave()"
                  (ngModelChange)="onClave($event)"
                />
                <button
                  class="btn btn-ver"
                  type="button"
                  (click)="verClave.set(!verClave())"
                  [attr.aria-label]="verClave() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                >
                  <i class="bi" [class.bi-eye]="!verClave()" [class.bi-eye-slash]="verClave()"></i>
                </button>
                <div class="invalid-feedback">Ingresa tu contraseña.</div>
              </div>
            </div>

            <button class="btn btn-primary btn-lg w-100" type="submit" [disabled]="auth.cargando()">
              @if (auth.cargando()) {
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Iniciando sesión…
              } @else {
                <i class="bi bi-box-arrow-in-right me-2"></i>Entrar
              }
            </button>
          </form>

          <div class="demo-hint">
            <i class="bi bi-shield-lock me-2"></i>
            Credenciales de prueba: <strong>admin</strong> / <strong>admin123</strong>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .login-page {
        position: fixed;
        inset: 0;
        z-index: 2000;
        display: grid;
        grid-template-columns: 1.1fr 1fr;
        background: #fff;
        overflow: auto;
      }

      /* Lado izquierdo */
      .login-hero {
        position: relative;
        display: flex;
        align-items: center;
        padding: 4rem;
        color: #fff;
        overflow: hidden;
        background:
          radial-gradient(circle at 15% 15%, rgba(96, 165, 250, 0.35), transparent 45%),
          linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      }
      .login-hero::before,
      .login-hero::after {
        content: '';
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
      }
      .login-hero::before { width: 380px; height: 380px; right: -120px; bottom: -120px; }
      .login-hero::after { width: 220px; height: 220px; right: 120px; top: -80px; }
      .hero-content { position: relative; z-index: 1; max-width: 440px; }
      .hero-logo {
        width: 64px; height: 64px;
        display: grid; place-items: center;
        border-radius: 18px;
        font-size: 2rem;
        background: rgba(255, 255, 255, 0.14);
        backdrop-filter: blur(6px);
        margin-bottom: 1.5rem;
      }
      .login-hero h1 { font-size: 2.8rem; font-weight: 700; margin-bottom: 0.75rem; }
      .hero-lead { color: #cbd5e1; font-size: 1.1rem; margin-bottom: 2rem; }
      .hero-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.9rem; }
      .hero-list li { display: flex; align-items: center; color: #e2e8f0; }
      .hero-list i {
        width: 36px; height: 36px;
        display: grid; place-items: center;
        border-radius: 10px;
        margin-right: 0.8rem;
        background: rgba(255, 255, 255, 0.12);
        color: #93c5fd;
      }

      /* Lado derecho */
      .login-form-side {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: #f8fafc;
      }
      .login-box { width: 100%; max-width: 400px; }
      .login-title { font-weight: 700; color: #0f172a; }
      .form-label { font-weight: 500; color: #334155; }
      .input-group-text { background: #fff; color: #64748b; }
      .login-box .form-control { border-left: 0; }
      .login-box .form-control:focus { box-shadow: none; }
      .input-group:focus-within { border-radius: 0.5rem; box-shadow: 0 0 0 0.2rem rgba(37, 99, 235, 0.15); }
      .btn-ver { background: #fff; border: 1px solid #dee2e6; border-left: 0; color: #64748b; }
      .btn-ver:hover { color: #1e3a8a; background: #fff; }
      .btn-primary {
        background: linear-gradient(135deg, #2563eb, #1e3a8a);
        border: 0;
        font-weight: 600;
        padding: 0.75rem;
        box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
      }
      .btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }
      .demo-hint {
        margin-top: 1.5rem;
        padding: 0.7rem 1rem;
        text-align: center;
        font-size: 0.85rem;
        color: #475569;
        background: #eff6ff;
        border: 1px dashed #bfdbfe;
        border-radius: 10px;
      }

      @media (max-width: 860px) {
        .login-page { grid-template-columns: 1fr; }
        .login-hero { display: none; }
      }
    `,
  ],
})
export class LoginComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly usuario = signal('');
  protected readonly clave = signal('');
  protected readonly enviado = signal(false);
  protected readonly verClave = signal(false);

  ngOnInit(): void {
    if (this.auth.autenticado()) {
      void this.router.navigate(['/dashboard']);
    }
  }

  onUsuario(valor: string): void {
    this.usuario.set(valor);
    this.auth.limpiarError();
  }

  onClave(valor: string): void {
    this.clave.set(valor);
    this.auth.limpiarError();
  }

  iniciarSesion(): void {
    this.enviado.set(true);
    if (!this.usuario().trim() || !this.clave()) {
      return;
    }
    this.auth
      .login({ username: this.usuario().trim(), password: this.clave() })
      .subscribe({ next: () => void this.router.navigate(['/dashboard']) });
  }
}