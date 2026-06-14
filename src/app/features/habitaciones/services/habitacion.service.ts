import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import {
  Habitacion,
  CheckInPayload,
  CheckOutPayload,
  CheckOutLiquidacion,
  CreateHabitacionPayload,
  UpdateHabitacionPayload,
  EstadoHabitacion,
} from '../models/habitacion.model';

const BASE = '/api/v1/habitaciones';

@Injectable({ providedIn: 'root' })
export class HabitacionService {
  private readonly api = inject(ApiClient);

  // ── Signals store ──────────────────────────────────────────────────────────
  private readonly _habitaciones = signal<Habitacion[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly habitaciones = this._habitaciones.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly porPiso = computed(() => {
    const map = new Map<number, Habitacion[]>();
    for (const h of this._habitaciones()) {
      const arr = map.get(h.piso) ?? [];
      arr.push(h);
      map.set(h.piso, arr);
    }
    return map;
  });

  readonly conteoEstados = computed(() => {
    const all = this._habitaciones();
    return {
      disponible: all.filter((h) => h.estado === 'DISPONIBLE').length,
      ocupada: all.filter((h) => h.estado === 'OCUPADA').length,
      limpieza: all.filter((h) => h.estado === 'LIMPIEZA').length,
      mantenimiento: all.filter((h) => h.estado === 'MANTENIMIENTO').length,
      bloqueada: all.filter((h) => h.estado === 'BLOQUEADA').length,
    };
  });

  // ── Carga ──────────────────────────────────────────────────────────────────
  load(params?: { estado?: EstadoHabitacion; piso?: number }): void {
    this._loading.set(true);
    this._error.set(null);
    this.api.get<Habitacion[]>(BASE, { params }).subscribe({
      next: (data) => {
        this._habitaciones.set(data);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set(err.friendlyMessage ?? 'Error al cargar habitaciones');
        this._loading.set(false);
      },
    });
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  getById(id: number): Observable<Habitacion> {
    return this.api.get<Habitacion>(`${BASE}/${id}`);
  }

  create(payload: CreateHabitacionPayload): Observable<Habitacion> {
    return this.api.post<Habitacion>(BASE, payload).pipe(
      tap((h) => this._habitaciones.update((list) => [...list, h])),
    );
  }

  update(id: number, payload: UpdateHabitacionPayload): Observable<Habitacion> {
    return this.api.put<Habitacion>(`${BASE}/${id}`, payload).pipe(
      tap((updated) =>
        this._habitaciones.update((list) =>
          list.map((h) => (h.habitacionId === id ? updated : h)),
        ),
      ),
    );
  }

  cambiarEstado(id: number, nuevoEstado: EstadoHabitacion): Observable<Habitacion> {
    return this.api.patch<Habitacion>(`${BASE}/${id}/estado`, null, { params: { nuevoEstado } }).pipe(
      tap((updated) =>
        this._habitaciones.update((list) =>
          list.map((h) => (h.habitacionId === id ? updated : h)),
        ),
      ),
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${BASE}/${id}`).pipe(
      tap(() =>
        this._habitaciones.update((list) => list.filter((h) => h.habitacionId !== id)),
      ),
    );
  }

  // ── Operaciones ────────────────────────────────────────────────────────────
  checkIn(payload: CheckInPayload): Observable<Habitacion> {
    return this.api.post<Habitacion>(`${BASE}/checkin`, payload).pipe(
      tap(() => this.load()),
    );
  }

  checkOut(payload: CheckOutPayload): Observable<CheckOutLiquidacion> {
    return this.api.post<CheckOutLiquidacion>(`${BASE}/checkout`, payload).pipe(
      tap(() => this.load()),
    );
  }

  getLimpieza(): Observable<Habitacion[]> {
    return this.api.get<Habitacion[]>(`${BASE}/limpieza`);
  }

  marcarLimpiezaCompletada(id: number): Observable<Habitacion> {
    return this.api.patch<Habitacion>(`${BASE}/${id}/limpieza-completada`, null).pipe(
      tap((updated) =>
        this._habitaciones.update((list) =>
          list.map((h) => (h.habitacionId === id ? updated : h)),
        ),
      ),
    );
  }
}
