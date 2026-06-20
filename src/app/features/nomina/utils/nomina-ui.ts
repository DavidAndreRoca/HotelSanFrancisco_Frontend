// features/nomina/utils/nomina-ui.ts
import { EstadoNomina } from '../models/nomina.model';

export const ESTADO_LABEL: Record<EstadoNomina, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  ANULADO: 'Anulado',
};

export const ESTADO_BADGE: Record<EstadoNomina, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  PAGADO: 'bg-emerald-100 text-emerald-700',
  ANULADO: 'bg-red-100 text-red-600',
};

/**
 * Transiciones de estado permitidas (sección 6 del doc):
 *  PENDIENTE → PAGADO | ANULADO ; PAGADO y ANULADO son terminales.
 */
export function transicionesNomina(estado: EstadoNomina): EstadoNomina[] {
  return estado === 'PENDIENTE' ? ['PAGADO', 'ANULADO'] : [];
}

/** Formato de moneda — solo presentación, no afecta valores oficiales. */
export function formatMonto(n: number): string {
  return 'S/. ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
