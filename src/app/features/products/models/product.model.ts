export type EstadoActivo = 'ACTIVO' | 'INACTIVO';

export type CategoriaProducto =
  | 'MINIBAR'
  | 'AMENITIES'
  | 'LIMPIEZA'
  | 'ALIMENTOS'
  | 'BEBIDAS'
  | 'LENCERIA'
  | 'MANTENIMIENTO'
  | 'OTROS';

export interface Producto {
  productoId: number;
  nombre: string;
  sku: string;
  categoria: CategoriaProducto;
  descripcion: string | null;
  unidadMedida: string;
  precioVenta: number;
  costoUnitario: number;
  stockActual: number;
  stockMinimo: number;
  proveedorPrincipal: string | null;
  estado: EstadoActivo;
  actualizadoEn: Date;
}

export interface ProductoCreatePayload {
  nombre: string;
  sku: string;
  categoria: CategoriaProducto;
  descripcion: string | null;
  unidadMedida: string;
  precioVenta: number;
  costoUnitario: number;
  stockActual: number;
  stockMinimo: number;
  proveedorPrincipal: string | null;
  estado: EstadoActivo;
}

export type ProductoUpdatePayload = Partial<ProductoCreatePayload>;

export interface ProductoFilters {
  search: string;
  categoria: CategoriaProducto | '';
  estado: EstadoActivo | '';
  soloBajoStock: boolean;
}

export const DEFAULT_PRODUCTO_FILTERS: ProductoFilters = {
  search: '',
  categoria: '',
  estado: '',
  soloBajoStock: false,
};

export const CATEGORIA_PRODUCTO_CONFIG: Record<
  CategoriaProducto,
  { label: string; dotColor: string }
> = {
  MINIBAR: { label: 'Minibar', dotColor: 'bg-[var(--color-primary-500)]' },
  AMENITIES: { label: 'Amenities', dotColor: 'bg-[var(--color-info-500)]' },
  LIMPIEZA: { label: 'Limpieza', dotColor: 'bg-[var(--color-success-500)]' },
  ALIMENTOS: { label: 'Alimentos', dotColor: 'bg-[var(--color-warning-500)]' },
  BEBIDAS: { label: 'Bebidas', dotColor: 'bg-[var(--color-danger-500)]' },
  LENCERIA: { label: 'Lencería', dotColor: 'bg-[var(--color-secondary-500)]' },
  MANTENIMIENTO: { label: 'Mantenimiento', dotColor: 'bg-[var(--color-ink-muted)]' },
  OTROS: { label: 'Otros', dotColor: 'bg-[var(--color-ink-soft)]' },
};

export interface ProductoStats {
  total: number;
  activos: number;
  inactivos: number;
  bajoStock: number;
  valorInventario: number;
}
