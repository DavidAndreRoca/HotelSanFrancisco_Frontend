// features/solicitudes/utils/solicitud-ui.ts
// Lógica de tier (modelo de permisos por nivel, no por nombre de rol) + mapas de
// formato (label + clases de badge) centralizados para que las 6 pantallas del
// módulo muestren estados, prioridades y tipos de forma consistente.

import {
  AccionSeguimiento,
  EstadoSolicitud,
  ModuloReferido,
  PrioridadSolicitud,
  SolicitudResponse,
  TipoSolicitud,
} from '../models/solicitud.model';

export type SolicitudTier = 1 | 2 | 3;

/**
 * Resuelve el nivel de permiso del usuario por tier, no hardcodeando rol por rol.
 *  - Tier 1 (Gestión total): ADMIN
 *  - Tier 2 (Gestión limitada): RECEPCION
 *  - Tier 3 (Autogestión): CLIENTE y cualquier otro perfil sin gestión
 *    (CAJA, RRHH, INVENTARIO y futuros roles).
 */
export function resolverTier(rol: string | null | undefined): SolicitudTier {
  if (rol === 'ADMIN') return 1;
  if (rol === 'RECEPCION') return 2;
  return 3;
}

// ── Estado ────────────────────────────────────────────────────────────────────

export const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  REGISTRADA: 'Registrada',
  EN_EVALUACION: 'En evaluación',
  ATENDIDA: 'Atendida',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  CERRADA: 'Cerrada',
};

export const ESTADO_BADGE: Record<EstadoSolicitud, string> = {
  REGISTRADA: 'bg-gray-100 text-gray-600',
  EN_EVALUACION: 'bg-blue-100 text-blue-700',
  ATENDIDA: 'bg-teal-100 text-teal-700',
  APROBADA: 'bg-emerald-100 text-emerald-700',
  RECHAZADA: 'bg-red-100 text-red-600',
  CERRADA: 'bg-[#2D2926]/10 text-[#2D2926]',
};

// ── Prioridad ─────────────────────────────────────────────────────────────────

export const PRIORIDAD_LABEL: Record<PrioridadSolicitud, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
};

export const PRIORIDAD_BADGE: Record<PrioridadSolicitud, string> = {
  ALTA: 'bg-red-100 text-red-600',
  MEDIA: 'bg-amber-100 text-amber-700',
  BAJA: 'bg-green-100 text-green-700',
};

// ── Tipo ──────────────────────────────────────────────────────────────────────

export const TIPO_LABEL: Record<TipoSolicitud, string> = {
  INFORMACION: 'Información',
  ACCESO: 'Acceso',
};

export const TIPO_BADGE: Record<TipoSolicitud, string> = {
  INFORMACION: 'bg-blue-50 text-blue-600',
  ACCESO: 'bg-purple-50 text-purple-600',
};

// ── Módulo ────────────────────────────────────────────────────────────────────

export const MODULO_LABEL: Record<ModuloReferido, string> = {
  RESERVAS: 'Reservas',
  HABITACIONES: 'Habitaciones',
  PAGOS: 'Pagos',
  EMPLEADOS: 'Empleados',
  REPORTES: 'Reportes',
  INVENTARIO: 'Inventario',
  OTRO: 'Otro',
};

// ── Acción del seguimiento ────────────────────────────────────────────────────

export const ACCION_LABEL: Record<AccionSeguimiento, string> = {
  CREACION: 'Creación',
  ASIGNACION: 'Asignación',
  CAMBIO_ESTADO: 'Cambio de estado',
  OBSERVACION: 'Observación',
  APROBACION: 'Aprobación',
  RECHAZO: 'Rechazo',
  CIERRE: 'Cierre',
};

// ── Máquina de estados (sección 3 / 8.5 del backend) ──────────────────────────

const TRANSICIONES: Record<EstadoSolicitud, EstadoSolicitud[]> = {
  REGISTRADA: ['EN_EVALUACION', 'CERRADA'],
  EN_EVALUACION: ['ATENDIDA', 'APROBADA', 'RECHAZADA', 'CERRADA'],
  ATENDIDA: ['CERRADA'],
  APROBADA: ['CERRADA'],
  RECHAZADA: ['CERRADA'],
  CERRADA: [],
};

/**
 * Estados a los que se puede transicionar desde el estado actual, ya filtrados
 * por todas las reglas de negocio combinadas:
 *  - máquina de estados base
 *  - ATENDIDA solo para INFORMACION; APROBADA/RECHAZADA solo para ACCESO
 *  - CERRADA requiere que haya responsable asignado
 *  - Tier 2 (RECEPCION) solo puede operar solicitudes de tipo INFORMACION
 *  - Tier 3 no gestiona (siempre vacío)
 */
export function transicionesPermitidas(
  s: SolicitudResponse,
  tier: SolicitudTier,
): EstadoSolicitud[] {
  if (tier === 3) return [];
  if (tier === 2 && s.tipoSolicitud !== 'INFORMACION') return [];

  let next = TRANSICIONES[s.estado] ?? [];

  next = next.filter((e) => {
    if (e === 'ATENDIDA') return s.tipoSolicitud === 'INFORMACION';
    if (e === 'APROBADA' || e === 'RECHAZADA') return s.tipoSolicitud === 'ACCESO';
    return true;
  });

  if (s.responsableId == null) {
    next = next.filter((e) => e !== 'CERRADA');
  }

  return next;
}

/** ¿Este tier puede operar (atender) esta solicitud? */
export function puedeAtender(s: SolicitudResponse, tier: SolicitudTier): boolean {
  if (tier === 1) return s.estado !== 'CERRADA';
  if (tier === 2) return s.tipoSolicitud === 'INFORMACION' && s.estado !== 'CERRADA';
  return false;
}
