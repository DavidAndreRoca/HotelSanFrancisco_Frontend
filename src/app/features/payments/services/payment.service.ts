// features/payments/services/payment.service.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import {
  AdvanceCalculation,
  MetodoPago,
  PageResponse,
  Payment,
  PaymentCreatePayload,
  PaymentFilters,
  PaymentUpdatePayload,
  calcularAdelanto,
} from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/pagos';
  private readonly metodosBase = '/api/v1/metodos-pago';

  // ---------------------------------------------------------------------
  // Listado / búsqueda de pagos
  // ---------------------------------------------------------------------

  private readonly _items = signal<Payment[]>([]);
  private readonly _page = signal<Omit<PageResponse<Payment>, 'content'> | null>(null);
  private readonly _loading = signal(false);
  private readonly _lastError = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly page = this._page.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly lastError = this._lastError.asReadonly();

  readonly totalRecaudado = computed(() =>
    this._items().reduce((acc, p) => acc + p.monto, 0),
  );

  load(params: Partial<PaymentFilters> = {}): void {
    this._loading.set(true);
    this._lastError.set(null);
    this.api
      .get<PageResponse<Payment>>(this.base, {
        params: {
          metodoPagoId: params.metodoPagoId ?? '',
          tipoPago: params.tipoPago ?? '',
          ventaId: params.ventaId ?? '',
          reservaId: params.reservaId ?? '',
          comprobante: params.comprobante ?? '',
          fechaDesde: params.fechaDesde ?? '',
          fechaHasta: params.fechaHasta ?? '',
          montoMin: params.montoMin ?? '',
          montoMax: params.montoMax ?? '',
          page: params.page ?? 0,
          size: params.size ?? 10,
          sort: params.sort ?? 'fecha,desc',
        },
      })
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (res) => {
          this._items.set(res.content);
          const { content: _content, ...rest } = res;
          this._page.set(rest);
        },
        error: (err: { friendlyMessage?: string }) => {
          this._lastError.set(err.friendlyMessage ?? 'No se pudo cargar el historial de pagos.');
        },
      });
  }

  findById(id: number): Observable<Payment> {
    return this.api.get<Payment>(`${this.base}/${id}`);
  }

  /** Historial de pagos de una reserva específica */
  findByReserva(reservaId: number): Observable<Payment[]> {
    return this.api.get<Payment[]>(`${this.base}/reserva/${reservaId}`);
  }

  /** Historial de pagos de una venta específica (consumos/servicios) */
  findByVenta(ventaId: number): Observable<Payment[]> {
    return this.api.get<Payment[]>(`${this.base}/venta/${ventaId}`);
  }

  // ---------------------------------------------------------------------
  // CRUD de pagos
  // ---------------------------------------------------------------------

  create(payload: PaymentCreatePayload): Observable<Payment> {
    return this.api
      .post<Payment, PaymentCreatePayload>(this.base, payload)
      .pipe(tap((created) => this._items.update((arr) => [created, ...arr])));
  }

  update(id: number, payload: PaymentUpdatePayload): Observable<Payment> {
    return this.api
      .put<Payment, PaymentUpdatePayload>(`${this.base}/${id}`, payload)
      .pipe(
        tap((updated) =>
          this._items.update((arr) => arr.map((p) => (p.pagoId === id ? updated : p))),
        ),
      );
  }

  /** El backend no tiene "anular": el borrado de un pago es definitivo (DELETE). */
  delete(id: number): Observable<void> {
    return this.api
      .delete<void>(`${this.base}/${id}`)
      .pipe(tap(() => this._items.update((arr) => arr.filter((p) => p.pagoId !== id))));
  }

  // ---------------------------------------------------------------------
  // Métodos de pago (catálogo)
  // ---------------------------------------------------------------------

  private readonly _metodos = signal<MetodoPago[]>([]);
  private readonly _metodosLoading = signal(false);

  readonly metodos = this._metodos.asReadonly();
  readonly metodosLoading = this._metodosLoading.asReadonly();
  readonly metodosActivos = computed(() =>
    this._metodos().filter((m) => m.estado === 'ACTIVO'),
  );

  /** Carga métodos de pago activos (catálogo pequeño, se trae todo en una página grande) */
  loadMetodos(): void {
    this._metodosLoading.set(true);
    this.api
      .get<PageResponse<MetodoPago>>(this.metodosBase, { params: { size: 100 } })
      .pipe(finalize(() => this._metodosLoading.set(false)))
      .subscribe({
        next: (res) => this._metodos.set(res.content),
        error: () => this._metodos.set([]),
      });
  }

  // ---------------------------------------------------------------------
  // Adelanto del 50% / validaciones
  // ---------------------------------------------------------------------

  /** Calcula el adelanto sugerido (50% por defecto) para un monto total */
  calcularAdelanto(montoTotal: number, porcentaje = 50): AdvanceCalculation {
    return calcularAdelanto(montoTotal, porcentaje);
  }

  /** Registra el pago de adelanto del 50% para una reserva */
  registrarAdelanto(
    reservaId: number,
    montoTotal: number,
    metodoPagoId: number,
    porcentaje = 50,
  ): Observable<Payment> {
    const { montoAdelanto } = this.calcularAdelanto(montoTotal, porcentaje);
    return this.create({
      reservaId,
      monto: montoAdelanto,
      tipoPago: 'ANTICIPO',
      metodoPagoId,
    });
  }

  /**
   * Valida un monto de pago contra el saldo pendiente de la reserva.
   * Retorna un mensaje de error o null si es válido.
   */
  validarMonto(monto: number, saldoPendiente: number): string | null {
    if (monto === null || monto === undefined || Number.isNaN(monto)) {
      return 'Ingresa un monto válido.';
    }
    if (monto <= 0) {
      return 'El monto debe ser mayor a cero.';
    }
    if (Math.round(monto * 100) / 100 !== monto) {
      return 'El monto admite máximo 2 decimales.';
    }
    if (saldoPendiente >= 0 && monto > saldoPendiente + 0.01) {
      return `El monto excede el saldo pendiente (S/ ${saldoPendiente.toFixed(2)}).`;
    }
    return null;
  }
}
