import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { errorInterceptor } from './error.interceptor';
import { AuthStore } from '../auth/auth.store';
import { AuthUser } from '../auth/auth-user.interface';

const user: AuthUser = {
  usuarioId: 1,
  nombre: 'U',
  apellidoPaterno: 'T',
  apellidoMaterno: 'P',
  nombreCompleto: 'U T P',
  correo: 'u@t.com',
  rol: 'ADMIN',
  permisos: [],
};

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let store: AuthStore;
  let router: Router;
  let toastr: { error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    toastr = { error: vi.fn(), warning: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ToastrService, useValue: toastr },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  function request(url: string): { error?: HttpErrorResponse & { friendlyMessage?: string } } {
    const captured: { error?: HttpErrorResponse & { friendlyMessage?: string } } = {};
    http.get(url).subscribe({ error: (e) => (captured.error = e) });
    return captured;
  }

  it('401 en ruta privada: limpia sesión, toast y redirect a /login', () => {
    store.setUser(user);
    const captured = request('/api/v1/usuarios');
    httpMock.expectOne('/api/v1/usuarios').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(store.isAuthenticated()).toBe(false);
    expect(toastr.warning).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], expect.anything());
    expect(captured.error?.status).toBe(401);
  });

  it('401 en ruta pública (booking): NO limpia sesión ni redirige', () => {
    store.setUser(user);
    request('/api/v1/booking/disponibilidad');
    httpMock
      .expectOne('/api/v1/booking/disponibilidad')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(store.isAuthenticated()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('401 en /auth/me (suprimida): limpia sesión pero sin toast ni redirect', () => {
    store.setUser(user);
    request('/auth/me');
    httpMock.expectOne('/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(store.isAuthenticated()).toBe(false);
    expect(toastr.warning).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('403: toast de acceso denegado, sin redirect', () => {
    request('/api/v1/roles');
    httpMock.expectOne('/api/v1/roles').flush(null, { status: 403, statusText: 'Forbidden' });
    expect(toastr.error).toHaveBeenCalledWith(expect.any(String), 'Acceso denegado');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('400: toast "Datos inválidos" con el mensaje del backend', () => {
    request('/api/v1/clientes');
    httpMock
      .expectOne('/api/v1/clientes')
      .flush({ message: 'El correo ya existe' }, { status: 400, statusText: 'Bad Request' });
    expect(toastr.error).toHaveBeenCalledWith('El correo ya existe', 'Datos inválidos');
  });

  it('500: toast genérico de error de servidor', () => {
    request('/api/v1/pagos');
    httpMock.expectOne('/api/v1/pagos').flush(null, { status: 500, statusText: 'Server Error' });
    expect(toastr.error).toHaveBeenCalledWith(expect.any(String), 'Error');
  });

  it('status 0: toast de sin conexión', () => {
    http.get('/api/v1/x').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/v1/x').error(new ProgressEvent('error'), { status: 0 });
    expect(toastr.error).toHaveBeenCalledWith(expect.any(String), 'Sin conexión');
  });

  it('adjunta friendlyMessage y preserva instanceof HttpErrorResponse', () => {
    const captured = request('/api/v1/clientes');
    httpMock
      .expectOne('/api/v1/clientes')
      .flush({ message: 'Documento duplicado' }, { status: 422, statusText: 'Unprocessable' });

    expect(captured.error?.friendlyMessage).toBe('Documento duplicado');
    expect(captured.error).toBeInstanceOf(HttpErrorResponse);
  });
});
