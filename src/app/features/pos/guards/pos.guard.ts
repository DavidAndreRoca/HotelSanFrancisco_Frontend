import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

/** Lista de ventas — requiere `venta:read` (ADMIN, RECEPCION, CAJA). */
export const posGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.hasPermission('venta:read')) return true;
  return router.createUrlTree(['/dashboard']);
};

/** Crear venta — requiere `venta:create` (ADMIN, CAJA). */
export const ventaCreateGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.hasPermission('venta:create')) return true;
  return router.createUrlTree(['/pos']);
};
