export type RoomStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';

/** Respuesta de GET /api/v1/habitaciones/calendario */
export interface HabitacionCalendarioItem {
  habitacionId: number;
  numero: string;
  piso: number;
  tipoHabitacionNombre: string;
  diasEstado: Record<string, string>; // "2026-07-01" → "DISPONIBLE"|"OCUPADA"|"RESERVADA"|"LIMPIEZA"|"MANTENIMIENTO"
}

export interface Room {
  id: number;
  number: string;
  type: 'simple' | 'double' | 'suite';
  status: RoomStatus;
  guestName?: string;
}

export interface DashboardStats {
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  cleaning: number;
  maintenance: number;
}