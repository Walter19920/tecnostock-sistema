import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../services/auth.service';

/**
 * Vista Almacenero (/almacen): barra lateral enfocada en stock,
 * entradas y salidas (sin gestión de categorías).
 */
@Component({
  selector: 'app-almacen-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="ts-layout">
      @if (menuAbierto()) {
        <button
          class="ts-scrim"
          type="button"
          aria-label="Cerrar menú"
          (click)="cerrarMenu()"
        ></button>
      }

      <aside class="ts-sidebar" [class.ts-abierto]="menuAbierto()">
        <div class="ts-marca">
          <i class="bi bi-box-seam"></i>
          <span>TecnoStock</span>
        </div>
        <div class="px-3 pb-1">
          <span class="badge bg-primary w-100 text-center">Panel Almacén</span>
        </div>

        <nav class="ts-nav">
          <div class="ts-seccion">Stock</div>
          <a
            routerLink="/almacen/dashboard"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="cerrarMenu()"
          >
            <i class="bi bi-speedometer2"></i><span>Dashboard</span>
          </a>
          <a routerLink="/almacen/productos" routerLinkActive="active" (click)="cerrarMenu()">
            <i class="bi bi-box-seam"></i><span>Productos</span>
          </a>

          <div class="ts-seccion">Operaciones</div>
          <a routerLink="/almacen/movimientos" routerLinkActive="active" (click)="cerrarMenu()">
            <i class="bi bi-arrow-left-right"></i><span>Entradas y salidas</span>
          </a>
        </nav>

        <div class="ts-pie">
          <div class="ts-usuario">
            <i class="bi bi-person-circle"></i>
            <div>
              <span>{{ auth.usuario()?.nombre }}</span>
              <small>{{ auth.etiquetaRol() }}</small>
            </div>
          </div>
          <button class="btn btn-outline-light btn-sm w-100" type="button" (click)="cerrarSesion()">
            <i class="bi bi-box-arrow-right me-1"></i>Cerrar sesión
          </button>
        </div>
      </aside>

      <div class="ts-main">
        <header class="ts-topbar">
          <div class="d-flex align-items-center gap-2">
            <button
              class="btn btn-light btn-sm ts-btn-menu"
              type="button"
              aria-label="Abrir menú"
              (click)="alternarMenu()"
            >
              <i class="bi bi-list"></i>
            </button>
            <span class="ts-topbar-titulo">Panel de Almacén</span>
          </div>
          <span class="badge bg-primary">{{ auth.etiquetaRol() }}</span>
        </header>

        <div class="ts-contenido">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
})
export class AlmacenLayoutComponent {
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
