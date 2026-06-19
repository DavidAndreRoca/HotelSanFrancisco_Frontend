import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import {
  Reserva, ReservaStats, EstadoReserva,
  CreateReservaPayload, UpdateReservaPayload,
  CambiarEstadoPayload, CancelarReservaPayload,
  CancelacionResponse, HistorialReserva,
} from '../models/reservation.model';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly api = inject(ApiClient);

  private readonly _reservas     = signal<Reserva[]>([]);
  private readonly _loading      = signal(false);
  private readonly _searchTerm   = signal<string>('');
  private readonly _estadoFilter = signal<EstadoReserva | 'all'>('all');

  readonly reservas = this._reservas.asReadonly();
  readonly loading  = this._loading.asReadonly();

  readonly pendienteCount  = computed(() => this._reservas().filter(r => r.estado === 'PENDIENTE').length);
  readonly confirmadaCount = computed(() => this._reservas().filter(r => r.estado === 'CONFIRMADA').length);
  readonly checkInCount    = computed(() => this._reservas().filter(r => r.estado === 'CHECK_IN').length);
  readonly checkOutCount   = computed(() => this._reservas().filter(r => r.estado === 'CHECK_OUT').length);
  readonly canceladaCount  = computed(() => this._reservas().filter(r => r.estado === 'CANCELADA').length);
  readonly noShowCount     = computed(() => this._reservas().filter(r => r.estado === 'NO_SHOW').length);

  readonly filteredReservas = computed(() => {
    const term   = this._searchTerm().toLowerCase();
    const estado = this._estadoFilter();
    let list = this._reservas();

    if (term) {
      list = list.filter(r =>
        r.codReserva.toLowerCase().includes(term) ||
        r.huespedes.some(h => h.nombreCompleto.toLowerCase().includes(term) || h.numeroDocumento.includes(term)) ||
        r.habitaciones.some(h => h.habitacionNumero.includes(term))
      );
    }

    if (estado !== 'all') {
      list = list.filter(r => r.estado === estado);
    }

    return list;
  });

  readonly stats = computed<ReservaStats>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const list  = this._reservas();
    return {
      total:          list.length,
      pendiente:      list.filter(r => r.estado === 'PENDIENTE').length,
      confirmada:     list.filter(r => r.estado === 'CONFIRMADA').length,
      checkIn:        list.filter(r => r.estado === 'CHECK_IN').length,
      checkOut:       list.filter(r => r.estado === 'CHECK_OUT').length,
      cancelada:      list.filter(r => r.estado === 'CANCELADA').length,
      noShow:         list.filter(r => r.estado === 'NO_SHOW').length,
      todayCheckIns:  list.filter(r => r.fechaInicio === today).length,
      todayCheckOuts: list.filter(r => r.fechaFin === today).length,
    };
  });

  constructor() {
    this.cargarTodas();
  }

  cargarTodas(): void {
    this._loading.set(true);
    this.api.get<PageResponse<Reserva>>('/api/v1/reservas', {
      params: { size: 500, sort: 'fechaCreacion,desc' },
    }).subscribe({
      next: (page) => { this._reservas.set(page.content); this._loading.set(false); },
      error: ()     => { this._loading.set(false); },
    });
  }

  // ── Filtros ──────────────────────────────────────────────────────────────────
  setSearchTerm(term: string): void               { this._searchTerm.set(term); }
  setEstadoFilter(e: EstadoReserva | 'all'): void { this._estadoFilter.set(e); }

  // ── Consultas (síncronas desde signal) ───────────────────────────────────────
  findById(id: number): Reserva | undefined       { return this._reservas().find(r => r.reservaId === id); }
  findByCodigo(cod: string): Reserva | undefined  { return this._reservas().find(r => r.codReserva === cod); }
  findByUsuario(uid: number): Reserva[]           { return this._reservas().filter(r => r.usuarioId === uid); }

  obtenerHistorial(reservaId: number): Observable<HistorialReserva[]> {
    return this.api.get<HistorialReserva[]>(`/api/v1/reservas/${reservaId}/historial`);
  }

  // ── Mutaciones (retornan Observable, actualizan signal via tap) ──────────────
  create(payload: CreateReservaPayload): Observable<Reserva> {
    return this.api.post<Reserva>('/api/v1/reservas', payload).pipe(
      tap(nueva => this._reservas.update(list => [nueva, ...list]))
    );
  }

  update(id: number, payload: UpdateReservaPayload): Observable<Reserva> {
    return this.api.put<Reserva>(`/api/v1/reservas/${id}`, payload).pipe(
      tap(updated => this._reservas.update(list => list.map(r => r.reservaId === id ? updated : r)))
    );
  }

  cambiarEstado(id: number, payload: CambiarEstadoPayload): Observable<Reserva> {
    return this.api.patch<Reserva>(`/api/v1/reservas/${id}/estado`, {
      nuevoEstado: payload.nuevoEstado,
      motivo:      payload.motivo ?? null,
    }).pipe(
      tap(updated => this._reservas.update(list => list.map(r => r.reservaId === id ? updated : r)))
    );
  }

  cancelar(id: number, payload: CancelarReservaPayload): Observable<CancelacionResponse> {
    return this.api.post<CancelacionResponse>(`/api/v1/reservas/${id}/cancelar`, payload).pipe(
      tap(result => this._reservas.update(list => list.map(r => r.reservaId === id ? result.reserva : r)))
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/api/v1/reservas/${id}`).pipe(
      tap(() => this._reservas.update(list => list.filter(r => r.reservaId !== id)))
    );
  }
}
