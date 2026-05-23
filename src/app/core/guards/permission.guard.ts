import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthStore } from '../auth/auth.store';

export function hasPermission(permission: string): CanActivateFn {
  return () => {
    const store = inject(AuthStore);
    const router = inject(Router);
    const toastr = inject(ToastrService);
    if (store.hasPermission(permission)) return true;
    toastr.error('No tienes permiso para acceder a esa sección.', 'Acceso denegado');
    return router.createUrlTree(['/dashboard']);
  };
}

export function hasAnyPermission(permissions: readonly string[]): CanActivateFn {
  return () => {
    const store = inject(AuthStore);
    const router = inject(Router);
    const toastr = inject(ToastrService);
    if (store.hasAnyPermission(permissions)) return true;
    toastr.error('No tienes permiso para acceder a esa sección.', 'Acceso denegado');
    return router.createUrlTree(['/dashboard']);
  };
}
