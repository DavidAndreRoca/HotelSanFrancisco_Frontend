import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { authGuard, publicOnlyGuard } from './auth.guard';
import { AuthStore } from '../auth/auth.store';
import { AuthUser } from '../auth/auth-user.interface';

function makeUser(rol: string): AuthUser {
  return {
    usuarioId: 1,
    nombre: 'U',
    apellidoPaterno: 'T',
    apellidoMaterno: 'P',
    nombreCompleto: 'U T P',
    correo: 'u@t.com',
    rol,
    permisos: [],
  };
}

const route = {} as ActivatedRouteSnapshot;
const state = { url: '/reports' } as RouterStateSnapshot;

describe('authGuard', () => {
  let store: AuthStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    store = TestBed.inject(AuthStore);
  });

  it('permite el paso si hay sesión', () => {
    store.setUser(makeUser('ADMIN'));
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(true);
  });

  it('redirige a /login con returnUrl si no hay sesión', () => {
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBeInstanceOf(UrlTree);
    const tree = result as UrlTree;
    expect(tree.toString()).toContain('/login');
    expect(tree.queryParams['returnUrl']).toBe('/reports');
  });
});

describe('publicOnlyGuard', () => {
  let store: AuthStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    store = TestBed.inject(AuthStore);
  });

  it('permite el paso sin sesión', () => {
    const result = TestBed.runInInjectionContext(() => publicOnlyGuard(route, state));
    expect(result).toBe(true);
  });

  it('redirige al staff autenticado a /dashboard', () => {
    store.setUser(makeUser('ADMIN'));
    const result = TestBed.runInInjectionContext(() => publicOnlyGuard(route, state));
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });

  it('redirige al cliente autenticado a /dashboard-cliente', () => {
    store.setUser(makeUser('CLIENTE'));
    const result = TestBed.runInInjectionContext(() => publicOnlyGuard(route, state));
    expect((result as UrlTree).toString()).toBe('/dashboard-cliente');
  });
});
