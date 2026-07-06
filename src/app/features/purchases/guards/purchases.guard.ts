import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

/** Compras a proveedores — requiere `compra:read` (ADMIN, INVENTARIO). */
export const purchasesGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.hasPermission('compra:read')) return true;
  return router.createUrlTree(['/dashboard']);
};
