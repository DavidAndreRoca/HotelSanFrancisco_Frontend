import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { resolverTier } from '../utils/solicitud-ui';

/**
 * Protege la vista "Gestión Global de Solicitudes" — exclusiva de Tier 1 (ADMIN).
 * Se resuelve por tier, no por nombre de rol, alineado con el modelo de permisos.
 */
export const solicitudGestionGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (resolverTier(store.rol()) === 1) return true;
  return router.createUrlTree(['/solicitudes']);
};
