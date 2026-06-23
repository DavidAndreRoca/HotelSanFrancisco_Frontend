import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import { CrearPedidoServicio, PedidoServicio } from '../models/servicio.model';

/**
 * Pedidos de servicio del propio cliente (rol CLIENTE).
 * La estadía se infiere del JWT en el backend; no se envía reserva ni estancia.
 * Permisos: `mis-servicios:read` (listar) y `mis-servicios:create` (crear/cancelar).
 */
@Injectable({ providedIn: 'root' })
export class MisServiciosService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/mis-servicios';

  /** Mis pedidos, del más reciente al más antiguo (array simple). */
  listar(): Observable<PedidoServicio[]> {
    return this.api.get<PedidoServicio[]>(this.base);
  }

  /** Crea un pedido. Devuelve el pedido en estado PENDIENTE. */
  crear(payload: CrearPedidoServicio): Observable<PedidoServicio> {
    return this.api.post<PedidoServicio, CrearPedidoServicio>(this.base, payload);
  }

  /** Cancela un pedido propio (solo si está PENDIENTE). */
  cancelar(id: number): Observable<PedidoServicio> {
    return this.api.patch<PedidoServicio, null>(`${this.base}/${id}/cancelar`, null);
  }
}
