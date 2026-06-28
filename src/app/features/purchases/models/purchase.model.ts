export type EstadoCompra = 'PENDIENTE' | 'RECIBIDA' | 'ANULADA';

/** Línea de detalle tal como la devuelve el backend (`DetalleCompraResponse`). */
export interface DetalleCompra {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

/** Compra tal como la devuelve el backend (`CompraResponse`). Fechas en ISO string. */
export interface Compra {
  compraId: number;
  proveedorId: number;
  proveedorRazonSocial: string;
  fechaCompra: string; // 'YYYY-MM-DD'
  numeroFactura: string | null;
  subtotal: number;
  impuesto: number;
  montoTotal: number;
  estado: EstadoCompra;
  detalles: DetalleCompra[];
  fechaCreacion: string; // 'YYYY-MM-DDTHH:mm:ss'
  fechaModificacion: string;
}

/** Línea que se envía al crear (`CreateCompraRequest.detalles[]`). */
export interface DetalleCompraPayload {
  productoId: number;
  cantidad: number;
  costoUnitario: number;
}

/** Body de `POST /api/v1/compras` (`CreateCompraRequest`). */
export interface CompraCreatePayload {
  proveedorId: number;
  fechaCompra: string;
  numeroFactura: string | null;
  impuesto: number;
  detalles: DetalleCompraPayload[];
}

/** Body de `PUT /api/v1/compras/{id}` (`UpdateCompraRequest`): parcial, sin detalles. */
export type CompraUpdatePayload = Partial<
  Pick<CompraCreatePayload, 'proveedorId' | 'fechaCompra' | 'numeroFactura' | 'impuesto'>
>;

/** Body de `PATCH /api/v1/compras/{id}/estado` (`CambiarEstadoCompraRequest`). */
export interface CambiarEstadoPayload {
  nuevoEstado: EstadoCompra;
  motivo?: string;
}

export interface CompraFilters {
  search: string;
  estado: EstadoCompra | '';
}

/** Query params de `GET /api/v1/compras` (filtros + paginación server-side). */
export interface CompraFilterRequest {
  search?: string;
  estado?: EstadoCompra;
  proveedorId?: number;
  fechaCompraDesde?: string;
  fechaCompraHasta?: string;
  page?: number;
  size?: number;
  sort?: string;
}

/** Respuesta de `GET /api/v1/compras/stats`. */
export interface CompraStatsResponse {
  total: number;
  pendientes: number;
  recibidas: number;
  anuladas: number;
  montoTotalPeriodo: number;
}

export const DEFAULT_COMPRA_FILTERS: CompraFilters = {
  search: '',
  estado: '',
};

export const ESTADO_COMPRA_CONFIG: Record<
  EstadoCompra,
  { label: string; badgeTone: 'warning' | 'success' | 'danger' }
> = {
  PENDIENTE: { label: 'Pendiente', badgeTone: 'warning' },
  RECIBIDA: { label: 'Recibida', badgeTone: 'success' },
  ANULADA: { label: 'Anulada', badgeTone: 'danger' },
};

export interface CompraStats {
  total: number;
  pendientes: number;
  recibidas: number;
  anuladas: number;
  montoTotalMes: number;
}
