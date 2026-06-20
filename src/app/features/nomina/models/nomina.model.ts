// features/nomina/models/nomina.model.ts
// Tipos espejo del backend RRHH — Nómina (sección 9 del doc).
// Regla: los valores financieros (montoNeto, totalBonos) SIEMPRE provienen del
// backend en PagoNominaResponse. El frontend no calcula valores oficiales.

export type EstadoNomina = 'PENDIENTE' | 'PAGADO' | 'ANULADO';

export interface PagoNominaResponse {
  pagoNominaId: number;
  periodo: string;
  fechaEmision: string; // "YYYY-MM-DD"
  sueldoBase: number;
  totalBonos: number; // calculado por backend (0 al crear)
  totalDescuentos: number;
  montoNeto: number; // calculado por backend
  estado: EstadoNomina;
  usuarioId: number;
  usuarioNombreCompleto: string;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface CreatePagoNominaRequest {
  periodo: string;
  fechaEmision: string;
  sueldoBase: number;
  totalDescuentos: number;
  usuarioId: number;
  // NO enviar totalBonos ni montoNeto — los calcula el backend.
}

export interface CambiarEstadoPagoNominaRequest {
  nuevoEstado: EstadoNomina;
  motivo?: string; // no se persiste en BD
}

export interface PagoNominaFilterRequest {
  periodo?: string;
  usuarioId?: number;
  estado?: EstadoNomina;
  page?: number;
  size?: number;
  sort?: string;
}
