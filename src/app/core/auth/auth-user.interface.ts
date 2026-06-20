export interface AuthUser {
  usuarioId: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  correo: string;
  rol: string;
  permisos: readonly string[];
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
