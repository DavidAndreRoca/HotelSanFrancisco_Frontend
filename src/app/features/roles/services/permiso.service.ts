import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import { PermisoResponse } from '../models/rol.model';

@Injectable({ providedIn: 'root' })
export class PermisoService {
  private readonly api = inject(ApiClient);

  /** Catálogo completo de permisos del sistema (GET /api/v1/permisos). */
  listarTodos(): Observable<PermisoResponse[]> {
    return this.api.get<PermisoResponse[]>('/api/v1/permisos');
  }
}
