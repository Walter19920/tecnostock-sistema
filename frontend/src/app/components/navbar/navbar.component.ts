import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg bg-body-tertiary border-bottom">
      <div class="container-fluid">
        <a class="navbar-brand fw-semibold" routerLink="/dashboard">
          <i class="bi bi-box-seam me-1"></i>TecnoStock
        </a>
        <button
          class="navbar-toggler"
          type="button"
          (click)="alternarMenu()"
          aria-label="Alternar navegación"
          [attr.aria-expanded]="menuAbierto()"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" [class.show]="menuAbierto()">
          @if (auth.autenticado()) {
            <ul class="navbar-nav me-auto">
              <li class="nav-item">
                <a
                  class="nav-link"
                  routerLink="/dashboard"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: true }"
                  (click)="cerrarMenu()"
                >
                  <i class="bi bi-speedometer2 me-1"></i>Dashboard
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  routerLink="/productos"
                  routerLinkActive="active"
                  (click)="cerrarMenu()"
                >
                  <i class="bi bi-box-seam me-1"></i>Productos
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  routerLink="/categorias"
                  routerLinkActive="active"
                  (click)="cerrarMenu()"
                >
                  <i class="bi bi-tags me-1"></i>Categorías
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  routerLink="/movimientos"
                  routerLinkActive="active"
                  (click)="cerrarMenu()"
                >
                  <i class="bi bi-arrow-left-right me-1"></i>Movimientos
                </a>
              </li>
            </ul>
            <span class="navbar-text me-3 small">
              <i class="bi bi-person-circle me-1"></i>{{ auth.usuario()?.nombre }}
            </span>
            <button
              class="btn btn-outline-danger btn-sm"
              type="button"
              (click)="cerrarSesion()"
            >
              <i class="bi bi-box-arrow-right me-1"></i>Cerrar sesión
            </button>
          } @else {
            <a class="btn btn-primary btn-sm ms-auto" routerLink="/login" (click)="cerrarMenu()">
              <i class="bi bi-box-arrow-in-right me-1"></i>Iniciar sesión
            </a>
          }
        </div>
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly menuAbierto = signal(false);

  /**
   * Sin sesión activa → redirige automáticamente a /login
   * (al iniciar sin token o cuando el token desaparece de localStorage).
   */
  private readonly proteccionSesion = effect(() => {
    if (this.auth.autenticado()) {
      return;
    }
    const url = this.router.url;
    if (!url.startsWith('/login') && url !== '/') {
      void this.router.navigate(['/login']);
    }
  });

  alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  cerrarSesion(): void {
    this.auth.logout();
    this.cerrarMenu();
    void this.router.navigate(['/login']);
  }
}
