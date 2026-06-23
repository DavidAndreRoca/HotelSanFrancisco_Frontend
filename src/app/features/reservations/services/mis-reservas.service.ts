import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, QueryParams } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import { CreateReservaPayload, EstadoReserva, Reserva } from '../models/reservation.model';

/**
 * Reservas del propio huésped autenticado (rol CLIENTE).
 * Consume /api/v1/mis-reservas — el backend filtra por el usuario del JWT.
 * ApiClient envía withCredentials y desempaqueta ApiResponse.data.
 */
@Injectable({ providedIn: 'root' })
export class MisReservasService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/mis-reservas';

  listar(
    page = 0,
    size = 10,
    filtros?: { estado?: EstadoReserva; sort?: string },
  ): Observable<PageResponse<Reserva>> {
    const params: QueryParams = {
      page,
      size,
      sort: filtros?.sort ?? 'fechaCreacion,desc',
      estado: filtros?.estado,
    };
    return this.api.get<PageResponse<Reserva>>(this.base, { params });
  }

  /**
   * Detalle completo de una reserva propia, con `habitaciones` y `huespedes` poblados
   * (el listado los devuelve vacíos a propósito). 403 si no es propia, 404 si no existe.
   */
  obtenerDetalle(id: number): Observable<Reserva> {
    return this.api.get<Reserva>(`${this.base}/${id}`);
  }

  crear(payload: CreateReservaPayload): Observable<Reserva> {
    return this.api.post<Reserva, CreateReservaPayload>(this.base, payload);
  }

  /** Cancela la propia reserva (DELETE con body { motivo }). */
  cancelar(id: number, motivo: string): Observable<void> {
    return this.api.delete<void, { motivo: string }>(`${this.base}/${id}`, { body: { motivo } });
  }
}
