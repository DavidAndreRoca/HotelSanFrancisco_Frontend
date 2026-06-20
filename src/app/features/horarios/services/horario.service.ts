import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, QueryParams } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import {
  CreateHorarioRequest,
  EstadoActivo,
  HorarioFilterRequest,
  HorarioResponse,
  UpdateHorarioRequest,
} from '../models/horario.model';

@Injectable({ providedIn: 'root' })
export class HorarioService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/horarios';

  listarPaginado(filtros: HorarioFilterRequest = {}): Observable<PageResponse<HorarioResponse>> {
    return this.api.get<PageResponse<HorarioResponse>>(this.base, {
      params: filtros as QueryParams,
    });
  }

  /** Lista completa sin paginar — útil para poblar selects (GET /estado/{estado}). */
  listarPorEstado(estado: EstadoActivo): Observable<HorarioResponse[]> {
    return this.api.get<HorarioResponse[]>(`${this.base}/estado/${estado}`);
  }

  obtenerPorId(id: number): Observable<HorarioResponse> {
    return this.api.get<HorarioResponse>(`${this.base}/${id}`);
  }

  crear(payload: CreateHorarioRequest): Observable<HorarioResponse> {
    return this.api.post<HorarioResponse, CreateHorarioRequest>(this.base, payload);
  }

  actualizar(id: number, payload: UpdateHorarioRequest): Observable<HorarioResponse> {
    return this.api.put<HorarioResponse, UpdateHorarioRequest>(`${this.base}/${id}`, payload);
  }

  /** Baja lógica: el backend cambia estado a INACTIVO. */
  inhabilitar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }
}
