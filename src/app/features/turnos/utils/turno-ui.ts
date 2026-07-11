// features/turnos/utils/turno-ui.ts
import { EstadoTurno } from '../models/turno.model';

export const ESTADO_TURNO: { value: EstadoTurno; label: string }[] = [
  { value: 'PLANIFICADO', label: 'Planificado' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'CUBIERTO', label: 'Cubierto' },
  { value: 'AUSENTE', label: 'Ausente' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export const ESTADO_TURNO_LABEL: Record<EstadoTurno, string> = {
  PLANIFICADO: 'Planificado',
  CONFIRMADO: 'Confirmado',
  CUBIERTO: 'Cubierto',
  AUSENTE: 'Ausente',
  CANCELADO: 'Cancelado',
};

// Clases para la celda del calendario (fondo + texto + borde).
export const ESTADO_TURNO_CELDA: Record<EstadoTurno, string> = {
  PLANIFICADO: 'bg-slate-100 text-slate-700 border-slate-200',
  CONFIRMADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CUBIERTO: 'bg-amber-100 text-amber-700 border-amber-200',
  AUSENTE: 'bg-red-100 text-red-600 border-red-200',
  CANCELADO: 'bg-gray-100 text-gray-400 border-gray-200 line-through',
};
