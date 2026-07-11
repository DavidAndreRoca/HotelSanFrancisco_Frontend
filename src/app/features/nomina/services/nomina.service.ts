import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, QueryParams } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import {
  CalcularNominaRequest,
  CalculoNominaResponse,
  CambiarEstadoPagoNominaRequest,
  CreatePagoNominaRequest,
  PagoNominaFilterRequest,
  PagoNominaResponse,
} from '../models/nomina.model';

@Injectable({ providedIn: 'root' })
export class NominaService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/pagos-nomina';

  listarPaginado(filtros: PagoNominaFilterRequest = {}): Observable<PageResponse<PagoNominaResponse>> {
    return this.api.get<PageResponse<PagoNominaResponse>>(this.base, {
      params: filtros as QueryParams,
    });
  }

  obtenerPorId(id: number): Observable<PagoNominaResponse> {
    return this.api.get<PagoNominaResponse>(`${this.base}/${id}`);
  }

  /** Crear pago. El backend pone totalBonos=0 y calcula montoNeto. */
  crear(payload: CreatePagoNominaRequest): Observable<PagoNominaResponse> {
    return this.api.post<PagoNominaResponse, CreatePagoNominaRequest>(this.base, payload);
  }

  /** Preview del cálculo desde asistencia. No persiste nada. */
  calcular(payload: CalcularNominaRequest): Observable<CalculoNominaResponse> {
    return this.api.post<CalculoNominaResponse, CalcularNominaRequest>(
      `${this.base}/calcular`,
      payload,
    );
  }

  /** Cambiar estado (PATCH). Solo PENDIENTE → PAGADO|ANULADO. */
  cambiarEstado(
    id: number,
    payload: CambiarEstadoPagoNominaRequest,
  ): Observable<PagoNominaResponse> {
    return this.api.patch<PagoNominaResponse, CambiarEstadoPagoNominaRequest>(
      `${this.base}/${id}/estado`,
      payload,
    );
  }

  /** Eliminación física. El backend rechaza si está PAGADO. */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }
}
