import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import { MiAsistenciaResponse } from '../models/mi-asistencia.model';

@Injectable({ providedIn: 'root' })
export class MiAsistenciaService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/mi-asistencia';

  /** Mis marcas, ordenadas por fecha desc. */
  listar(): Observable<MiAsistenciaResponse[]> {
    return this.api.get<MiAsistenciaResponse[]>(this.base);
  }

  /** Marca entrada del usuario del token. Sin body. */
  marcarEntrada(): Observable<MiAsistenciaResponse> {
    return this.api.post<MiAsistenciaResponse, unknown>(`${this.base}/marcar-entrada`, {});
  }

  /** Marca salida del usuario del token. El backend calcula las horas. Sin body. */
  marcarSalida(): Observable<MiAsistenciaResponse> {
    return this.api.post<MiAsistenciaResponse, unknown>(`${this.base}/marcar-salida`, {});
  }
}
