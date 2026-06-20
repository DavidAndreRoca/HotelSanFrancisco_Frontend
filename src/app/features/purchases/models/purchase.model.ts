export type EstadoCompra = 'PENDIENTE' | 'RECIBIDA' | 'CANCELADA';

export interface DetalleCompra {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  costoUnitario: number;
}

export interface Compra {
  compraId: number;
  numeroOrden: string;
  proveedor: string;
  fechaOrden: Date;
  fechaRecepcion: Date | null;
  estado: EstadoCompra;
  detalle: DetalleCompra[];
  notas: string | null;
}

export interface CompraCreatePayload {
  proveedor: string;
  fechaOrden: string;
  estado: EstadoCompra;
  detalle: DetalleCompra[];
  notas: string | null;
}

export type CompraUpdatePayload = Partial<CompraCreatePayload>;

export interface CompraFilters {
  search: string;
  estado: EstadoCompra | '';
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
  CANCELADA: { label: 'Cancelada', badgeTone: 'danger' },
};

export interface CompraStats {
  total: number;
  pendientes: number;
  recibidas: number;
  canceladas: number;
  montoTotalMes: number;
}

export function totalCompra(compra: Pick<Compra, 'detalle'>): number {
  return compra.detalle.reduce((acc, d) => acc + d.cantidad * d.costoUnitario, 0);
}
