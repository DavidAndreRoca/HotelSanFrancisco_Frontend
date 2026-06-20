import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

/** Consumos de servicio — requiere `servicio:read` (ADMIN, RECEPCION). */
export const serviciosGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.hasPermission('servicio:read')) return true;
  return router.createUrlTree(['/dashboard']);
};

/** Catálogo de tipos de servicio — requiere `tipo-servicio:read` (ADMIN, RECEPCION). */
export const tiposServicioGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.hasPermission('tipo-servicio:read')) return true;
  return router.createUrlTree(['/dashboard']);
};
