// features/payments/models/payment.model.ts

/**
 * Coincide con el enum TipoPago del backend (com.sanfrancisco.api.modules.pagos.enums.TipoPago).
 */
export type TipoPago = 'ANTICIPO' | 'SALDO' | 'TOTAL' | 'REEMBOLSO';

/**
 * Coincide con EstadoActivo del backend (com.sanfrancisco.api.shared.enums.EstadoActivo).
 */
export type EstadoActivo = 'ACTIVO' | 'INACTIVO';

// ---------------------------------------------------------------------
// MetodoPago — entidad relacional (no un string union)
// ---------------------------------------------------------------------

export interface MetodoPago {
  metodoPagoId: number;
  nombre: string;
  estado: EstadoActivo;
  requiereComprobante: boolean;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface MetodoPagoCreatePayload {
  nombre: string;
  estado: EstadoActivo;
  requiereComprobante: boolean;
}

export type MetodoPagoUpdatePayload = Partial<MetodoPagoCreatePayload>;

// ---------------------------------------------------------------------
// Pago — coincide con PagoResponse del backend
// ---------------------------------------------------------------------

export interface Payment {
  pagoId: number;
  metodoPagoId: number;
  metodoPagoNombre: string;
  tipoPago: TipoPago;
  fecha: string; // ISO datetime
  monto: number;
  comprobante: string | null;
  ventaId: number | null;
  reservaId: number | null;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

/** Coincide con CreatePagoRequest del backend */
export interface PaymentCreatePayload {
  metodoPagoId: number;
  tipoPago: TipoPago;
  fecha?: string | null;
  monto: number;
  comprobante?: string | null;
  ventaId?: number | null;
  reservaId?: number | null;
}

/** Coincide con UpdatePagoRequest del backend (update parcial, sin venta/reserva) */
export interface PaymentUpdatePayload {
  metodoPagoId?: number;
  tipoPago?: TipoPago;
  fecha?: string | null;
  monto?: number;
  comprobante?: string | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/** Coincide con PagoFilterRequest del backend */
export interface PaymentFilters {
  metodoPagoId: number | null;
  tipoPago: TipoPago | '';
  ventaId: number | null;
  reservaId: number | null;
  comprobante: string;
  fechaDesde: string | null;
  fechaHasta: string | null;
  montoMin: number | null;
  montoMax: number | null;
  page: number;
  size: number;
  sort: string;
}

export const DEFAULT_PAYMENT_FILTERS: PaymentFilters = {
  metodoPagoId: null,
  tipoPago: '',
  ventaId: null,
  reservaId: null,
  comprobante: '',
  fechaDesde: null,
  fechaHasta: null,
  montoMin: null,
  montoMax: null,
  page: 0,
  size: 10,
  sort: 'fecha,desc',
};

// ---------------------------------------------------------------------
// Adelanto del 50% — el backend ya almacena `adelanto` en la Reserva,
// así que el cálculo aquí solo sirve de sugerencia para el formulario.
// ---------------------------------------------------------------------

export interface AdvanceCalculation {
  montoTotal: number;
  porcentajeAdelanto: number;
  montoAdelanto: number;
  saldoPendiente: number;
}

export function calcularAdelanto(montoTotal: number, porcentaje = 50): AdvanceCalculation {
  const montoAdelanto = Math.round(montoTotal * (porcentaje / 100) * 100) / 100;
  return {
    montoTotal,
    porcentajeAdelanto: porcentaje,
    montoAdelanto,
    saldoPendiente: Math.round((montoTotal - montoAdelanto) * 100) / 100,
  };
}

// ---------------------------------------------------------------------
// Contexto mínimo de reserva que necesita el modal de pagos
// (subconjunto de ReservaResponse del backend)
// ---------------------------------------------------------------------

export interface ReservaPagoContext {
  reservaId: number;
  codReserva: string;
  montoTotal: number;
  adelanto: number;
}
