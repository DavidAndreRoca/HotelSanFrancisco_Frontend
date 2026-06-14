export type EstadoIncidencia = 'ABIERTA' | 'EN_PROCESO' | 'RESUELTA' | 'CERRADA';
export type PrioridadIncidencia = 'ALTA' | 'MEDIA' | 'BAJA';

export interface Incidencia {
  incidenciaId: number;
  descripcion: string;
  fechaReporte: string;
  fechaResolucion: string | null;
  prioridad: PrioridadIncidencia;
  solucion: string | null;
  estado: EstadoIncidencia;
  usuarioId: number;
  usuarioNombre: string | null;
  reservaHabitacionId: number | null;
  fechaCreacion: string | null;
  fechaModificacion: string | null;
}

export interface CreateIncidenciaPayload {
  descripcion: string;
  fechaReporte: string;
  prioridad: PrioridadIncidencia;
  usuarioId: number;
  reservaHabitacionId?: number;
}

export interface UpdateIncidenciaPayload {
  descripcion?: string;
  prioridad?: PrioridadIncidencia;
  solucion?: string;
  reservaHabitacionId?: number;
}

export interface CambiarEstadoIncidenciaPayload {
  nuevoEstado: EstadoIncidencia;
  solucion?: string;
}

export interface IncidenciaFilters {
  estado?: EstadoIncidencia;
  prioridad?: PrioridadIncidencia;
  usuarioId?: number;
  reservaHabitacionId?: number;
}
