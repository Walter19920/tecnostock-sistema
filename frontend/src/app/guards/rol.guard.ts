import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ROL_ADMIN, Rol } from '../interfaces/auth.interface';
import { AuthService } from '../services/auth.service';

/**
 * Guard de sesión: exige un token guardado en el cliente.
 * Sin sesión activa redirige a /login.
 */
export const sesionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.autenticado() ? true : router.createUrlTree(['/login']);
};

/**
 * Guard de rol: exige que el rol guardado en el cliente coincida con el
 * rol requerido por la ruta. Si no coincide, redirige a la vista propia
 * del rol activo (/admin o /almacen) para bloquear el acceso directo.
 */
export const rolGuard = (rolRequerido: Rol): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.autenticado()) {
    return router.createUrlTree(['/login']);
  }

  // Sesiones antiguas sin rol explícito se tratan como Administrador.
  const rolActual = auth.rol() ?? ROL_ADMIN;
  return rolActual === rolRequerido ? true : router.createUrlTree([auth.rutaInicio()]);
};
