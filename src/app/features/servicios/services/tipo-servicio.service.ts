import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, QueryParams } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import {
  CreateTipoServicioRequest,
  EstadoActivo,
  ServicioCatalogoItem,
  TipoServicioFilterRequest,
  TipoServicioResponse,
  UpdateTipoServicioRequest,
} from '../models/servicio.model';

@Injectable({ providedIn: 'root' })
export class TipoServicioService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/tipos-servicio';

  listarPaginado(
    filtros: TipoServicioFilterRequest = {},
  ): Observable<PageResponse<TipoServicioResponse>> {
    return this.api.get<PageResponse<TipoServicioResponse>>(this.base, {
      params: filtros as QueryParams,
    });
  }

  /** Lista sin paginar — para poblar selects (GET /estado/{estado}). */
  listarPorEstado(estado: EstadoActivo): Observable<TipoServicioResponse[]> {
    return this.api.get<TipoServicioResponse[]>(`${this.base}/estado/${estado}`);
  }

  /**
   * Catálogo de servicios visible para el rol CLIENTE (solo ACTIVO).
   * Endpoint seguro con permiso `servicio-catalogo:read`, separado del
   * catálogo administrativo `/tipos-servicio` (que exige `tipo-servicio:read`).
   */
  listarCatalogoCliente(): Observable<ServicioCatalogoItem[]> {
    return this.api.get<ServicioCatalogoItem[]>('/api/v1/servicios-catalogo');
  }

  obtenerPorId(id: number): Observable<TipoServicioResponse> {
    return this.api.get<TipoServicioResponse>(`${this.base}/${id}`);
  }

  crear(payload: CreateTipoServicioRequest): Observable<TipoServicioResponse> {
    return this.api.post<TipoServicioResponse, CreateTipoServicioRequest>(this.base, payload);
  }

  actualizar(id: number, payload: UpdateTipoServicioRequest): Observable<TipoServicioResponse> {
    return this.api.put<TipoServicioResponse, UpdateTipoServicioRequest>(`${this.base}/${id}`, payload);
  }

  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }
}
