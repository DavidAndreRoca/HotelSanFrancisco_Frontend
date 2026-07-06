import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

/** Catálogo de productos / inventario — requiere `producto:read` (ADMIN, INVENTARIO, CAJA). */
export const productsGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.hasPermission('producto:read')) return true;
  return router.createUrlTree(['/dashboard']);
};
