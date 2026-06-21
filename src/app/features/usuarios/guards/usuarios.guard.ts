import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

/** Protege las vistas de Usuarios — requiere `usuario:read` (ADMIN, RRHH). */
export const usuariosGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.hasPermission('usuario:read')) return true;
  return router.createUrlTree(['/dashboard']);
};
