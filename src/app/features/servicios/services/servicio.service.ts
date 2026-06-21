import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, QueryParams } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import {
  CreateServicioRequest,
  ServicioFilterRequest,
  ServicioResponse,
  UpdateServicioRequest,
} from '../models/servicio.model';

@Injectable({ providedIn: 'root' })
export class ServicioService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/servicios';

  listar(filtros: ServicioFilterRequest = {}): Observable<PageResponse<ServicioResponse>> {
    return this.api.get<PageResponse<ServicioResponse>>(this.base, { params: filtros as QueryParams });
  }

  /** Todos los consumos de una estancia (GET /estancia/{estanciaId}). */
  listarPorEstancia(estanciaId: number): Observable<ServicioResponse[]> {
    return this.api.get<ServicioResponse[]>(`${this.base}/estancia/${estanciaId}`);
  }

  obtenerPorId(id: number): Observable<ServicioResponse> {
    return this.api.get<ServicioResponse>(`${this.base}/${id}`);
  }

  crear(payload: CreateServicioRequest): Observable<ServicioResponse> {
    return this.api.post<ServicioResponse, CreateServicioRequest>(this.base, payload);
  }

  actualizar(id: number, payload: UpdateServicioRequest): Observable<ServicioResponse> {
    return this.api.put<ServicioResponse, UpdateServicioRequest>(`${this.base}/${id}`, payload);
  }

  /** Eliminación física. */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }
}
