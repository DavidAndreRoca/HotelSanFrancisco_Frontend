import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

/** Protege la vista de Asistencia — requiere `asistencia:read` (rol RRHH). */
export const asistenciaGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.hasPermission('asistencia:read')) return true;
  return router.createUrlTree(['/dashboard']);
};
