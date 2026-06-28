import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import {
  Producto,
  ProductoCreatePayload,
  ProductoStats,
  ProductoUpdatePayload,
} from '../models/product.model';

const BASE = '/api/v1/productos';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiClient);

  private readonly _items = signal<Producto[]>([]);
  private readonly _loading = signal(false);
  private readonly _lastError = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly lastError = this._lastError.asReadonly();

  readonly stats = computed<ProductoStats>(() => {
    const all = this._items();
    return {
      total: all.length,
      activos: all.filter((p) => p.estado === 'ACTIVO').length,
      bajoStock: all.filter((p) => p.stockActual <= p.stockMinimo).length,
      valorStockVenta: all.reduce((acc, p) => acc + p.stockActual * p.precioVenta, 0),
    };
  });

  /**
   * Carga el catálogo. Productos no expone endpoint de stats, así que se trae
   * una página amplia (size=100) y las tarjetas/filtros se calculan en memoria.
   */
  load(): void {
    this._loading.set(true);
    this._lastError.set(null);
    this.api
      .get<PageResponse<Producto>>(BASE, { params: { page: 0, size: 100, sort: 'nombre,asc' } })
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (res) => this._items.set(res.content),
        error: (err: { friendlyMessage?: string }) => {
          this._items.set([]);
          this._lastError.set(err.friendlyMessage ?? 'No se pudieron cargar los productos.');
        },
      });
  }

  findById(id: number): Producto | undefined {
    return this._items().find((p) => p.productoId === id);
  }

  create(payload: ProductoCreatePayload): Observable<Producto> {
    return this.api
      .post<Producto, ProductoCreatePayload>(BASE, payload)
      .pipe(tap((created) => this._items.update((arr) => [created, ...arr])));
  }

  update(id: number, payload: ProductoUpdatePayload): Observable<Producto> {
    return this.api
      .put<Producto, ProductoUpdatePayload>(`${BASE}/${id}`, payload)
      .pipe(tap((updated) => this._items.update((arr) => arr.map((p) => (p.productoId === id ? updated : p)))));
  }

  delete(id: number): Observable<void> {
    return this.api
      .delete<void>(`${BASE}/${id}`)
      .pipe(tap(() => this._items.update((arr) => arr.filter((p) => p.productoId !== id))));
  }
}
