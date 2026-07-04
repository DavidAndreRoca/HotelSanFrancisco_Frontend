import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { csrfInterceptor } from './csrf.interceptor';
import { credentialsInterceptor } from './credentials.interceptor';
import { environment } from '../../../environments/environment';

describe('csrfInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor, csrfInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('añade X-Requested-With a las peticiones a la API (defensa CSRF)', () => {
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
    req.flush({});
  });

  it('también en GET (inofensivo; el backend solo lo exige en mutaciones)', () => {
    http.get(`${environment.apiUrl}/api/v1/clientes`).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/clientes`);
    expect(req.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
    req.flush({});
  });

  it('NO añade el header a URLs fuera de la API', () => {
    http.get('https://servicio-externo.com/data').subscribe();
    const req = httpMock.expectOne('https://servicio-externo.com/data');
    expect(req.request.headers.has('X-Requested-With')).toBe(false);
    req.flush({});
  });

  it('credentialsInterceptor fuerza withCredentials para que viajen las cookies', () => {
    http.get(`${environment.apiUrl}/auth/me`).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });
});
