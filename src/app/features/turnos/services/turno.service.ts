import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import {
  GenerarTurnosRequest,
  GenerarTurnosResponse,
  TurnoResponse,
  UpdateTurnoRequest,
} from '../models/turno.model';

@Injectable({ providedIn: 'root' })
export class TurnoService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/turnos';

  /** Genera turnos desde la plantilla de horarios en el rango dado. */
  generar(payload: GenerarTurnosRequest): Observable<GenerarTurnosResponse> {
    return this.api.post<GenerarTurnosResponse, GenerarTurnosRequest>(
      `${this.base}/generar`,
      payload,
    );
  }

  /** Turnos en un rango de fechas. */
  listar(desde: string, hasta: string): Observable<TurnoResponse[]> {
    return this.api.get<TurnoResponse[]>(this.base, { params: { desde, hasta } });
  }

  /** Turnos de un empleado en un rango. */
  listarPorUsuario(usuarioId: number, desde: string, hasta: string): Observable<TurnoResponse[]> {
    return this.api.get<TurnoResponse[]>(`${this.base}/usuario/${usuarioId}`, {
      params: { desde, hasta },
    });
  }

  /** Edita un turno (PATCH). Devuelve el turno actualizado. */
  actualizar(turnoId: number, payload: UpdateTurnoRequest): Observable<TurnoResponse> {
    return this.api.patch<TurnoResponse, UpdateTurnoRequest>(`${this.base}/${turnoId}`, payload);
  }

  /** Cancela un turno (DELETE, soft → CANCELADO). Devuelve 200 con data null. */
  cancelar(turnoId: number): Observable<void> {
    return this.api.delete<void>(`${this.base}/${turnoId}`);
  }
}
