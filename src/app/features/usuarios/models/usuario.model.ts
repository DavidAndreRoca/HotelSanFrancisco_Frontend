// features/usuarios/models/usuario.model.ts
// Tipos espejo del backend — Usuarios (sección 9 del doc).

export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

export interface UsuarioResponse {
  usuarioId: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  nombreCompleto: string;
  numeroDocumento: string;
  correo: string;
  telefono: string | null;
  fechaNacimiento: string | null; // "YYYY-MM-DD"
  estado: EstadoUsuario;
  rolId: number;
  rolNombre: string;
  tipoDocumentoId: number;
  tipoDocumentoAcronimo: string;
  fechaCreacion: string;
  fechaModificacion: string | null;
  // Campos laborales (null si no aplica)
  cargo: string | null;
  departamento: string | null;
  codigoEmpleado: string | null;
  fechaIngreso: string | null;
  salario: number | null;
}

export interface CreateUsuarioRequest {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  numeroDocumento: string;
  correo: string;
  telefono?: string;
  fechaNacimiento?: string;
  contrasena: string;
  rolId: number;
  tipoDocumentoId: number;
  estado: EstadoUsuario;
  cargo?: string;
  departamento?: string;
  codigoEmpleado?: string;
  fechaIngreso?: string;
  salario?: number;
}

/** Patch parcial — todos opcionales (sin contraseña). */
export type UpdateUsuarioRequest = Partial<Omit<CreateUsuarioRequest, 'contrasena'>>;

export interface CambiarEstadoUsuarioRequest {
  nuevoEstado: EstadoUsuario;
}

export interface CambiarRolUsuarioRequest {
  rolId: number;
}

export interface UsuarioFilterRequest {
  nombre?: string;
  correo?: string;
  estado?: EstadoUsuario;
  rolId?: number;
  tipoDocumentoId?: number;
  cargo?: string;
  departamento?: string;
  esEmpleado?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
