import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

/**
 * Protege la vista de Auditoría — requiere el permiso `auditoria:read`
 * (solo ADMIN lo tiene en el seed del backend). Sin él, redirige al dashboard.
 */
export const auditoriaGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.hasPermission('auditoria:read')) return true;
  return router.createUrlTree(['/dashboard']);
};
