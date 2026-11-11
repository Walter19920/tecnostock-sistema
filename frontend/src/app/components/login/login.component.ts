import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificationService);
  private readonly router = inject(Router);

  /** Signals de estado del formulario de acceso */
  readonly usuario = signal('');
  readonly password = signal('');
  readonly mostrarPassword = signal(false);
  readonly cargando = signal(false);

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
  }

  cambiarPassword(valor: string): void {
    this.password.set(valor);
    this.cargando.set(false);
  }

  iniciarSesion(): void {
    this.enviado.set(true);

    if (!this.usuario().trim() || !this.password()) {
      this.notificaciones.showWarning('Por favor ingresa tu usuario y contraseña.');
      return;
    }

    this.cargando.set(true);
    const usuarioIngresado = this.usuario().trim();

    this.auth.login(usuarioIngresado, this.password()).subscribe({
      next: () => {
        this.cargando.set(false);
        this.notificaciones.showSuccess(
          `¡Bienvenido ${usuarioIngresado}! Sesión iniciada correctamente.`,
        );
        this.redirigirSegunRol();
      },
      error: (err) => {
        // Sin respaldos locales: la autenticación la valida exclusivamente el backend.
        this.cargando.set(false);
        this.notificaciones.showError(
          err?.error?.detail ?? 'Credenciales incorrectas. Inténtalo de nuevo.',
        );
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
