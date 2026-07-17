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
  guests: number;
}

export interface BookingDatosHuesped {
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  serviciosAdicionales: string;
  nroAdultos: number;
  nroNinos: number;
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
