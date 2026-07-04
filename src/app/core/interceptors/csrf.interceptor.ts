import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Defensa CSRF oficial (patrón custom-header, acordado con el backend):
// marca las peticiones a NUESTRA API como AJAX. Un origen malicioso no puede
// añadir este header sin pasar por el preflight CORS que el backend controla.
// Hoy el backend lo ignora (APP_CSRF_HEADER_ENABLED=false); al activarse, las
// mutaciones autenticadas por cookie sin él fallarán con 403 "CSRF_HEADER_MISSING".
// Se acota a apiUrl para no filtrar el header a terceros ni forzar preflights ajenos.
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);
  return next(req.clone({ setHeaders: { 'X-Requested-With': 'XMLHttpRequest' } }));
};
