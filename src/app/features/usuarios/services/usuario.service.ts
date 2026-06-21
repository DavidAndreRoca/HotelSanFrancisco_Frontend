import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, QueryParams } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import {
  CambiarEstadoUsuarioRequest,
  CambiarRolUsuarioRequest,
  CreateUsuarioRequest,
  EstadoUsuario,
  UpdateUsuarioRequest,
  UsuarioFilterRequest,
  UsuarioResponse,
} from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/usuarios';

  listar(filtros: UsuarioFilterRequest = {}): Observable<PageResponse<UsuarioResponse>> {
    return this.api.get<PageResponse<UsuarioResponse>>(this.base, { params: filtros as QueryParams });
  }

  listarPorEstado(estado: EstadoUsuario): Observable<UsuarioResponse[]> {
    return this.api.get<UsuarioResponse[]>(`${this.base}/estado/${estado}`);
  }

  obtenerPorId(id: number): Observable<UsuarioResponse> {
    return this.api.get<UsuarioResponse>(`${this.base}/${id}`);
  }

  crear(payload: CreateUsuarioRequest): Observable<UsuarioResponse> {
    return this.api.post<UsuarioResponse, CreateUsuarioRequest>(this.base, payload);
  }

  actualizar(id: number, payload: UpdateUsuarioRequest): Observable<UsuarioResponse> {
    return this.api.put<UsuarioResponse, UpdateUsuarioRequest>(`${this.base}/${id}`, payload);
  }

  cambiarEstado(id: number, payload: CambiarEstadoUsuarioRequest): Observable<UsuarioResponse> {
    return this.api.patch<UsuarioResponse, CambiarEstadoUsuarioRequest>(
      `${this.base}/${id}/estado`,
      payload,
    );
  }

  cambiarRol(id: number, payload: CambiarRolUsuarioRequest): Observable<UsuarioResponse> {
    return this.api.patch<UsuarioResponse, CambiarRolUsuarioRequest>(
      `${this.base}/${id}/rol`,
      payload,
    );
  }

  /** Baja lógica → INACTIVO. */
  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }
}
