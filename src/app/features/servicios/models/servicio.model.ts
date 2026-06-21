// features/servicios/models/servicio.model.ts
// Tipos espejo del backend — Tipos de servicio (catálogo) y Servicios (consumos).

export type EstadoActivo = 'ACTIVO' | 'INACTIVO';

// ── Tipo de servicio (catálogo) ───────────────────────────────────────────────

export interface TipoServicioResponse {
  tipoServicioId: number;
  nombre: string;
  costoBase: number;
  descripcion: string | null;
  estado: EstadoActivo;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface CreateTipoServicioRequest {
  nombre: string;
  costoBase: number;
  descripcion?: string;
  estado: EstadoActivo;
}

export type UpdateTipoServicioRequest = Partial<CreateTipoServicioRequest>;

export interface TipoServicioFilterRequest {
  nombre?: string;
  estado?: EstadoActivo;
  page?: number;
  size?: number;
  sort?: string;
}

// ── Servicio (consumo) ────────────────────────────────────────────────────────

export interface ServicioResponse {
  servicioId: number;
  tipoServicioId: number;
  tipoServicioNombre: string;
  estanciaId: number;
  cantidad: number;
  precioAplicado: number;
  subtotal: number; // calculado por backend
  observaciones: string | null;
  fechaConsumo: string; // ISO LocalDateTime
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface CreateServicioRequest {
  tipoServicioId: number;
  estanciaId: number;
  cantidad: number;
  precioAplicado?: number; // si null, backend usa costoBase del tipo
  observaciones?: string;
  fechaConsumo?: string; // si null, backend usa now()
}

export interface UpdateServicioRequest {
  tipoServicioId?: number;
  estanciaId?: number;
  cantidad?: number;
  precioAplicado?: number;
  observaciones?: string;
  fechaConsumo?: string;
}

export interface ServicioFilterRequest {
  tipoServicioId?: number;
  estanciaId?: number;
  fechaConsumoDesde?: string;
  fechaConsumoHasta?: string;
  subtotalMin?: number;
  subtotalMax?: number;
  page?: number;
  size?: number;
  sort?: string;
}
