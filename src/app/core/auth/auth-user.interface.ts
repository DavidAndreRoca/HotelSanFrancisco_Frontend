export interface AuthUser {
  usuarioId: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  correo: string;
  rol: string;
  permisos: readonly string[];
  telefono?: string | null;
  direccion?: string | null;
  nacionalidad?: string | null;
  fechaCreacion?: string | null;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface LoginResponseBody {
  success: boolean;
  message: string;
  user: AuthUser;
  timestamp: string;
}

export interface ChangePasswordRequest {
  contrasenaActual: string;
  nuevaContrasena: string;
}

export interface ForgotPasswordRequest {
  correo: string;
}

export interface ResetPasswordRequest {
  token: string;
  nuevaContrasena: string;
}

/** Respuesta de GET /auth/me/dashboard — resumen del cliente sin permisos admin */
export interface MiDashboardResponse {
  usuarioId: number;
  nombreCompleto: string;
  reservas: {
    total: number;
    activas: number;
    proximaReserva: {
      reservaId: number;
      codReserva: string;
      fechaInicio: string;
      fechaFin: string;
      estado: string;
      habitacion: string;
    } | null;
  };
  pagosPendientes: number;
  montoDeuda: number;
}

/** Item de GET /api/v1/me/reservas */
export interface MiReservaItem {
  reservaId: number;
  codReserva: string;
  fechaInicio: string;
  fechaFin: string;
  montoTotal: number;
  estado: string;
  nroAdultos: number;
  nroNinos: number;
  habitaciones: {
    habitacionId: number;
    habitacionNumero: string;
    tipoHabitacionNombre: string;
    noches: number;
  }[];
}

/** Respuesta de GET /auth/me/perfil — incluye campos extendidos no presentes en AuthUser */
export interface PerfilUsuarioResponse {
  usuarioId: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  nombreCompleto: string;
  correo: string;
  telefono?: string | null;
  direccion?: string | null;
  nacionalidad?: string | null;
  numeroDocumento?: string | null;
  tipoDocumentoAcronimo?: string | null;
  rol: string;
  permisos: readonly string[];
  fechaCreacion?: string | null;
}

/** Body de PATCH /auth/me */
export interface UpdatePerfilRequest {
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  nacionalidad?: string | null;
}

/** Item de reserva dentro del dashboard del cliente */
export interface DashboardReservaItem {
  reservaId: number;
  codReserva: string;
  tipoHabitacionNombre: string;
  habitacionNumero: string;
  nroHuespedes: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  noches: number;
  imagenUrl?: string | null;
}

/** Respuesta de GET /auth/me/dashboard */
export interface DashboardClienteResponse {
  usuarioId: number;
  nombreCompleto: string;
  reservasActivas: number;
  proximasReservas: number;
  diasEnHotel: number;
  montoDeuda: number;
  estadias: DashboardReservaItem[];
}

export interface RegisterRequest {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  tipoDocumentoId: number;
  numeroDocumento: string;
  correo: string;
  telefono?: string | null;
  fechaNacimiento?: string | null;
  nacionalidad?: string | null;
  contrasena: string;
}

export interface PublicDocumentType {
  tipoDocumentoId: number;
  acronimo: string;
  nombre: string;
}
