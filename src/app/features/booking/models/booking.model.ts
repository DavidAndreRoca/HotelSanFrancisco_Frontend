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
  metodoPagoNombre: string;
}
