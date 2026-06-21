// features/roles/models/rol.model.ts
// Tipos espejo del backend — Roles y Permisos (sección 9 del doc).

export type EstadoActivo = 'ACTIVO' | 'INACTIVO';

export interface PermisoResponse {
  permisoId: number;
  nombre: string;
  codigo: string;
}

export interface RolResponse {
  rolId: number;
  nombre: string;
  descripcion: string | null;
  estado: EstadoActivo;
  permisos: PermisoResponse[];
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface CreateRolRequest {
  nombre: string;
  descripcion?: string;
  estado: EstadoActivo;
  permisoIds?: number[];
}

export interface UpdateRolRequest {
  nombre?: string;
  descripcion?: string;
  estado?: EstadoActivo;
  permisoIds?: number[]; // si viene, REEMPLAZA toda la lista de permisos
}

/** POST /roles/{id}/permisos — aditivo (idempotente, no reemplaza). */
export interface AsignarPermisosRequest {
  permisoIds: number[];
}

export interface RolFilterRequest {
  nombre?: string;
  estado?: EstadoActivo;
  page?: number;
  size?: number;
  sort?: string;
}
