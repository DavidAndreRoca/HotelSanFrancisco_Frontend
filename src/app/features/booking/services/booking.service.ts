import { Injectable, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import {
  BookingConfirmationResponse,
  BookingDatosHuesped,
  HabitacionDisponible,
  MetodoPagoPublico,
  SearchParams,
  TipoPago,
} from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingStateService {
  readonly searchParams = signal<SearchParams | null>(null);
  readonly habitacionSeleccionada = signal<HabitacionDisponible | null>(null);
  readonly datosHuesped = signal<BookingDatosHuesped | null>(null);
  readonly tipoPago = signal<TipoPago>('TOTAL');
  readonly metodoPagoId = signal<number | null>(null);
  readonly confirmacion = signal<BookingConfirmationResponse | null>(null);

  readonly noches = computed(() => {
    const p = this.searchParams();
    if (!p) return 0;
    const ms = new Date(p.checkOut).getTime() - new Date(p.checkIn).getTime();
    return Math.max(1, Math.round(ms / 86400000));
  });

  readonly montoTotal = computed(() => {
    const hab = this.habitacionSeleccionada();
    const n = this.noches();
    if (!hab || n === 0) return 0;
    const subtotal = hab.precioBase * n;
    return +(subtotal * 1.18).toFixed(2);
  });

  readonly adelanto = computed(() => {
    const total = this.montoTotal();
    return this.tipoPago() === 'TOTAL' ? total : +(total * 0.5).toFixed(2);
  });

  readonly montoPendiente = computed(() => +(this.montoTotal() - this.adelanto()).toFixed(2));

  setSearch(params: SearchParams): void {
    this.searchParams.set(params);
    this.habitacionSeleccionada.set(null);
    this.datosHuesped.set(null);
    this.tipoPago.set('TOTAL');
    this.metodoPagoId.set(null);
    this.confirmacion.set(null);
  }

  selectHabitacion(hab: HabitacionDisponible): void {
    this.habitacionSeleccionada.set(hab);
  }

  setDatosHuesped(datos: BookingDatosHuesped): void {
    this.datosHuesped.set(datos);
  }

  setTipoPago(tipo: TipoPago): void {
    this.tipoPago.set(tipo);
  }

  setMetodoPago(id: number): void {
    this.metodoPagoId.set(id);
  }

  setConfirmacion(c: BookingConfirmationResponse): void {
    this.confirmacion.set(c);
  }

  reset(): void {
    this.searchParams.set(null);
    this.habitacionSeleccionada.set(null);
    this.datosHuesped.set(null);
    this.tipoPago.set('TOTAL');
    this.metodoPagoId.set(null);
    this.confirmacion.set(null);
  }
}

@Injectable({ providedIn: 'root' })
export class BookingApiService {
  constructor(private readonly api: ApiClient) {}

  findDisponibles(fechaInicio: string, fechaFin: string, personas: number): Observable<HabitacionDisponible[]> {
    return this.api.get<HabitacionDisponible[]>('/api/v1/booking/disponibles', {
      params: { fechaInicio, fechaFin, personas },
    });
  }

  findMetodosPago(): Observable<MetodoPagoPublico[]> {
    return this.api.get<MetodoPagoPublico[]>('/api/v1/booking/metodos-pago');
  }

  crearReserva(payload: {
    fechaInicio: string;
    fechaFin: string;
    habitacionId: number;
    tipoHabitacionId: number;
    numeroDocumento: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    correo: string;
    nroAdultos: number;
    nroNinos: number;
    serviciosAdicionales: string;
    tipoPago: TipoPago;
    metodoPagoId: number;
  }): Observable<BookingConfirmationResponse> {
    return this.api.post<BookingConfirmationResponse>('/api/v1/booking', payload);
  }
}
