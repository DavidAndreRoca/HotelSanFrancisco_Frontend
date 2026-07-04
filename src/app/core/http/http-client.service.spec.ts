import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApiClient } from './http-client.service';
import { environment } from '../../../environments/environment';

describe('ApiClient', () => {
  let api: ApiClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('antepone apiUrl a rutas relativas', () => {
    api.get('/api/v1/clientes').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/clientes`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [] });
  });

  it('respeta URLs absolutas sin anteponer apiUrl', () => {
    api.get('https://otro-servidor.com/recurso').subscribe();
    const req = httpMock.expectOne('https://otro-servidor.com/recurso');
    req.flush({ success: true, data: null });
  });

  it('desempaqueta ApiResponse.data', () => {
    let resultado: unknown;
    api.get<{ id: number }>('/x').subscribe((r) => (resultado = r));
    httpMock.expectOne(`${environment.apiUrl}/x`).flush({
      success: true,
      data: { id: 7 },
    });
    expect(resultado).toEqual({ id: 7 });
  });

  it('envía withCredentials en todas las peticiones', () => {
    api.post('/x', { a: 1 }).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/x`);
    expect(req.request.withCredentials).toBe(true);
    req.flush({ success: true, data: null });
  });

  describe('query params', () => {
    it('omite null, undefined y cadena vacía', () => {
      api.get('/x', { params: { a: 1, b: null, c: undefined, d: '', e: 'ok' } }).subscribe();
      const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/x`);
      expect(req.request.params.get('a')).toBe('1');
      expect(req.request.params.has('b')).toBe(false);
      expect(req.request.params.has('c')).toBe(false);
      expect(req.request.params.has('d')).toBe(false);
      expect(req.request.params.get('e')).toBe('ok');
      req.flush({ success: true, data: null });
    });

    it('serializa arrays como valores repetidos', () => {
      api.get('/x', { params: { estado: ['A', 'B'] } }).subscribe();
      const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/x`);
      expect(req.request.params.getAll('estado')).toEqual(['A', 'B']);
      req.flush({ success: true, data: null });
    });

    it('convierte números y booleanos a string', () => {
      api.get('/x', { params: { page: 0, activo: false } }).subscribe();
      const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/x`);
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('activo')).toBe('false');
      req.flush({ success: true, data: null });
    });
  });

  it('delete admite body', () => {
    api.delete('/x', { body: { motivo: 'test' } }).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/x`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ motivo: 'test' });
    req.flush({ success: true, data: null });
  });
});
