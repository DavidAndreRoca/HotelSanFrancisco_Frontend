import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import {
  ActualizarAsignacionRequest,
  AsignarHorarioRequest,
  DetalleHorarioResponse,
} from '../models/horario.model';

@Injectable({ providedIn: 'root' })
export class AsignacionHorarioService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/asignaciones-horario';

  /** Horarios asignados a un usuario (GET /usuario/{uid}). */
  obtenerPorUsuario(usuarioId: number): Observable<DetalleHorarioResponse[]> {
    return this.api.get<DetalleHorarioResponse[]>(`${this.base}/usuario/${usuarioId}`);
  }

  asignar(payload: AsignarHorarioRequest): Observable<DetalleHorarioResponse> {
    return this.api.post<DetalleHorarioResponse, AsignarHorarioRequest>(this.base, payload);
  }

  actualizar(
    usuarioId: number,
    horarioId: number,
    payload: ActualizarAsignacionRequest,
  ): Observable<DetalleHorarioResponse> {
    return this.api.put<DetalleHorarioResponse, ActualizarAsignacionRequest>(
      `${this.base}/usuario/${usuarioId}/horario/${horarioId}`,
      payload,
    );
  }

  /** Baja lógica de la asignación (→ INACTIVO). */
  remover(usuarioId: number, horarioId: number): Observable<void> {
    return this.api.delete<void>(`${this.base}/usuario/${usuarioId}/horario/${horarioId}`);
  }
}
