// features/horarios/models/horario.model.ts
// Tipos espejo del backend RRHH — Horarios y Asignaciones (sección 9 del doc).

export type EstadoActivo = 'ACTIVO' | 'INACTIVO';

// ── Horario ───────────────────────────────────────────────────────────────────

export interface HorarioResponse {
  horarioId: number;
  nombreTurno: string;
  horaEntrada: string; // "HH:mm:ss"
  horaSalida: string; // "HH:mm:ss"
  estado: EstadoActivo;
  fechaCreacion: string; // ISO LocalDateTime
  fechaModificacion: string | null;
}

export interface CreateHorarioRequest {
  nombreTurno: string;
  horaEntrada: string; // "HH:mm:ss"
  horaSalida: string;
}

export interface UpdateHorarioRequest {
  nombreTurno?: string;
  horaEntrada?: string;
  horaSalida?: string;
  estado?: EstadoActivo;
}

export interface HorarioFilterRequest {
  nombreTurno?: string;
  estado?: EstadoActivo;
  page?: number;
  size?: number;
  sort?: string;
}

// ── Asignación de horario ─────────────────────────────────────────────────────

export interface DetalleHorarioResponse {
  detalleHorarioId: number;
  usuarioId: number;
  usuarioNombreCompleto: string;
  horarioId: number;
  horarioNombreTurno: string;
  diaSemana: number; // 1=Lunes … 7=Domingo
  estado: EstadoActivo;
  fechaVigenciaInicio: string; // "YYYY-MM-DD"
  fechaVigenciaFin: string | null;
}

export interface AsignarHorarioRequest {
  horarioId: number;
  usuarioId: number;
  diaSemana: number;
  fechaVigenciaInicio: string;
  fechaVigenciaFin?: string | null;
}

/** Body de PUT /asignaciones-horario/{detalleHorarioId}. */
export interface ActualizarAsignacionRequest {
  diaSemana?: number;
  fechaVigenciaInicio?: string;
  fechaVigenciaFin?: string | null;
  estado?: EstadoActivo;
}
