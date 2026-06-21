import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, QueryParams } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import {
  AsignarPermisosRequest,
  CreateRolRequest,
  EstadoActivo,
  RolFilterRequest,
  RolResponse,
  UpdateRolRequest,
} from '../models/rol.model';

@Injectable({ providedIn: 'root' })
export class RolService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/roles';

  listar(filtros: RolFilterRequest = {}): Observable<PageResponse<RolResponse>> {
    return this.api.get<PageResponse<RolResponse>>(this.base, { params: filtros as QueryParams });
  }

  /** Lista completa sin paginar — para selects (GET /estado/{estado}). */
  listarPorEstado(estado: EstadoActivo): Observable<RolResponse[]> {
    return this.api.get<RolResponse[]>(`${this.base}/estado/${estado}`);
  }

  obtenerPorId(id: number): Observable<RolResponse> {
    return this.api.get<RolResponse>(`${this.base}/${id}`);
  }

  crear(payload: CreateRolRequest): Observable<RolResponse> {
    return this.api.post<RolResponse, CreateRolRequest>(this.base, payload);
  }

  /** PUT — si `permisoIds` viene, reemplaza toda la lista de permisos. */
  actualizar(id: number, payload: UpdateRolRequest): Observable<RolResponse> {
    return this.api.put<RolResponse, UpdateRolRequest>(`${this.base}/${id}`, payload);
  }

  /** POST /{id}/permisos — aditivo (idempotente). */
  asignarPermisos(id: number, payload: AsignarPermisosRequest): Observable<RolResponse> {
    return this.api.post<RolResponse, AsignarPermisosRequest>(`${this.base}/${id}/permisos`, payload);
  }

  /** DELETE /{id}/permisos/{permisoId} — quita un permiso. */
  removerPermiso(id: number, permisoId: number): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}/permisos/${permisoId}`);
  }

  /** Eliminación física del rol y sus detalles. */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }
}
