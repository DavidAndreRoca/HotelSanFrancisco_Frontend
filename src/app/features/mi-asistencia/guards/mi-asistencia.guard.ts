import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

/** Protege "Mi Asistencia" — requiere `mi-asistencia:marcar` (RECEPCION, CAJA, RRHH, INVENTARIO, ADMIN). */
export const miAsistenciaGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.hasPermission('mi-asistencia:marcar')) return true;
  return router.createUrlTree(['/dashboard']);
};
