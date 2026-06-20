// features/auditoria/models/auditoria.model.ts
// Tipos espejo del backend de Auditoría (sección 9 del doc). Solo lectura:
// no hay create/update/delete ni detalle por id.

export type ResultadoAuditoria = 'EXITO' | 'ERROR';

/** Respuesta de GET /api/v1/auditoria (cada item del PageResponse). */
export interface RegistroAuditoriaResponse {
  registroId: number;
  usuarioId: number | null; // null si fue acción de sistema/anónimo
  usuarioCorreo: string | null;
  accion: string; // valor libre, p.ej. CREAR_USUARIO
  modulo: string; // usuarios | roles | solicitudes
  descripcion: string | null;
  metodoHttp: string | null; // GET | POST | PUT | PATCH | DELETE
  ruta: string | null;
  ipOrigen: string | null;
  resultado: ResultadoAuditoria;
  detalleError: string | null; // solo presente si resultado = ERROR
  fecha: string; // ISO LocalDateTime
}

/** Query params del GET /api/v1/auditoria. Todos opcionales. */
export interface AuditoriaFilterRequest {
  usuarioId?: number;
  usuarioCorreo?: string;
  accion?: string;
  modulo?: string;
  resultado?: ResultadoAuditoria;
  fechaDesde?: string; // YYYY-MM-DD
  fechaHasta?: string; // YYYY-MM-DD
  page?: number;
  size?: number;
  sort?: string;
}
