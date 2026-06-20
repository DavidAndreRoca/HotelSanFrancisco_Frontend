// features/pos/utils/venta-ui.ts
import { EstadoVenta, TipoVenta } from '../models/venta.model';

export const ESTADO_LABEL: Record<EstadoVenta, string> = {
  PENDIENTE: 'Pendiente',
  COMPLETADA: 'Completada',
  ANULADA: 'Anulada',
};

export const ESTADO_BADGE: Record<EstadoVenta, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  COMPLETADA: 'bg-emerald-100 text-emerald-700',
  ANULADA: 'bg-red-100 text-red-600',
};

export const TIPO_LABEL: Record<TipoVenta, string> = {
  DIRECTA: 'Directa',
  CARGO_HABITACION: 'Cargo a habitación',
  DELIVERY: 'Delivery',
  EVENTO: 'Evento',
};

export const TIPOS_VENTA: TipoVenta[] = ['DIRECTA', 'CARGO_HABITACION', 'DELIVERY', 'EVENTO'];

/**
 * Transiciones de estado permitidas (sección 5 del doc):
 *  PENDIENTE → COMPLETADA | ANULADA ; COMPLETADA → ANULADA ; ANULADA terminal.
 */
export function transicionesVenta(estado: EstadoVenta): EstadoVenta[] {
  switch (estado) {
    case 'PENDIENTE':  return ['COMPLETADA', 'ANULADA'];
    case 'COMPLETADA': return ['ANULADA'];
    default:           return [];
  }
}

export function formatMonto(n: number): string {
  return 'S/. ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
