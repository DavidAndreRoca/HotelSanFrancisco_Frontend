import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../http/http-client.service';
import { PageResponse } from '../api/api-response.interface';

/**
 * Subconjunto de `UsuarioResponse` que consumen los autocompletes de empleados.
 * El backend devuelve el DTO completo; aquí solo declaramos lo que se usa.
 */
export interface UsuarioResumen {
  usuarioId: number;
  nombreCompleto: string;
  correo: string;
  rolNombre: string;
  estado: string;
}

/**
 * Lookup de usuarios reutilizable por los módulos que necesitan seleccionar un
 * empleado (Solicitudes, Horarios, Asistencia, Nómina).
 */
@Injectable({ providedIn: 'root' })
export class UsuarioLookupService {
  private readonly api = inject(ApiClient);

  /**
   * Empleados activos (no clientes) para selectores/autocompletes.
   * GET /api/v1/usuarios?estado=ACTIVO&esEmpleado=true&nombre=<texto>&size=10
   */
  buscarEmpleadosActivos(nombre: string): Observable<UsuarioResumen[]> {
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
