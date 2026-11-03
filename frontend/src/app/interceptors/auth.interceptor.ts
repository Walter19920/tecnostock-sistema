import { HttpInterceptorFn } from '@angular/common/http';

import { CLAVE_TOKEN } from '../services/auth.service';

const API_URL = 'http://localhost:8000';

/**
 * Adjunta `Authorization: Bearer <token>` a toda petición saliente hacia la API
 * cuando existe un token guardado en localStorage.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) {
    return next(req);
  }

  const token = localStorage.getItem(CLAVE_TOKEN);
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }),
  );
};
