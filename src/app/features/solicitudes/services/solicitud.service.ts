import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, QueryParams } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import {
  AsignarResponsableRequest,
  CambiarEstadoSolicitudRequest,
  CreateSolicitudRequest,
  RegistrarSeguimientoRequest,
  SeguimientoSolicitudResponse,
  SolicitudFilterRequest,
  SolicitudReporteResponse,
  SolicitudResponse,
  UpdateSolicitudRequest,
} from '../models/solicitud.model';

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/solicitudes';

  /**
   * Listar solicitudes paginadas con filtros (GET /api/v1/solicitudes).
   * Sin permiso `solicitud:read-all`, el backend devuelve solo las propias
   * (filtrado por `solicitante.usuarioId` en el servicio del backend).
   */
  listar(filtros: SolicitudFilterRequest = {}): Observable<PageResponse<SolicitudResponse>> {
    return this.api.get<PageResponse<SolicitudResponse>>(this.base, {
      params: filtros as QueryParams,
    });
  }

  /** Reporte consolidado: totales por estado y tipo (GET /reporte). Solo ADMIN. */
  obtenerReporte(): Observable<SolicitudReporteResponse> {
    return this.api.get<SolicitudReporteResponse>(`${this.base}/reporte`);
  }

  /**
   * Detalle de una solicitud (GET /{id}). Sin `read-all`, un id ajeno
   * devuelve 404 → el frontend lo trata como "no encontrada".
   */
  obtenerPorId(id: number): Observable<SolicitudResponse> {
    return this.api.get<SolicitudResponse>(`${this.base}/${id}`);
  }

  /** Historial de seguimiento ordenado cronológicamente (GET /{id}/seguimientos). */
  obtenerSeguimientos(id: number): Observable<SeguimientoSolicitudResponse[]> {
    return this.api.get<SeguimientoSolicitudResponse[]>(`${this.base}/${id}/seguimientos`);
  }

  /** Registrar solicitud nueva (POST /). El solicitante se extrae del JWT. */
  crear(payload: CreateSolicitudRequest): Observable<SolicitudResponse> {
    return this.api.post<SolicitudResponse, CreateSolicitudRequest>(this.base, payload);
  }

  /** Editar solicitud (PUT /{id}). Solo el autor y solo en estado REGISTRADA. */
  actualizar(id: number, payload: UpdateSolicitudRequest): Observable<SolicitudResponse> {
    return this.api.put<SolicitudResponse, UpdateSolicitudRequest>(`${this.base}/${id}`, payload);
  }

  /**
   * Asignar responsable (PATCH /{id}/asignar). Solo ADMIN.
   * Si la solicitud estaba REGISTRADA, avanza automáticamente a EN_EVALUACION.
   */
  asignarResponsable(
    id: number,
    payload: AsignarResponsableRequest,
  ): Observable<SolicitudResponse> {
    return this.api.patch<SolicitudResponse, AsignarResponsableRequest>(
      `${this.base}/${id}/asignar`,
      payload,
    );
  }

  /** Cambiar estado según la máquina de estados (PATCH /{id}/estado). */
  cambiarEstado(
    id: number,
    payload: CambiarEstadoSolicitudRequest,
  ): Observable<SolicitudResponse> {
    return this.api.patch<SolicitudResponse, CambiarEstadoSolicitudRequest>(
      `${this.base}/${id}/estado`,
      payload,
    );
  }

  /** Registrar observación libre sin cambiar estado (POST /{id}/seguimientos). */
  registrarObservacion(
    id: number,
    payload: RegistrarSeguimientoRequest,
  ): Observable<SeguimientoSolicitudResponse> {
    return this.api.post<SeguimientoSolicitudResponse, RegistrarSeguimientoRequest>(
      `${this.base}/${id}/seguimientos`,
      payload,
    );
  }

  /** Eliminación física, cascada a seguimientos (DELETE /{id}). Solo ADMIN. */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }
}
