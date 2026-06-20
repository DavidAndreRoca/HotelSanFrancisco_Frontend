// features/solicitudes/models/solicitud.model.ts
// Tipos espejo del backend real (ver sección 8.9 del spec). No inventar campos
// ni valores: cualquier cambio debe reflejar exactamente el contrato del backend.

// ── Enums (string-literal unions, convención del proyecto) ────────────────────

export type TipoSolicitud = 'INFORMACION' | 'ACCESO';

export type EstadoSolicitud =
  | 'REGISTRADA'
  | 'EN_EVALUACION'
  | 'ATENDIDA'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'CERRADA';

export type PrioridadSolicitud = 'ALTA' | 'MEDIA' | 'BAJA';

export type ModuloReferido =
  | 'RESERVAS'
  | 'HABITACIONES'
  | 'PAGOS'
  | 'EMPLEADOS'
  | 'REPORTES'
  | 'INVENTARIO'
  | 'OTRO';

export type TipoAcceso = 'ACCESO_MODULO' | 'CAMBIO_ROL' | 'ACTIVACION' | 'RECUPERACION';

export type AccionSeguimiento =
  | 'CREACION'
  | 'ASIGNACION'
  | 'CAMBIO_ESTADO'
  | 'OBSERVACION'
  | 'APROBACION'
  | 'RECHAZO'
  | 'CIERRE';

// ── Response DTOs ─────────────────────────────────────────────────────────────

export interface SolicitudResponse {
  solicitudId: number;
  codigoSolicitud: string;
  fechaRegistro: string; // ISO LocalDateTime
  tipoSolicitud: TipoSolicitud;
  asunto: string;
  descripcion: string;
  prioridad: PrioridadSolicitud;
  moduloReferido: ModuloReferido | null;
  estado: EstadoSolicitud;
  observaciones: string | null;
  fechaCierre: string | null;
  rolSolicitado: string | null; // solo ACCESO
  tipoAcceso: TipoAcceso | null; // solo ACCESO
  periodoInicio: string | null; // ISO LocalDate, solo ACCESO
  periodoFin: string | null; // ISO LocalDate, solo ACCESO
  solicitanteId: number;
  solicitanteNombre: string;
  responsableId: number | null;
  responsableNombre: string | null;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface SeguimientoSolicitudResponse {
  seguimientoId: number;
  solicitudId: number;
  fechaAccion: string;
  accion: AccionSeguimiento;
  estadoAnterior: EstadoSolicitud | null;
  estadoNuevo: EstadoSolicitud;
  observacion: string | null;
  responsableId: number;
  responsableNombre: string;
}

export interface SolicitudReporteResponse {
  total: number;
  porEstado: Record<EstadoSolicitud, number>;
  porTipo: Record<TipoSolicitud, number>;
  pendientes: number;
  cerradas: number;
}

// ── Request DTOs ──────────────────────────────────────────────────────────────

export interface CreateSolicitudRequest {
  tipoSolicitud: TipoSolicitud;
  asunto: string;
  descripcion: string;
  prioridad?: PrioridadSolicitud;
  moduloReferido?: ModuloReferido;
  rolSolicitado?: string;
  tipoAcceso?: TipoAcceso;
  periodoInicio?: string;
  periodoFin?: string;
}

export interface UpdateSolicitudRequest {
  asunto?: string;
  descripcion?: string;
  prioridad?: PrioridadSolicitud;
  moduloReferido?: ModuloReferido;
}

export interface AsignarResponsableRequest {
  responsableId: number;
  observacion?: string;
}

export interface CambiarEstadoSolicitudRequest {
  nuevoEstado: EstadoSolicitud;
  observacion?: string; // obligatorio si nuevoEstado = RECHAZADA
}

export interface RegistrarSeguimientoRequest {
  observacion: string;
}

export interface SolicitudFilterRequest {
  estado?: EstadoSolicitud;
  tipoSolicitud?: TipoSolicitud;
  prioridad?: PrioridadSolicitud;
  moduloReferido?: ModuloReferido;
  solicitanteId?: number;
  responsableId?: number;
  fechaRegistroDesde?: string; // ISO LocalDateTime
  fechaRegistroHasta?: string;
  page?: number;
  size?: number;
  sort?: string;
}
