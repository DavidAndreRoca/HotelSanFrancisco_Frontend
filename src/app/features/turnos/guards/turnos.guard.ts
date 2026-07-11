import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

/** Protege la planificación de Turnos — requiere `turnos:read` (ADMIN/RRHH). */
export const turnosGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.hasPermission('turnos:read')) return true;
  return router.createUrlTree(['/dashboard']);
};
