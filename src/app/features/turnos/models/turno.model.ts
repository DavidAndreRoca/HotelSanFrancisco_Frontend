// features/turnos/models/turno.model.ts
// Tipos espejo del backend — Turnos (planificación). Solo ADMIN/RRHH.

export type EstadoTurno =
  | 'PLANIFICADO'
  | 'CONFIRMADO'
  | 'CUBIERTO'
  | 'AUSENTE'
  | 'CANCELADO';

export type OrigenTurno = 'PLANTILLA' | 'MANUAL';

export interface TurnoResponse {
  turnoId: number;
  usuarioId: number;
  usuarioNombreCompleto: string;
  horarioId: number;
  horarioNombreTurno: string;
  fecha: string; // "YYYY-MM-DD"
  horaInicio: string; // "HH:mm:ss"
  horaFin: string; // "HH:mm:ss"
  estado: EstadoTurno;
  origen: OrigenTurno;
}

/** Body de POST /turnos/generar. */
export interface GenerarTurnosRequest {
  desde: string; // "YYYY-MM-DD"
  hasta: string; // "YYYY-MM-DD"
}

export interface GenerarTurnosResponse {
  generados: number;
  omitidos: number;
  turnos: TurnoResponse[];
}

/** Body de PATCH /turnos/{turnoId}. Todos los campos opcionales. */
export interface UpdateTurnoRequest {
  horarioId?: number;
  horaInicio?: string;
  horaFin?: string;
  estado?: EstadoTurno;
}
