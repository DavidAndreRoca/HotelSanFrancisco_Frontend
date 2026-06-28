import { Injectable, inject, signal } from '@angular/core';
import { ApiClient } from '../../../core/http/http-client.service';
import { CategoriaProducto } from '../models/product.model';

const BASE = '/api/v1/categorias-producto';

@Injectable({ providedIn: 'root' })
export class CategoriaProductoService {
  private readonly api = inject(ApiClient);

  private readonly _items = signal<CategoriaProducto[]>([]);
  readonly items = this._items.asReadonly();

  /** Carga las categorías activas (lista, no paginada). */
  load(): void {
    this.api.get<CategoriaProducto[]>(`${BASE}/estado/ACTIVO`).subscribe({
      next: (res) => this._items.set(res ?? []),
      error: () => this._items.set([]),
    });
  }
}
