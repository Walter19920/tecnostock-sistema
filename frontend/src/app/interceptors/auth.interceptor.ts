import { HttpInterceptorFn } from '@angular/common/http';
import { CLAVE_TOKEN } from '../services/auth.service';
import { environment } from '../../environments/environment';

/**
 * Adjunta `Authorization: Bearer <token>` a toda petición saliente hacia la API.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = environment.apiUrl;

  // Verifica si la petición va hacia el backend (sea 127.0.0.1 o localhost)
  const esPeticionApi =
    req.url.startsWith(apiUrl) ||
    req.url.includes('127.0.0.1:8000') ||
    req.url.includes('localhost:8000');

  if (!esPeticionApi) {
    return next(req);
  }

  const token = localStorage.getItem(CLAVE_TOKEN);
  if (!token) {
    return next(req);
  }

  // Adjunta el token JWT en las cabeceras
  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
