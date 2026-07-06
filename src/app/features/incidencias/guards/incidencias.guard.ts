import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

/** Lista de incidencias — requiere `incidencia:read` (ADMIN, RECEPCION). */
export const incidenciasGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.hasPermission('incidencia:read')) return true;
  return router.createUrlTree(['/dashboard']);
};
