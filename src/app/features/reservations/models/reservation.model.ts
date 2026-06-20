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
  estadoAnterior: EstadoReserva;
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
  montoTotal: number;
  estado: EstadoReserva;
  nroAdultos: number;
  nroNinos: number;
  subtotal: number;
  descuento: number;
  adelanto: number;
  impuesto: number;
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

export interface ReservaHabitacionPayload {
  habitacionId: number;
  tipoHabitacionId: number;
  tarifaPactada: number | null;
}

export interface HuespedReservaPayload {
  huespedId: number;
  esPrincipal: boolean;
}

export interface CreateReservaPayload {
  codReserva: string;
  fechaInicio: string;
  fechaFin: string;
  nroAdultos: number;
  nroNinos: number;
  descuento: number;
  adelanto: number;
  impuesto: number;
  observaciones: string | null;
  usuarioId: number | null;
  canalId: number | null;
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
  adelanto?: number;
  impuesto?: number;
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
