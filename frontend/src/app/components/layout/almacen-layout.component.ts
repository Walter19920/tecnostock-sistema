import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../services/auth.service';

/**
 * Vista Almacenero (/almacen): barra lateral enfocada en stock,
 * entradas y salidas (sin gestión de categorías).
 */
@Component({
  selector: 'app-almacen-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './almacen-layout.component.html',
})
export class AlmacenLayoutComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly menuAbierto = signal(false);

  constructor() {
    /*
     * Cierra el menú móvil en cada navegación. Si quedara abierto, el scrim
     * (position: fixed a pantalla completa) permanecería en el DOM y
     * bloquearía los clics de toda la vista.
     */
    this.router.events
      .pipe(
        filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.cerrarMenu());
  }

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
