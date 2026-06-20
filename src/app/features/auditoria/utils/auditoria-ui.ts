// features/auditoria/utils/auditoria-ui.ts
// Mapas de formato (label + clases de badge) y helpers centralizados para la
// pantalla de Auditoría, mismo enfoque que solicitud-ui.ts.

import { ResultadoAuditoria } from '../models/auditoria.model';

// ── Resultado ─────────────────────────────────────────────────────────────────

export const RESULTADO_LABEL: Record<ResultadoAuditoria, string> = {
  EXITO: 'Éxito',
  ERROR: 'Error',
};

export const RESULTADO_BADGE: Record<ResultadoAuditoria, string> = {
  EXITO: 'bg-emerald-100 text-emerald-700',
  ERROR: 'bg-red-100 text-red-600',
};

// ── Método HTTP ───────────────────────────────────────────────────────────────

export function metodoBadge(metodo: string | null): string {
  switch (metodo) {
    case 'GET':    return 'bg-blue-100 text-blue-700';
    case 'POST':   return 'bg-emerald-100 text-emerald-700';
    case 'PUT':    return 'bg-amber-100 text-amber-700';
    case 'PATCH':  return 'bg-amber-100 text-amber-700';
    case 'DELETE': return 'bg-red-100 text-red-600';
    default:       return 'bg-gray-100 text-gray-600';
  }
}

// ── Módulos con auditoría (los únicos con @Auditable en backend) ──────────────

export const MODULOS_AUDITABLES: string[] = ['usuarios', 'roles', 'solicitudes'];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatFechaHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}
