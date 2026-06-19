import { Injectable, inject, signal } from '@angular/core';
import { ApiClient } from '../../../core/http/http-client.service';

export interface HabitacionDisponible {
  habitacionId: number;
  numero: string;
  piso: number;
  estado: string;
  descripcion: string | null;
  observaciones: string | null;
}

export interface TipoHabitacion {
  tipoHabitacionId: number;
  nombre: string;
  precioBase: number;
  descripcion: string | null;
  estado: string;
  capacidadMaxima: number;
}

@Injectable({ providedIn: 'root' })
export class DisponibilidadService {
  private readonly api = inject(ApiClient);

  private readonly _disponibles   = signal<HabitacionDisponible[]>([]);
  private readonly _tipos         = signal<TipoHabitacion[]>([]);
  private readonly _loading       = signal(false);
  private readonly _loadingTipos  = signal(false);

  readonly disponibles  = this._disponibles.asReadonly();
  readonly tipos        = this._tipos.asReadonly();
  readonly loading      = this._loading.asReadonly();
  readonly loadingTipos = this._loadingTipos.asReadonly();

  buscarDisponibles(fechaInicio: string, fechaFin: string, piso?: number): void {
    this._loading.set(true);
    this._disponibles.set([]);
    this.api.get<HabitacionDisponible[]>('/api/v1/reservas/disponibilidad', {
      params: { fechaInicio, fechaFin, ...(piso != null ? { piso } : {}) },
    }).subscribe({
      next: (list) => { this._disponibles.set(list); this._loading.set(false); },
      error: ()     => { this._loading.set(false); },
    });
  }

  cargarTipos(): void {
    if (this._tipos().length > 0 || this._loadingTipos()) return;
    this._loadingTipos.set(true);
    this.api.get<TipoHabitacion[]>('/api/v1/tipos-habitacion/estado/ACTIVO').subscribe({
      next: (list) => { this._tipos.set(list); this._loadingTipos.set(false); },
      error: ()     => { this._loadingTipos.set(false); },
    });
  }

  limpiar(): void {
    this._disponibles.set([]);
  }
}
