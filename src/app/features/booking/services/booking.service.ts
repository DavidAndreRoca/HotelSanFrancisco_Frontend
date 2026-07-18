import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import {
  BookingAcompanante,
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
  /** Selección múltiple: con 1 adulto solo se admite 1 habitación (regla de negocio). */
  readonly habitacionesSeleccionadas = signal<HabitacionDisponible[]>([]);
  readonly datosHuesped = signal<BookingDatosHuesped | null>(null);
  readonly tipoPago = signal<TipoPago>('TOTAL');
  /** Pre-reserva PENDIENTE creada para pago online (permite reintentar el cobro sin duplicarla). */
  readonly reservaPendiente = signal<BookingConfirmationResponse | null>(null);
  readonly confirmacion = signal<BookingConfirmationResponse | null>(null);

  /** Compatibilidad con vistas de una sola habitación (primera seleccionada). */
  readonly habitacionSeleccionada = computed(() => this.habitacionesSeleccionadas()[0] ?? null);

  readonly noches = computed(() => {
    const p = this.searchParams();
    if (!p) return 0;
    const ms = new Date(p.checkOut).getTime() - new Date(p.checkIn).getTime();
    return Math.max(1, Math.round(ms / 86400000));
  });

  readonly montoTotal = computed(() => {
    const habs = this.habitacionesSeleccionadas();
    const n = this.noches();
    if (habs.length === 0 || n === 0) return 0;
    const subtotal = habs.reduce((s, h) => s + (h.precioBase ?? 0) * n, 0);
    return +(subtotal * 1.18).toFixed(2);
  });

  readonly adelanto = computed(() => {
    const total = this.montoTotal();
    return this.tipoPago() === 'TOTAL' ? total : +(total * 0.5).toFixed(2);
  });

  readonly montoPendiente = computed(() => +(this.montoTotal() - this.adelanto()).toFixed(2));

  /** Capacidad total de las habitaciones seleccionadas (0 si algún tipo no la declara). */
  readonly capacidadSeleccionada = computed(() =>
    this.habitacionesSeleccionadas().reduce((s, h) => s + (h.capacidadMaxima ?? 0), 0),
  );

  setSearch(params: SearchParams): void {
    this.searchParams.set(params);
    this.habitacionesSeleccionadas.set([]);
    this.datosHuesped.set(null);
    this.tipoPago.set('TOTAL');
    this.reservaPendiente.set(null);
    this.confirmacion.set(null);
  }

  /**
   * Alterna la selección de una habitación. Con 1 solo adulto la selección es
   * excluyente (elegir otra reemplaza la actual); con 2+ adultos es múltiple.
   * Cualquier cambio invalida la pre-reserva online previa: sus montos ya no
   * corresponden (la anterior la cancela el job de expiración).
   */
  toggleHabitacion(hab: HabitacionDisponible): void {
    const adultos = this.searchParams()?.adultos ?? 1;
    const actual = this.habitacionesSeleccionadas();
    const idx = actual.findIndex((h) => h.habitacionId === hab.habitacionId);
    if (idx >= 0) {
      this.habitacionesSeleccionadas.set(actual.filter((_, i) => i !== idx));
    } else if (adultos <= 1) {
      this.habitacionesSeleccionadas.set([hab]);
    } else {
      this.habitacionesSeleccionadas.set([...actual, hab]);
    }
    this.reservaPendiente.set(null);
  }

  estaSeleccionada(habitacionId: number): boolean {
    return this.habitacionesSeleccionadas().some((h) => h.habitacionId === habitacionId);
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
    this.habitacionesSeleccionadas.set([]);
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
    habitacionesIds: number[];
    numeroDocumento: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    correo: string;
    nroAdultos: number;
    nroNinos: number;
    serviciosAdicionales: string;
    acompanantes: BookingAcompanante[];
    tipoPago: TipoPago;
  }): Observable<BookingConfirmationResponse> {
    console.log('[Booking API] Iniciando pre-reserva con payload:', payload);
    return this.api.post<BookingConfirmationResponse>('/api/v1/booking', payload).pipe(
      tap(res => console.log('[Booking API] Pre-reserva exitosa:', res))
    );
  }

  crearSesionPago(reservaId: number): Observable<CrearSesionPagoResponse> {
    console.log(`[Booking API] Iniciando sesión de pago para reserva ${reservaId}`);
    return this.api.post<CrearSesionPagoResponse>(`/api/v1/booking/${reservaId}/pago/session`, {}).pipe(
      tap(res => console.log('[Booking API] Sesión de pago creada:', res.purchaseNumber))
    );
  }

  confirmarPago(payload: {
    purchaseNumber: string;
    transactionToken: string;
  }): Observable<BookingConfirmationResponse> {
    console.log(`[Booking API] Confirmando pago para purchaseNumber ${payload.purchaseNumber}`);
    return this.api.post<BookingConfirmationResponse>('/api/v1/booking/pago/confirmar', payload).pipe(
      tap(res => console.log('[Booking API] Pago confirmado exitosamente, reserva:', res.codReserva))
    );
  }


  /** Confirmación de un pago ya autorizado (tras el redirect de retorno del checkout). */
  getConfirmacionPago(purchaseNumber: string): Observable<BookingConfirmationResponse> {
    return this.api.get<BookingConfirmationResponse>(
      `/api/v1/booking/pago/${purchaseNumber}/confirmacion`,
    );
  }
}
