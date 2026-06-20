import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, QueryParams } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import { AuditoriaFilterRequest, RegistroAuditoriaResponse } from '../models/auditoria.model';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/auditoria';

  /**
   * Listar registros de auditoría paginados con filtros (GET /api/v1/auditoria).
   * Solo lectura. ApiClient ya desempaqueta ApiResponse.data, por eso devuelve
   * PageResponse directo. Requiere permiso `auditoria:read` (solo ADMIN).
   */
  listar(filtros: AuditoriaFilterRequest = {}): Observable<PageResponse<RegistroAuditoriaResponse>> {
    return this.api.get<PageResponse<RegistroAuditoriaResponse>>(this.base, {
      params: filtros as QueryParams,
    });
  }
}
