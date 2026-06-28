export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'CHECK_IN' | 'CHECK_OUT' | 'CANCELADA' | 'NO_SHOW';
export type EstadoReservaHabitacion = 'ACTIVA' | 'CANCELADA' | 'CHECK_OUT';

// ---------- Sub-entidades ------------------------------------------------

export interface ReservaHabitacion {
  reservaHabitacionId: number;
  habitacionId: number;
  habitacionNumero: string;
  tipoHabitacionId: number;
  tipoHabitacionNombre: string;
  tarifaPactada: number;
  noches: number;
  subtotal: number;
  estado: EstadoReservaHabitacion;
}

export interface DetalleHuesped {
  huespedId: number;
  nombreCompleto: string;
  numeroDocumento: string;
  correo: string | null;
  telefono: string | null;
  esPrincipal: boolean;
}

export interface HistorialReserva {
  historialId: number;
  reservaId: number;
  codReserva: string;
  estadoAnterior: EstadoReserva | null; // null en el alta de la reserva
  estadoNuevo: EstadoReserva;
  motivo: string | null;
  fechaCambio: string; // ISO datetime
}

// ---------- Entidad principal --------------------------------------------

export interface Reserva {
  reservaId: number;
  codReserva: string;
  fechaInicio: string; // ISO date (YYYY-MM-DD)
  fechaFin: string;
  /** Calculado por el backend con la zona horaria del hotel (America/Lima). */
  llegadaHoy: boolean;
  montoTotal: number;
  estado: EstadoReserva;
  nroAdultos: number;
  nroNinos: number;
  subtotal: number;
  descuento: number;
  adelanto: number;
  impuesto: number;
  /** montoTotal - adelanto, calculado por el backend. */
  saldoPendiente: number;
  /** Política de pago elegida; el backend deriva el `adelanto` de ella. */
  modalidadPago: ModalidadPago;
  observaciones: string | null;
  usuarioId: number;
  usuarioNombre: string;
  canalId: number | null;
  canalNombre: string | null;
  habitaciones: ReservaHabitacion[];
  huespedes: DetalleHuesped[];
  servicios?: { servicioId: number; nombre: string }[] | null;
  /** 1:1 con la reserva; presente cuando hay CHECK_IN activo. Null en listados. */
  estanciaId?: number | null;
  fechaCreacion: string; // ISO datetime
  fechaModificacion: string;
}

export interface CancelacionResponse {
  reserva: Reserva;
  adelantoPagado: number;
  penalizacion: number;
  montoDevolucion: number;
  politicaAplicada: string;
}

// ---------- Payloads (request) -------------------------------------------

/** Política de pago: PARCIAL = 50% del total, TOTAL = 100%. El backend deriva el monto. */
export type ModalidadPago = 'PARCIAL' | 'TOTAL';

export interface ReservaHabitacionPayload {
  habitacionId: number;
  tipoHabitacionId: number;
  /** Solo staff la pacta (backend revalida 50%–200% del precio base). El cliente la omite. */
  tarifaPactada?: number | null;
}

export interface HuespedReservaPayload {
  huespedId: number;
  esPrincipal: boolean;
}

export interface CreateReservaPayload {
  fechaInicio: string;
  fechaFin: string;
  nroAdultos: number;
  nroNinos: number;
  /** Solo staff; tope 30% del subtotal. El cliente lo omite (backend fuerza 0). */
  descuento?: number;
  /** PARCIAL=50% | TOTAL=100%; opcional (backend default PARCIAL). El backend deriva el adelanto. */
  modalidadPago?: ModalidadPago;
  observaciones: string | null;
  /** Solo staff (dueño de la reserva). El cliente lo omite (se infiere del JWT). */
  usuarioId?: number | null;
  canalId?: number | null;
  habitaciones: ReservaHabitacionPayload[];
  huespedes: HuespedReservaPayload[];
  forzar?: boolean;
}

export interface UpdateReservaPayload {
  fechaInicio?: string;
  fechaFin?: string;
  nroAdultos?: number;
  nroNinos?: number;
  descuento?: number;
  /** Si se omite, el backend conserva la modalidad actual. */
  modalidadPago?: ModalidadPago;
  observaciones?: string | null;
  canalId?: number | null;
  habitaciones?: ReservaHabitacionPayload[];
  huespedes?: HuespedReservaPayload[];
}

export interface CambiarEstadoPayload {
  nuevoEstado: EstadoReserva;
  motivo?: string;
}

export interface CancelarReservaPayload {
  motivo: string;
  aplicarPenalizacion: boolean | null;
}

// ---------- Pagos ----------------------------------------------------------

export interface PagoReserva {
  pagoId: number;
  metodoPagoId: number;
  metodoPagoNombre: string;
  tipoPago: string;
  fecha: string;
  monto: number;
  comprobante: string | null;
  reservaId: number | null;
  fechaCreacion: string;
}

// ---------- Filtros y estadísticas ----------------------------------------

export interface ReservaFilter {
  codReserva?: string;
  estado?: EstadoReserva;
  usuarioId?: number;
  canalId?: number;
  huespedId?: number;
  fechaInicioDesde?: string;
  fechaInicioHasta?: string;
  fechaFinDesde?: string;
  fechaFinHasta?: string;
  montoTotalMin?: number;
  montoTotalMax?: number;
}

export interface ReservaStats {
  total: number;
  pendiente: number;
  confirmada: number;
  checkIn: number;
  checkOut: number;
  cancelada: number;
  noShow: number;
  todayCheckIns: number;
  todayCheckOuts: number;
}
