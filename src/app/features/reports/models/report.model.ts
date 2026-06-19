// features/reports/models/report.model.ts

export type ReportPeriod = 'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM';
export type ReportGroupBy = 'DAY' | 'WEEK' | 'MONTH';
export type ExportFormat = 'PDF' | 'EXCEL';

export interface ReportDateRange {
  period: ReportPeriod;
  fechaInicio: string | null; // ISO date, requerido si period = CUSTOM
  fechaFin: string | null; // ISO date, requerido si period = CUSTOM
  groupBy: ReportGroupBy;
}

export const DEFAULT_REPORT_RANGE: ReportDateRange = {
  period: 'MONTH',
  fechaInicio: null,
  fechaFin: null,
  groupBy: 'DAY',
};

// ---------------------------------------------------------------------
// Punto 12: Reporte de ingresos
// ---------------------------------------------------------------------

export interface RevenuePoint {
  fecha: string; // ISO date (inicio del periodo agrupado)
  ingresosAnticipos: number;
  ingresosSaldos: number;
  reembolsos: number;
}

export interface RevenueByMethod {
  metodoPago: string;
  monto: number;
  porcentaje: number;
}

export interface RevenueReport {
  totalIngresos: number;
  totalAnticipos: number;
  totalSaldos: number;
  totalReembolsos: number;
  ingresoPromedioDiario: number;
  serie: RevenuePoint[];
  porMetodoPago: RevenueByMethod[];
}

// ---------------------------------------------------------------------
// Punto 13: Reporte de reservas
// ---------------------------------------------------------------------

export interface ReservationsByStatus {
  estado: string;
  cantidad: number;
  porcentaje: number;
}

export interface ReservationsByRoomType {
  tipoHabitacion: string;
  cantidad: number;
  ingresos: number;
}

export interface ReservationsPoint {
  fecha: string;
  nuevas: number;
  canceladas: number;
  checkIns: number;
  checkOuts: number;
}

export interface ReservationsReport {
  totalReservas: number;
  totalCanceladas: number;
  tasaCancelacion: number;
  estanciaPromedioNoches: number;
  porEstado: ReservationsByStatus[];
  porTipoHabitacion: ReservationsByRoomType[];
  serie: ReservationsPoint[];
}

// ---------------------------------------------------------------------
// Punto 14: Reporte de ocupación
// ---------------------------------------------------------------------

export interface OccupancyPoint {
  fecha: string;
  habitacionesTotal: number;
  habitacionesOcupadas: number;
  porcentajeOcupacion: number;
}

export interface OccupancyByRoomType {
  tipoHabitacion: string;
  habitacionesTotal: number;
  nochesDisponibles: number;
  nochesOcupadas: number;
  porcentajeOcupacion: number;
  adr: number; // Average Daily Rate
  revpar: number; // Revenue per Available Room
}

export interface OccupancyReport {
  ocupacionPromedio: number;
  adrPromedio: number;
  revparPromedio: number;
  serie: OccupancyPoint[];
  porTipoHabitacion: OccupancyByRoomType[];
}

// ---------------------------------------------------------------------
// Punto 15: Dashboard gerencial
// ---------------------------------------------------------------------

export interface ManagementKpis {
  ingresosMesActual: number;
  ingresosMesAnterior: number;
  variacionIngresos: number; // porcentaje
  ocupacionActual: number;
  ocupacionMesAnterior: number;
  variacionOcupacion: number;
  reservasActivas: number;
  reservasPendientesPago: number;
  adrActual: number;
  revparActual: number;
  cancelacionesMes: number;
}

export interface ManagementDashboard {
  generadoEn: string;
  kpis: ManagementKpis;
  ingresos: RevenueReport;
  reservas: ReservationsReport;
  ocupacion: OccupancyReport;
}

// ---------------------------------------------------------------------
// Punto 17: Exportación
// ---------------------------------------------------------------------

export interface ExportRequest {
  tipo: 'INGRESOS' | 'RESERVAS' | 'OCUPACION' | 'GERENCIAL';
  formato: ExportFormat;
  rango: ReportDateRange;
}
