// features/servicios/models/servicio.model.ts
// Tipos espejo del backend — Tipos de servicio (catálogo) y Servicios (consumos).

export type EstadoActivo = 'ACTIVO' | 'INACTIVO';

// ── Tipo de servicio (catálogo) ───────────────────────────────────────────────

export interface TipoServicioResponse {
  tipoServicioId: number;
  nombre: string;
  costoBase: number;
  descripcion: string | null;
  /** Tope máximo por pedido; null → se aplica el default global (50). */
  cantidadMaxima: number | null;
  estado: EstadoActivo;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface CreateTipoServicioRequest {
  nombre: string;
  costoBase: number;
  descripcion?: string;
  /** Tope máximo por pedido (1–99). Si se omite, el backend usa el default global. */
  cantidadMaxima?: number;
  estado: EstadoActivo;
}

export type UpdateTipoServicioRequest = Partial<CreateTipoServicioRequest>;

/**
 * Ítem del catálogo de servicios visible para el rol CLIENTE.
 * Lo expone GET /api/v1/servicios-catalogo (permiso `servicio-catalogo:read`),
 * que devuelve solo servicios ACTIVO.
 */
export interface ServicioCatalogoItem {
  tipoServicioId: number;
  nombre: string;
  descripcion: string | null;
  costoBase: number;
  /** Tope máximo por pedido; null → el front aplica el default global (50). */
  cantidadMaxima: number | null;
  estado: EstadoActivo;
}

export interface TipoServicioFilterRequest {
  nombre?: string;
  estado?: EstadoActivo;
  page?: number;
  size?: number;
  sort?: string;
}

// ── Pedido de servicio (CLIENTE: /api/v1/mis-servicios) ───────────────────────

export type EstadoPedido = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO';

export interface PedidoServicio {
  pedidoServicioId: number;
  tipoServicioId: number;
  tipoServicioNombre: string;
  costoBase: number; // precio unitario
  cantidad: number;
  subtotalEstimado: number; // cantidad * costoBase
  observaciones: string | null;
  estado: EstadoPedido;
  motivoRespuesta: string | null; // se llena al RECHAZAR
  estanciaId: number;
  codReserva: string;
  solicitanteNombre: string;
  servicioId: number | null; // se llena al APROBAR
  fechaSolicitud: string; // ISO datetime
  fechaRespuesta: string | null; // ISO datetime
}

export interface CrearPedidoServicio {
  tipoServicioId: number;
  cantidad: number; // entero >= 1; el backend valida el tope (por tipo o default global)
  observaciones?: string; // opcional, máx 2000
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
