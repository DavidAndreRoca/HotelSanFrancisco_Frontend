import { Injectable, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import {
  BookingConfirmationResponse,
  BookingDatosHuesped,
  CrearSesionPagoResponse,
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
  /** Pre-reserva PENDIENTE creada para pago online (permite reintentar el cobro sin duplicarla). */
  readonly reservaPendiente = signal<BookingConfirmationResponse | null>(null);
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
    this.reservaPendiente.set(null);
    this.confirmacion.set(null);
  }

  selectHabitacion(hab: HabitacionDisponible): void {
    this.habitacionSeleccionada.set(hab);
    // Cambiar habitación/datos/tipo de pago invalida la pre-reserva online previa:
    // sus montos ya no corresponden (la anterior la cancela el job de expiración).
    this.reservaPendiente.set(null);
  }

  setDatosHuesped(datos: BookingDatosHuesped): void {
    this.datosHuesped.set(datos);
    this.reservaPendiente.set(null);
  }

  setTipoPago(tipo: TipoPago): void {
    if (this.tipoPago() !== tipo) {
      this.reservaPendiente.set(null);
    }
    this.tipoPago.set(tipo);
  }

  setReservaPendiente(c: BookingConfirmationResponse | null): void {
    this.reservaPendiente.set(c);
  }

  setConfirmacion(c: BookingConfirmationResponse): void {
    this.confirmacion.set(c);
  }

  reset(): void {
    this.searchParams.set(null);
    this.habitacionSeleccionada.set(null);
    this.datosHuesped.set(null);
    this.tipoPago.set('TOTAL');
    this.reservaPendiente.set(null);
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
  }): Observable<BookingConfirmationResponse> {
    return this.api.post<BookingConfirmationResponse>('/api/v1/booking', payload);
  }

  crearSesionPago(reservaId: number): Observable<CrearSesionPagoResponse> {
    return this.api.post<CrearSesionPagoResponse>(`/api/v1/booking/${reservaId}/pago/session`, {});
  }

  confirmarPago(payload: {
    purchaseNumber: string;
    transactionToken: string;
  }): Observable<BookingConfirmationResponse> {
    return this.api.post<BookingConfirmationResponse>('/api/v1/booking/pago/confirmar', payload);
  }

  /** Confirmación de un pago ya autorizado (tras el redirect de retorno del checkout). */
  getConfirmacionPago(purchaseNumber: string): Observable<BookingConfirmationResponse> {
    return this.api.get<BookingConfirmationResponse>(
      `/api/v1/booking/pago/${purchaseNumber}/confirmacion`,
    );
  }
}
