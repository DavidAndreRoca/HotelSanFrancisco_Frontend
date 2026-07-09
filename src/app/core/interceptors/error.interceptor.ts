import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';
import { ApiErrorBody } from '../api/api-response.interface';
import { AuthStore } from '../auth/auth.store';

const SUPPRESS_TOAST_PATHS = ['/auth/me', '/auth/refresh'];

// La consulta RENIEC maneja sus errores inline (DNI no hallado, RENIEC caído…),
// no debe disparar el toast global de "Datos inválidos".
const SUPPRESS_TOAST_PREFIXES = ['/auth/reniec'];

// El 409 (habitación ya tomada) al crear/editar reservas lo maneja el componente:
// muestra el message del backend y devuelve al usuario a la selección de habitación.
const CONFLICT_HANDLED_PREFIXES = ['/api/v1/booking', '/api/v1/reservas'];

// Rutas públicas que no deben redirigir al login ante un 401
const PUBLIC_API_PATHS = [
  '/api/v1/tipos-habitacion',
  '/api/v1/booking',
];

// Endpoints del flujo de verificación de correo cuyos errores de negocio los
// muestra el propio componente (código incorrecto/expirado, cuenta sin verificar…).
const EMAIL_VERIFICATION_HANDLED_PATHS = ['/auth/verify-email'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const router = inject(Router);
  const auth = inject(AuthStore);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const message = extractMessage(err);
      const code = extractCode(err);
      const path = new URL(req.url, window.location.origin).pathname;
      const suppress =
        SUPPRESS_TOAST_PATHS.some((p) => path.endsWith(p)) ||
        SUPPRESS_TOAST_PREFIXES.some((p) => path.startsWith(p));

      const isPublicPath = PUBLIC_API_PATHS.some((p) => path.startsWith(p));
      const isLogin = path.endsWith('/auth/login');
      const isEmailVerification = EMAIL_VERIFICATION_HANDLED_PATHS.some((p) => path.endsWith(p));

      if (err.status === 0) {
        if (!suppress) toastr.error('No se pudo conectar con el servidor.', 'Sin conexión');
      } else if (err.status === 401) {
        if (!isPublicPath) auth.clear();
        if (!isLogin && !suppress && !isPublicPath) {
          toastr.warning('Tu sesión ha expirado. Inicia sesión nuevamente.');
          router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
        }
      } else if (err.status === 403) {
        // Login público → un 403 solo puede ser EMAIL_NOT_VERIFIED (caso de negocio
        // que maneja el componente); no lo tratamos como "acceso denegado".
        if (!suppress && !(isLogin && code === 'EMAIL_NOT_VERIFIED')) {
          toastr.error('No tienes permiso para realizar esta acción.', 'Acceso denegado');
        }
      } else if (err.status === 409 && CONFLICT_HANDLED_PREFIXES.some((p) => path.startsWith(p))) {
        // Sin toast global: el componente de reserva lo notifica y redirige.
      } else if (err.status === 422 || err.status === 400) {
        // La pantalla "Verifica tu cuenta" muestra el message/fieldErrors inline.
        if (!suppress && !isEmailVerification) toastr.error(message, 'Datos inválidos');
      } else if (err.status >= 500) {
        if (!suppress) toastr.error('Ocurrió un error en el servidor. Intenta de nuevo.', 'Error');
      } else if (!suppress) {
        toastr.error(message);
      }

      // Clona preservando el prototipo: el spread plano rompía instanceof HttpErrorResponse.
      return throwError(() =>
        Object.assign(Object.create(Object.getPrototypeOf(err)), err, {
          friendlyMessage: message,
          code,
        }),
      );
    }),
  );
};

function extractCode(err: HttpErrorResponse): string | null {
  const body = err.error as ApiErrorBody | string | null | undefined;
  if (body && typeof body === 'object' && 'code' in body && body.code) {
    return body.code;
  }
  return null;
}

function extractMessage(err: HttpErrorResponse): string {
  const body = err.error as ApiErrorBody | string | null | undefined;
  if (typeof body === 'string' && body.trim().length > 0) return body;
  if (body && typeof body === 'object' && 'message' in body && body.message) {
    return body.message;
  }
  return err.message || 'Error desconocido';
}
