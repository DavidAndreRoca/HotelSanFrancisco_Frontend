// features/pos/models/venta.model.ts
// Tipos espejo del backend — POS / Ventas (sección 9 del doc).

export type EstadoVenta = 'PENDIENTE' | 'COMPLETADA' | 'ANULADA';
export type TipoVenta = 'DIRECTA' | 'CARGO_HABITACION' | 'DELIVERY' | 'EVENTO';

export interface DetalleVentaResponse {
  ventaId: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  descuentoUnitario: number;
  subtotal: number; // calculado por backend
}

export interface VentaResponse {
  ventaId: number;
  codigoVenta: string;
  tipoVenta: TipoVenta;
  montoTotal: number; // calculado por backend
  fechaVenta: string;
  estado: EstadoVenta;
  usuarioId: number;
  usuarioNombre: string;
  estanciaId: number | null;
  huespedId: number | null;
  huespedNombre: string | null;
  detalles: DetalleVentaResponse[];
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface CreateDetalleVentaRequest {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  descuentoUnitario?: number; // 0 si no se envía
}

export interface CreateVentaRequest {
  codigoVenta: string; // ^[A-Z0-9\-]+$
  tipoVenta: TipoVenta;
  fechaVenta: string; // ISO LocalDateTime, no futura
  usuarioId: number;
  estanciaId?: number;
  huespedId?: number;
  detalles: CreateDetalleVentaRequest[]; // mínimo 1
}

export interface UpdateVentaRequest {
  tipoVenta?: TipoVenta;
  fechaVenta?: string;
  estanciaId?: number;
  huespedId?: number;
}

export interface CambiarEstadoVentaRequest {
  nuevoEstado: EstadoVenta;
  motivo?: string; // no se persiste
}

export interface VentaFilterRequest {
  codigoVenta?: string;
  estado?: EstadoVenta;
  tipoVenta?: TipoVenta;
  usuarioId?: number;
  estanciaId?: number;
  huespedId?: number;
  fechaVentaDesde?: string; // fecha sola YYYY-MM-DD
  fechaVentaHasta?: string; // fecha sola YYYY-MM-DD (día completo, inclusivo)
  montoTotalMin?: number;
  montoTotalMax?: number;
  page?: number;
  size?: number;
  sort?: string;
}
