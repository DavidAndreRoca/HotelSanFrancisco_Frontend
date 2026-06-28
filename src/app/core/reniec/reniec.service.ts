import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../http/http-client.service';

/** Respuesta de `GET /auth/reniec/dni/{dni}` (`ReniecConsultaResponse`). */
export interface ReniecPersona {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
}

@Injectable({ providedIn: 'root' })
export class ReniecService {
  private readonly api = inject(ApiClient);

  /**
   * Consulta los datos de una persona por DNI (8 dígitos) en RENIEC.
   * Endpoint público. Errores esperados llegan como 422 (DNI no hallado,
   * formato inválido o RENIEC no disponible) con `message` legible.
   */
  consultarDni(dni: string): Observable<ReniecPersona> {
    return this.api.get<ReniecPersona>(`/auth/reniec/dni/${dni}`);
  }
}
