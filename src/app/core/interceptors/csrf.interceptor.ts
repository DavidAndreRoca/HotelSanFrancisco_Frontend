import { HttpInterceptorFn } from '@angular/common/http';

// Marca todas las peticiones como AJAX para la protección CSRF del backend.
// Hoy el backend ignora el header (APP_CSRF_HEADER_ENABLED=false); cuando se
// active, las mutaciones sin él fallarán con 403 y code "CSRF_HEADER_MISSING".
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ setHeaders: { 'X-Requested-With': 'XMLHttpRequest' } }));
};
