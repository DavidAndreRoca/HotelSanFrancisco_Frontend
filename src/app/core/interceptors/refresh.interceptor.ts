import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AuthStore } from '../auth/auth.store';

// Single-flight: una sola llamada a /auth/refresh a la vez. El refresh token es
// de un solo uso con detección de reúso en el backend; si dos requests 401 en
// paralelo llamaran a /refresh, la 2ª llegaría con un token cuya sesión ya fue
// CERRADA y el backend lo trataría como ataque, revocando TODAS las sesiones.
// Por eso las 401 concurrentes comparten el mismo refresh$ (shareReplay) y solo
// la primera lo dispara; las demás esperan y reintentan con las cookies nuevas.
let refresh$: Observable<unknown> | null = null;

// Marca una request ya reintentada tras un refresh. Evita el loop infinito si el
// reintento vuelve a dar 401: en ese caso propagamos y deja que errorInterceptor
// haga clear() + redirect. El corte tiene que estar en el front (el backend no
// frena el loop).
const RETRIED = new HttpContextToken<boolean>(() => false);

// No refrescamos ante 401 en estas rutas: /refresh y /login evitarían un loop;
// las públicas no tienen sesión que renovar.
const NO_REFRESH_SUFFIXES = ['/auth/refresh', '/auth/login'];
const NO_REFRESH_PREFIXES = ['/api/v1/tipos-habitacion', '/api/v1/booking'];

function shouldSkip(req: HttpRequest<unknown>): boolean {
  const path = new URL(req.url, window.location.origin).pathname;
  return (
    NO_REFRESH_SUFFIXES.some((s) => path.endsWith(s)) ||
    NO_REFRESH_PREFIXES.some((p) => path.startsWith(p))
  );
}

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const store = inject(AuthStore);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Solo 401. El 403 es falta de permiso (p. ej. pago:read), no expiración.
      if (err.status !== 401) return throwError(() => err);

      // Ya reintentada, ruta excluida, o sin sesión que renovar → propaga y deja
      // que errorInterceptor cierre/redirija.
      if (req.context.get(RETRIED) || shouldSkip(req) || !store.isAuthenticated()) {
        return throwError(() => err);
      }

      // Dispara el refresh compartido solo la primera vez; el resto se cuelga del
      // mismo observable. shareReplay(1) evita que las suscripciones tardías
      // (las que llegan después de que el refresh ya emitió) queden colgadas.
      refresh$ ??= auth.refresh().pipe(shareReplay(1));

      return refresh$.pipe(
        switchMap((user) => {
          refresh$ = null;
          // refresh() traga el error y devuelve null en fallo (ya limpió cookies
          // y store). Sin usuario → refresh fallido: propaga el 401 original.
          if (!user) return throwError(() => err);
          // Éxito: cookies nuevas ya seteadas. Reintenta una única vez.
          return next(req.clone({ context: req.context.set(RETRIED, true) }));
        }),
        catchError(() => {
          refresh$ = null;
          return throwError(() => err);
        }),
      );
    }),
  );
};
