export type EstadoActivo = 'ACTIVO' | 'INACTIVO';

// ---------- Entidad principal --------------------------------------------

export interface Cliente {
  huespedId: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  nombreCompleto: string;
  numeroDocumento: string;
  nacionalidad: string | null;
  correo: string | null;
  telefono: string | null;
  estado: EstadoActivo;
  usuarioId: number | null;
  usuarioNombre: string | null;
  fechaCreacion: string; // ISO datetime
  fechaModificacion: string;
}

// ---------- Payloads (request) -------------------------------------------

export interface CreateClientePayload {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  numeroDocumento: string;
  nacionalidad: string | null;
  correo: string | null;
  telefono: string | null;
  estado: EstadoActivo;
  usuarioId: number | null;
}

export type UpdateClientePayload = Partial<CreateClientePayload>;

// ---------- Filtros y estadísticas ----------------------------------------

export interface ClienteFilter {
  nombre?: string;
  apellidoPaterno?: string;
  numeroDocumento?: string;
  estado?: EstadoActivo;
}

export interface ClienteStats {
  total: number;
  activos: number;
  inactivos: number;
}
