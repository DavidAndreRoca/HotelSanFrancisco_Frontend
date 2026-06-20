import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

/** Protege las vistas de Horarios — requiere `horario:read` (rol RRHH). */
export const horariosGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.hasPermission('horario:read')) return true;
  return router.createUrlTree(['/dashboard']);
};
