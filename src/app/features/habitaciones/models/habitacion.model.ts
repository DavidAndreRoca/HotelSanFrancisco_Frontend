export type EstadoHabitacion = 'DISPONIBLE' | 'OCUPADA' | 'LIMPIEZA' | 'MANTENIMIENTO' | 'BLOQUEADA';

export interface Habitacion {
  habitacionId: number;
  numero: string;
  piso: number;
  estado: EstadoHabitacion;
  descripcion: string | null;
  observaciones: string | null;
  tipoHabitacionId: number | null;
  tipoHabitacionNombre: string | null;
  precioBase: number | null;
  capacidadMaxima: number | null;
  fechaCreacion: string | null;
  fechaModificacion: string | null;
}

export interface CreateHabitacionPayload {
  numero: string;
  piso: number;
  estado: EstadoHabitacion;
  tipoHabitacionId?: number | null;
  descripcion?: string;
  observaciones?: string;
}

export interface UpdateHabitacionPayload {
  numero?: string;
  piso?: number;
  estado?: EstadoHabitacion;
  tipoHabitacionId?: number | null;
  descripcion?: string;
  observaciones?: string;
}

export interface CheckInPayload {
  reservaId: number;
  usuarioId: number;
  observaciones?: string;
}

export interface CheckOutPayload {
  reservaId: number;
  usuarioId: number;
  consumosAdicionales?: number;
  observaciones?: string;
}

export interface CheckOutLiquidacion {
  reservaId: number;
  codReserva: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  consumosAdicionales: number;
  montoTotal: number;
  adelanto: number;
  montoPendiente: number;
  fechaCheckin: string | null;
  fechaCheckout: string | null;
  noches: number;
}

export const ESTADO_HABITACION_CONFIG: Record<EstadoHabitacion, {
  label: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
}> = {
  DISPONIBLE: {
    label: 'Disponible',
    borderColor: 'border-[var(--color-success-500)]',
    bgColor: 'bg-[var(--color-success-500)]/8',
    textColor: 'text-[var(--color-success-700)]',
    dotColor: 'bg-[var(--color-success-500)]',
  },
  OCUPADA: {
    label: 'Ocupada',
    borderColor: 'border-[var(--color-danger-500)]',
    bgColor: 'bg-[var(--color-danger-500)]/8',
    textColor: 'text-[var(--color-danger-700)]',
    dotColor: 'bg-[var(--color-danger-500)]',
  },
  LIMPIEZA: {
    label: 'En limpieza',
    borderColor: 'border-[var(--color-warning-500)]',
    bgColor: 'bg-[var(--color-warning-500)]/8',
    textColor: 'text-[var(--color-warning-700)]',
    dotColor: 'bg-[var(--color-warning-500)]',
  },
  MANTENIMIENTO: {
    label: 'Mantenimiento',
    borderColor: 'border-[var(--color-ink-muted)]',
    bgColor: 'bg-[var(--color-ink-muted)]/8',
    textColor: 'text-[var(--color-ink-muted)]',
    dotColor: 'bg-[var(--color-ink-muted)]',
  },
  BLOQUEADA: {
    label: 'Bloqueada',
    borderColor: 'border-[var(--color-ink)]',
    bgColor: 'bg-[var(--color-ink)]/8',
    textColor: 'text-[var(--color-ink)]',
    dotColor: 'bg-[var(--color-ink)]',
  },
};
