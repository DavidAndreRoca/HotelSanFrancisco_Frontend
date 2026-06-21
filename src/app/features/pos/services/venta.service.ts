import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, QueryParams } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import {
  CambiarEstadoVentaRequest,
  CreateVentaRequest,
  UpdateVentaRequest,
  VentaFilterRequest,
  VentaResponse,
} from '../models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/ventas';

  listar(filtros: VentaFilterRequest = {}): Observable<PageResponse<VentaResponse>> {
    return this.api.get<PageResponse<VentaResponse>>(this.base, { params: filtros as QueryParams });
  }

  obtenerPorId(id: number): Observable<VentaResponse> {
    return this.api.get<VentaResponse>(`${this.base}/${id}`);
  }

  obtenerPorCodigo(codigo: string): Observable<VentaResponse> {
    return this.api.get<VentaResponse>(`${this.base}/codigo/${codigo}`);
  }

  crear(payload: CreateVentaRequest): Observable<VentaResponse> {
    return this.api.post<VentaResponse, CreateVentaRequest>(this.base, payload);
  }

  /** Solo en estado PENDIENTE; no modifica detalles. */
  actualizar(id: number, payload: UpdateVentaRequest): Observable<VentaResponse> {
    return this.api.put<VentaResponse, UpdateVentaRequest>(`${this.base}/${id}`, payload);
  }

  /** Cambiar estado según la máquina de estados. */
  cambiarEstado(id: number, payload: CambiarEstadoVentaRequest): Observable<VentaResponse> {
    return this.api.patch<VentaResponse, CambiarEstadoVentaRequest>(`${this.base}/${id}/estado`, payload);
  }

  /** Solo si PENDIENTE o ANULADA. */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }
}
