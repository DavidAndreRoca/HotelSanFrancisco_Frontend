import { HttpClient, HttpContext, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../api/api-response.interface';

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined | ReadonlyArray<string | number | boolean>
>;

interface RequestOptions {
  params?: QueryParams;
  context?: HttpContext;
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(path: string, options: RequestOptions = {}): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(this.url(path), this.opts(options))
      .pipe(map((res) => this.unwrap(res)));
  }

  post<T, B = unknown>(path: string, body: B, options: RequestOptions = {}): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.url(path), body, this.opts(options))
      .pipe(map((res) => this.unwrap(res)));
  }

  /**
   * POST que devuelve el sobre `ApiResponse` completo (no solo `data`).
   * Útil cuando el texto para el usuario viaja en `message` y `data` es null
   * (ej. reenvío de verificación).
   */
  postFull<T, B = unknown>(
    path: string,
    body: B,
    options: RequestOptions = {},
  ): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.url(path), body, this.opts(options));
  }

  /**
   * POST para descarga de archivos: pide la respuesta como `Blob` y observa la
   * respuesta completa (`HttpResponse`) para poder leer headers como
   * `Content-Disposition`. NO usa `responseType: 'json'`, por lo que Angular no
   * intenta parsear el cuerpo (evita el SyntaxError al recibir CSV/binario).
   */
  postBlob<B = unknown>(
    path: string,
    body: B,
    options: RequestOptions = {},
  ): Observable<HttpResponse<Blob>> {
    return this.http.post(this.url(path), body, {
      ...this.opts(options),
      responseType: 'blob',
      observe: 'response',
    });
  }

  put<T, B = unknown>(path: string, body: B, options: RequestOptions = {}): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(this.url(path), body, this.opts(options))
      .pipe(map((res) => this.unwrap(res)));
  }

  patch<T, B = unknown>(path: string, body: B, options: RequestOptions = {}): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(this.url(path), body, this.opts(options))
      .pipe(map((res) => this.unwrap(res)));
  }

  delete<T = void, B = unknown>(
    path: string,
    options: RequestOptions & { body?: B } = {},
  ): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(this.url(path), { ...this.opts(options), body: options.body })
      .pipe(map((res) => this.unwrap(res)));
  }

  private url(path: string): string {
    return path.startsWith('http') ? path : `${this.baseUrl}${path}`;
  }

  private opts(options: RequestOptions) {
    return {
      withCredentials: true,
      params: this.buildParams(options.params),
      context: options.context,
    };
  }

  private buildParams(query?: QueryParams): HttpParams | undefined {
    if (!query) return undefined;
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === '') continue;
      if (Array.isArray(value)) {
        for (const v of value) params = params.append(key, String(v));
      } else {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  private unwrap<T>(res: ApiResponse<T>): T {
    return res.data as T;
  }
}
