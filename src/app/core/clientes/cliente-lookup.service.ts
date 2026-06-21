import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../http/http-client.service';
import { PageResponse } from '../api/api-response.interface';

/** Subconjunto de ClienteResponse usado en autocompletes. PK = huespedId. */
export interface ClienteResumen {
  huespedId: number;
  nombreCompleto: string;
  numeroDocumento: string;
  correo: string | null;
  estado: string;
}

@Injectable({ providedIn: 'root' })
export class ClienteLookupService {
  private readonly api = inject(ApiClient);

  /** Clientes/huéspedes por nombre (GET /api/v1/clientes?nombre=). */
  buscarPorNombre(nombre: string): Observable<ClienteResumen[]> {
    return this.api
      .get<PageResponse<ClienteResumen>>('/api/v1/clientes', {
        params: { nombre: nombre.trim() || undefined, size: 10, sort: 'apellidoPaterno,asc' },
      })
      .pipe(map((page) => page.content));
  }
}
