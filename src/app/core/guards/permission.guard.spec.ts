import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { hasPermission, hasAnyPermission, noClienteGuard } from './permission.guard';
import { AuthStore } from '../auth/auth.store';
import { AuthUser } from '../auth/auth-user.interface';

function makeUser(rol: string, permisos: string[] = []): AuthUser {
  return {
    usuarioId: 1,
    nombre: 'U',
    apellidoPaterno: 'T',
    apellidoMaterno: 'P',
    nombreCompleto: 'U T P',
    correo: 'u@t.com',
    rol,
    permisos,
  };
}

const route = {} as ActivatedRouteSnapshot;
const state = { url: '/x' } as RouterStateSnapshot;

describe('permission guards', () => {
  let store: AuthStore;
  let toastrError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    toastrError = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ToastrService, useValue: { error: toastrError } },
      ],
    });
    store = TestBed.inject(AuthStore);
  });

  describe('hasPermission', () => {
    it('permite el paso con el permiso requerido', () => {
      store.setUser(makeUser('RECEPCION', ['usuarios:read']));
      const result = TestBed.runInInjectionContext(() =>
        hasPermission('usuarios:read')(route, state),
      );
      expect(result).toBe(true);
      expect(toastrError).not.toHaveBeenCalled();
    });

    it('sin permiso: toast de acceso denegado y redirect a /dashboard', () => {
      store.setUser(makeUser('RECEPCION', ['clientes:read']));
      const result = TestBed.runInInjectionContext(() =>
        hasPermission('usuarios:read')(route, state),
      );
      expect((result as UrlTree).toString()).toBe('/dashboard');
      expect(toastrError).toHaveBeenCalled();
    });

    it('sin sesión: deniega', () => {
      const result = TestBed.runInInjectionContext(() =>
        hasPermission('usuarios:read')(route, state),
      );
      expect(result).toBeInstanceOf(UrlTree);
    });
  });

  describe('hasAnyPermission', () => {
    it('permite con al menos uno de los permisos', () => {
      store.setUser(makeUser('RECEPCION', ['b']));
      const result = TestBed.runInInjectionContext(() =>
        hasAnyPermission(['a', 'b'])(route, state),
      );
      expect(result).toBe(true);
    });

    it('deniega sin ninguno', () => {
      store.setUser(makeUser('RECEPCION', ['c']));
      const result = TestBed.runInInjectionContext(() =>
        hasAnyPermission(['a', 'b'])(route, state),
      );
      expect(result).toBeInstanceOf(UrlTree);
    });
  });

  describe('noClienteGuard', () => {
    it('permite el paso al staff', () => {
      store.setUser(makeUser('ADMIN'));
      const result = TestBed.runInInjectionContext(() => noClienteGuard(route, state));
      expect(result).toBe(true);
    });

    it('redirige al CLIENTE a /dashboard-cliente con toast', () => {
      store.setUser(makeUser('CLIENTE'));
      const result = TestBed.runInInjectionContext(() => noClienteGuard(route, state));
      expect((result as UrlTree).toString()).toBe('/dashboard-cliente');
      expect(toastrError).toHaveBeenCalled();
    });
  });
});
