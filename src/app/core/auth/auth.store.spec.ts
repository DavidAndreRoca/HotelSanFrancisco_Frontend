import { AuthStore } from './auth.store';
import { AuthUser } from './auth-user.interface';

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    usuarioId: 1,
    nombre: 'Usuario',
    apellidoPaterno: 'Test',
    apellidoMaterno: 'Prueba',
    nombreCompleto: 'Usuario Test Prueba',
    correo: 'test@hotel.com',
    rol: 'ADMIN',
    permisos: ['clientes:read', 'clientes:write'],
    ...overrides,
  };
}

describe('AuthStore', () => {
  let store: AuthStore;

  beforeEach(() => {
    store = new AuthStore();
  });

  it('arranca sin usuario, no autenticado y no listo', () => {
    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.ready()).toBe(false);
    expect(store.permisos()).toEqual([]);
    expect(store.rol()).toBeNull();
  });

  it('setUser establece el usuario y marca listo', () => {
    store.setUser(makeUser());
    expect(store.isAuthenticated()).toBe(true);
    expect(store.ready()).toBe(true);
    expect(store.rol()).toBe('ADMIN');
  });

  it('clear elimina el usuario pero mantiene ready', () => {
    store.setUser(makeUser());
    store.clear();
    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.ready()).toBe(true);
  });

  it('markReady marca listo sin usuario', () => {
    store.markReady();
    expect(store.ready()).toBe(true);
    expect(store.isAuthenticated()).toBe(false);
  });

  describe('hasPermission', () => {
    it('true si el usuario tiene el permiso', () => {
      store.setUser(makeUser());
      expect(store.hasPermission('clientes:read')).toBe(true);
    });

    it('false si no lo tiene', () => {
      store.setUser(makeUser());
      expect(store.hasPermission('usuarios:write')).toBe(false);
    });

    it('false sin usuario', () => {
      expect(store.hasPermission('clientes:read')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('true si tiene al menos uno', () => {
      store.setUser(makeUser());
      expect(store.hasAnyPermission(['usuarios:write', 'clientes:read'])).toBe(true);
    });

    it('false si no tiene ninguno', () => {
      store.setUser(makeUser());
      expect(store.hasAnyPermission(['usuarios:write', 'roles:read'])).toBe(false);
    });

    it('false con lista vacía', () => {
      store.setUser(makeUser());
      expect(store.hasAnyPermission([])).toBe(false);
    });
  });
});
