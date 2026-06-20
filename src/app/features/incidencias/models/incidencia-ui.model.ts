import { EstadoIncidencia, PrioridadIncidencia } from './incidencia.model';

export const ESTADO_INCIDENCIA_CONFIG: Record<
  EstadoIncidencia,
  { label: string; badgeTone: 'warning' | 'info' | 'success' | 'neutral' }
> = {
  ABIERTA: { label: 'Abierta', badgeTone: 'warning' },
  EN_PROCESO: { label: 'En proceso', badgeTone: 'info' },
  RESUELTA: { label: 'Resuelta', badgeTone: 'success' },
  CERRADA: { label: 'Cerrada', badgeTone: 'neutral' },
};

export const PRIORIDAD_INCIDENCIA_CONFIG: Record<
  PrioridadIncidencia,
  { label: string; badgeTone: 'danger' | 'warning' | 'neutral'; dotColor: string }
> = {
  ALTA: { label: 'Alta', badgeTone: 'danger', dotColor: 'bg-[var(--color-danger-500)]' },
  MEDIA: { label: 'Media', badgeTone: 'warning', dotColor: 'bg-[var(--color-warning-500)]' },
  BAJA: { label: 'Baja', badgeTone: 'neutral', dotColor: 'bg-[var(--color-ink-muted)]' },
};

export interface IncidenciaUiFilters {
  search: string;
  estado: EstadoIncidencia | '';
  prioridad: PrioridadIncidencia | '';
}

export const DEFAULT_INCIDENCIA_FILTERS: IncidenciaUiFilters = {
  search: '',
  estado: '',
  prioridad: '',
};

export interface IncidenciaStats {
  total: number;
  abiertas: number;
  enProceso: number;
  resueltas: number;
  altaPrioridad: number;
}
