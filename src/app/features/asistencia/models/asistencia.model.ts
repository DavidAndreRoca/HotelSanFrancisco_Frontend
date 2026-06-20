// features/asistencia/models/asistencia.model.ts
// Tipos espejo del backend RRHH — Asistencia (sección 9 del doc).

export type TipoAsistencia =
  | 'NORMAL'
  | 'TARDANZA'
  | 'FALTA_JUSTIFICADA'
  | 'FALTA_INJUSTIFICADA'
  | 'PERMISO';

export interface AsistenciaResponse {
  asistenciaId: number;
  fecha: string; // "YYYY-MM-DD"
  horaIngreso: string; // "HH:mm:ss"
  horaEgreso: string | null;
  horasTrabajadas: number | null;
  tipo: TipoAsistencia;
  observaciones: string | null;
  usuarioId: number;
  usuarioNombreCompleto: string;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface CreateAsistenciaRequest {
  fecha: string;
  horaIngreso: string; // "HH:mm:ss"
  tipo: TipoAsistencia;
  observaciones?: string;
  usuarioId: number;
}

export interface UpdateAsistenciaRequest {
  horaIngreso?: string;
  horaEgreso?: string;
  tipo?: TipoAsistencia;
  observaciones?: string;
}

export interface AsistenciaFilterRequest {
  fechaInicio?: string;
  fechaFin?: string;
  usuarioId?: number;
  tipo?: TipoAsistencia;
  page?: number;
  size?: number;
  sort?: string;
}
