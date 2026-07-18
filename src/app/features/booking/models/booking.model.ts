export interface HabitacionDisponible {
  habitacionId: number;
  numero: string;
  piso: number;
  tipoHabitacionId: number;
  tipoHabitacionNombre: string;
  descripcion: string | null;
  precioBase: number;
  capacidadMaxima: number;
}

export interface MetodoPagoPublico {
  metodoPagoId: number;
  nombre: string;
  requiereComprobante: boolean;
}

export interface SearchParams {
  checkIn: string;
  checkOut: string;
  /** Total de huéspedes (adultos + niños), usado por la consulta de disponibilidad. */
  guests: number;
  adultos: number;
  ninos: number;
}

export interface BookingAcompanante {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  numeroDocumento: string;
  nacionalidad?: string;
  correo?: string;
  telefono?: string;
}

export interface BookingDatosHuesped {
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  serviciosAdicionales: string;
  nroAdultos: number;
  nroNinos: number;
  acompanantes: BookingAcompanante[];
}

export type TipoPago = 'TOTAL' | 'ANTICIPO';

export interface BookingConfirmationResponse {
  reservaId: number;
  codReserva: string;
  fechaInicio: string;
  fechaFin: string;
  noches: number;
  habitacionNumero: string;
  habitacionPiso: number;
  tipoHabitacionNombre: string;
  /** Todas las habitaciones de la reserva (selección múltiple). */
  habitaciones: Array<{
    numero: string;
    piso: number;
    tipoNombre: string;
    precioNoche: number;
  }>;
  huespedNombres: string;
  huespedApellidos: string;
  huespedDocumento: string;
  huespedCorreo: string;
  huespedTelefono: string;
  precioNoche: number;
  subtotal: number;
  impuesto: number;
  montoTotal: number;
  tipoPago: TipoPago;
  adelanto: number;
  montoPendiente: number;
  /** PENDIENTE al crear la pre-reserva; CONFIRMADA tras autorizar el pago. */
  estadoReserva: string;
}

/** Datos para abrir el checkout de Niubiz (el monto lo fija el backend). */
export interface CrearSesionPagoResponse {
  reservaId: number;
  purchaseNumber: string;
  sessionKey: string;
  merchantId: string;
  monto: number;
  moneda: string;
  checkoutScriptUrl: string;
  expirationTime: number | null;
}
