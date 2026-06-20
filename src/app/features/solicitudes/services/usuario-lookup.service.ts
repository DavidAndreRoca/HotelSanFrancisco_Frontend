import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';

/**
 * Subconjunto de `UsuarioResponse` que usa el autocomplete de responsable.
 * El backend devuelve el DTO completo (21 campos); aquí solo declaramos los
 * que el frontend consume.
 */
export interface UsuarioResumen {
  usuarioId: number;
  nombreCompleto: string;
  correo: string;
  rolNombre: string;
  estado: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioLookupService {
  private readonly api = inject(ApiClient);

  /**
   * Usuarios activos (empleados, no clientes) para asignar como responsable.
   * GET /api/v1/usuarios?estado=ACTIVO&esEmpleado=true&nombre=<texto>&size=10
   */
  buscarResponsables(nombre: string): Observable<UsuarioResumen[]> {
    return this.api
      .get<PageResponse<UsuarioResumen>>('/api/v1/usuarios', {
        params: {
          estado: 'ACTIVO',
          esEmpleado: true,
          nombre: nombre.trim() || undefined,
          size: 10,
          sort: 'apellidoPaterno,asc',
        },
      })
      .pipe(map((page) => page.content));
  }
}
