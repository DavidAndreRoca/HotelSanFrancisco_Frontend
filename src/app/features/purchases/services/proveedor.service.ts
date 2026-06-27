import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import { Proveedor } from '../models/proveedor.model';

const BASE = '/api/v1/proveedores';

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private readonly api = inject(ApiClient);

  private readonly _items = signal<Proveedor[]>([]);
  private readonly _loading = signal(false);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();

  load(): void {
    this._loading.set(true);
    this.api
      .get<PageResponse<Proveedor>>(BASE, {
        params: { page: 0, size: 100, sort: 'razonSocial,asc' },
      })
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (res) => this._items.set(res.content),
        error: () => this._items.set([]),
      });
  }

  findById(id: number): Proveedor | undefined {
    return this._items().find((p) => p.proveedorId === id);
  }
}
