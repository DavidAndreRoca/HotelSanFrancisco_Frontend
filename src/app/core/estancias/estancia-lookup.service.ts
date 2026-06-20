import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../http/http-client.service';
import { PageResponse } from '../api/api-response.interface';

/** Reserva con CHECK_IN activo, candidata a recibir cargos/consumos. */
export interface ReservaCheckIn {
  reservaId: number;
  codReserva: string;
  huespedNombre: string;
  habitaciones: string; // "101, 102"
  estanciaId: number | null; // null en el listado; se resuelve con el detalle
}

interface ReservaRaw {
  reservaId: number;
  codReserva: string;
  estado: string;
  estanciaId?: number | null;
  huespedes?: { nombreCompleto: string; esPrincipal?: boolean }[];
  habitaciones?: { habitacionNumero: string }[];
}

@Injectable({ providedIn: 'root' })
export class EstanciaLookupService {
  private readonly api = inject(ApiClient);

  /**
   * Reservas con CHECK_IN activo (para seleccionar la estancia a cargar).
   * GET /api/v1/reservas?estado=CHECK_IN
   */
  buscarReservasCheckIn(): Observable<ReservaCheckIn[]> {
    return this.api
      .get<PageResponse<ReservaRaw>>('/api/v1/reservas', {
        params: { estado: 'CHECK_IN', size: 100, sort: 'fechaInicio,desc' },
      })
      .pipe(
        map((page) =>
          (page.content ?? [])
            .filter((r) => r.estado === 'CHECK_IN')
            .map((r) => ({
              reservaId: r.reservaId,
              codReserva: r.codReserva,
              huespedNombre:
                r.huespedes?.find((h) => h.esPrincipal)?.nombreCompleto ??
                r.huespedes?.[0]?.nombreCompleto ??
                '—',
              habitaciones: (r.habitaciones ?? []).map((h) => h.habitacionNumero).join(', '),
              estanciaId: r.estanciaId ?? null,
            })),
        ),
      );
  }

  /**
   * Resuelve el estanciaId de una reserva desde su detalle
   * (GET /api/v1/reservas/{id}), porque el listado lo devuelve null.
   */
  resolverEstanciaId(reservaId: number): Observable<number | null> {
    return this.api
      .get<{ estanciaId?: number | null }>(`/api/v1/reservas/${reservaId}`)
      .pipe(map((r) => r.estanciaId ?? null));
  }
}
