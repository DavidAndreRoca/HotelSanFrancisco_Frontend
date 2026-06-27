import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import {
  CambiarEstadoPayload,
  Compra,
  CompraCreatePayload,
  CompraStats,
  CompraUpdatePayload,
  EstadoCompra,
} from '../models/purchase.model';

const BASE = '/api/v1/compras';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly api = inject(ApiClient);

  private readonly _items = signal<Compra[]>([]);
  private readonly _loading = signal(false);
  private readonly _lastError = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly lastError = this._lastError.asReadonly();

  readonly stats = computed<CompraStats>(() => {
    const all = this._items();
    const now = new Date();
    return {
      total: all.length,
      pendientes: all.filter((c) => c.estado === 'PENDIENTE').length,
      recibidas: all.filter((c) => c.estado === 'RECIBIDA').length,
      anuladas: all.filter((c) => c.estado === 'ANULADA').length,
      montoTotalMes: all
        .filter((c) => {
          if (c.estado === 'ANULADA') return false;
          const f = new Date(c.fechaCompra);
          return f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear();
        })
        .reduce((acc, c) => acc + (c.montoTotal ?? 0), 0),
    };
  });

  load(): void {
    this._loading.set(true);
    this._lastError.set(null);
    this.api
      .get<PageResponse<Compra>>(BASE, {
        params: { page: 0, size: 100, sort: 'fechaCompra,desc' },
      })
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (res) => this._items.set(res.content),
        error: (err: { friendlyMessage?: string }) => {
          this._items.set([]);
          this._lastError.set(err.friendlyMessage ?? 'No se pudieron cargar las compras.');
        },
      });
  }

  create(payload: CompraCreatePayload): Observable<Compra> {
    return this.api
      .post<Compra, CompraCreatePayload>(BASE, payload)
      .pipe(tap((created) => this._items.update((arr) => [created, ...arr])));
  }

  update(id: number, payload: CompraUpdatePayload): Observable<Compra> {
    return this.api
      .put<Compra, CompraUpdatePayload>(`${BASE}/${id}`, payload)
      .pipe(tap((updated) => this.replace(id, updated)));
  }

  cambiarEstado(id: number, nuevoEstado: EstadoCompra, motivo?: string): Observable<Compra> {
    return this.api
      .patch<Compra, CambiarEstadoPayload>(`${BASE}/${id}/estado`, { nuevoEstado, motivo })
      .pipe(tap((updated) => this.replace(id, updated)));
  }

  delete(id: number): Observable<void> {
    return this.api
      .delete<void>(`${BASE}/${id}`)
      .pipe(tap(() => this._items.update((arr) => arr.filter((c) => c.compraId !== id))));
  }

  private replace(id: number, updated: Compra): void {
    this._items.update((arr) => arr.map((c) => (c.compraId === id ? updated : c)));
  }
}
