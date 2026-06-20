import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

/** Protege la vista de Nómina — requiere `nomina:read` (rol RRHH). */
export const nominaGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.hasPermission('nomina:read')) return true;
  return router.createUrlTree(['/dashboard']);
};
