import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, QueryParams } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import { EstadoPedido, PedidoServicio } from '../models/servicio.model';

export interface PedidoServicioFilterRequest {
  estado?: EstadoPedido;
  page?: number;
  size?: number;
}

/**
 * Bandeja de pedidos de servicio para el personal (RECEPCION/ADMIN).
 * Permisos: `servicio:read` (listar) y `servicio:create` (aprobar/rechazar).
 */
@Injectable({ providedIn: 'root' })
export class PedidosServicioService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/pedidos-servicio';

  /** Listado paginado; `estado` opcional, más recientes primero. */
  listar(filtros: PedidoServicioFilterRequest = {}): Observable<PageResponse<PedidoServicio>> {
    return this.api.get<PageResponse<PedidoServicio>>(this.base, {
      params: filtros as QueryParams,
    });
  }

  /** Aprueba un pedido PENDIENTE y genera el consumo facturable. */
  aprobar(id: number): Observable<PedidoServicio> {
    return this.api.patch<PedidoServicio, null>(`${this.base}/${id}/aprobar`, null);
  }

  /** Rechaza un pedido PENDIENTE; `motivo` obligatorio (máx 2000). */
  rechazar(id: number, motivo: string): Observable<PedidoServicio> {
    return this.api.patch<PedidoServicio, { motivo: string }>(`${this.base}/${id}/rechazar`, {
      motivo,
    });
  }
}
