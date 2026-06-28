export type EstadoActivo = 'ACTIVO' | 'INACTIVO';

/** Categoría de producto (`CategoriaProductoResponse`). */
export interface CategoriaProducto {
  categoriaProductoId: number;
  nombre: string;
  descripcion: string | null;
  estado: EstadoActivo;
}

/** Producto tal como lo devuelve el backend (`ProductoResponse`). Fechas en ISO string. */
export interface Producto {
  productoId: number;
  nombre: string;
  descripcion: string | null;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  estado: EstadoActivo;
  categoriaProductoId: number;
  categoriaProductoNombre: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

/** Body de `POST /api/v1/productos` (`CreateProductoRequest`). */
export interface ProductoCreatePayload {
  nombre: string;
  descripcion: string | null;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  estado: EstadoActivo;
  categoriaProductoId: number;
}

/**
 * Body de `PUT /api/v1/productos/{id}` (`UpdateProductoRequest`).
 * El stock NO se edita aquí (se ajusta con `PATCH /productos/{id}/stock`).
 */
export type ProductoUpdatePayload = Partial<Omit<ProductoCreatePayload, 'stockActual'>>;

export interface ProductoFilters {
  search: string;
  categoriaProductoId: number | '';
  estado: EstadoActivo | '';
  soloBajoStock: boolean;
}

export const DEFAULT_PRODUCTO_FILTERS: ProductoFilters = {
  search: '',
  categoriaProductoId: '',
  estado: '',
  soloBajoStock: false,
};

export interface ProductoStats {
  total: number;
  activos: number;
  bajoStock: number;
  /** Valor del stock a precio de venta (el backend no guarda costo). */
  valorStockVenta: number;
}
