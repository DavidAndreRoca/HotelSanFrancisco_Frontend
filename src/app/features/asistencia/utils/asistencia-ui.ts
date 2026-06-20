// features/asistencia/utils/asistencia-ui.ts
import { TipoAsistencia } from '../models/asistencia.model';

export const TIPO_ASISTENCIA: { value: TipoAsistencia; label: string }[] = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'TARDANZA', label: 'Tardanza' },
  { value: 'FALTA_JUSTIFICADA', label: 'Falta justificada' },
  { value: 'FALTA_INJUSTIFICADA', label: 'Falta injustificada' },
  { value: 'PERMISO', label: 'Permiso' },
];

export const TIPO_LABEL: Record<TipoAsistencia, string> = {
  NORMAL: 'Normal',
  TARDANZA: 'Tardanza',
  FALTA_JUSTIFICADA: 'Falta justificada',
  FALTA_INJUSTIFICADA: 'Falta injustificada',
  PERMISO: 'Permiso',
};

export const TIPO_BADGE: Record<TipoAsistencia, string> = {
  NORMAL: 'bg-emerald-100 text-emerald-700',
  TARDANZA: 'bg-amber-100 text-amber-700',
  FALTA_JUSTIFICADA: 'bg-blue-100 text-blue-700',
  FALTA_INJUSTIFICADA: 'bg-red-100 text-red-600',
  PERMISO: 'bg-purple-100 text-purple-700',
};
