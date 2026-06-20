import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, QueryParams } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import {
  AsistenciaFilterRequest,
  AsistenciaResponse,
  CreateAsistenciaRequest,
  UpdateAsistenciaRequest,
} from '../models/asistencia.model';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/asistencias';

  listarPaginado(filtros: AsistenciaFilterRequest = {}): Observable<PageResponse<AsistenciaResponse>> {
    return this.api.get<PageResponse<AsistenciaResponse>>(this.base, {
      params: filtros as QueryParams,
    });
  }

  obtenerPorId(id: number): Observable<AsistenciaResponse> {
    return this.api.get<AsistenciaResponse>(`${this.base}/${id}`);
  }

  /** Registrar entrada (POST). Sin horaEgreso ni horasTrabajadas. */
  registrarEntrada(payload: CreateAsistenciaRequest): Observable<AsistenciaResponse> {
    return this.api.post<AsistenciaResponse, CreateAsistenciaRequest>(this.base, payload);
  }

  /** Registrar salida / actualizar (PUT). El backend calcula horasTrabajadas. */
  registrarSalida(id: number, payload: UpdateAsistenciaRequest): Observable<AsistenciaResponse> {
    return this.api.put<AsistenciaResponse, UpdateAsistenciaRequest>(`${this.base}/${id}`, payload);
  }

  /** Eliminación física. */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }
}
