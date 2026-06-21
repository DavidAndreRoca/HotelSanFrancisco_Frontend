import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

/** Protege las vistas de Roles — requiere `rol:read` (ADMIN, RRHH). */
export const rolesGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.hasPermission('rol:read')) return true;
  return router.createUrlTree(['/dashboard']);
};
