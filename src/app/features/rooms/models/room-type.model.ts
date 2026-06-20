export type EstadoActivo = 'ACTIVO' | 'INACTIVO';

export interface RoomType {
  tipoHabitacionId: number;
  nombre: string;
  precioBase: number;
  descripcion: string | null;
  estado: EstadoActivo;
  capacidadMaxima: number;
}

export interface RoomTypeCreatePayload {
  nombre: string;
  precioBase: number;
  descripcion: string | null;
  estado: EstadoActivo;
  capacidadMaxima: number;
}

export type RoomTypeUpdatePayload = Partial<RoomTypeCreatePayload>;

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface RoomTypeFilters {
  search: string;
  estado: EstadoActivo | '';
  page: number;
  size: number;
  sort: string;
}

export const DEFAULT_ROOM_TYPE_FILTERS: RoomTypeFilters = {
  search: '',
  estado: '',
  page: 0,
  size: 100,
  sort: 'nombre,asc',
};
