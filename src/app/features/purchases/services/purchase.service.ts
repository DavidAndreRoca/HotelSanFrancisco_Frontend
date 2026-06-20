import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, of, tap } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import {
  Compra,
  CompraCreatePayload,
  CompraStats,
  CompraUpdatePayload,
  totalCompra,
} from '../models/purchase.model';

const BASE = '/api/v1/compras';

// ── Datos mock de respaldo (se usan solo si el backend no responde) ─────────
const MOCK_COMPRAS: Compra[] = [
  {
    compraId: 1,
    numeroOrden: 'OC-2026-001',
    proveedor: 'Distribuidora San Martín',
    fechaOrden: new Date(2026, 5, 1),
    fechaRecepcion: new Date(2026, 5, 4),
    estado: 'RECIBIDA',
    detalle: [
      { productoId: 1, productoNombre: 'Agua mineral 500ml', cantidad: 200, costoUnitario: 2.5 },
      { productoId: 5, productoNombre: 'Snack mix frutos secos', cantidad: 80, costoUnitario: 6.2 },
    ],
    notas: 'Pedido mensual de minibar.',
  },
  {
    compraId: 2,
    numeroOrden: 'OC-2026-002',
    proveedor: 'Cosméticos del Sur SAC',
    fechaOrden: new Date(2026, 5, 10),
    fechaRecepcion: null,
    estado: 'PENDIENTE',
    detalle: [
      { productoId: 2, productoNombre: 'Shampoo amenity 30ml', cantidad: 500, costoUnitario: 0.85 },
    ],
    notas: 'Urgente: stock por debajo del mínimo.',
  },
  {
    compraId: 3,
    numeroOrden: 'OC-2026-003',
    proveedor: 'Quimicorp Perú',
    fechaOrden: new Date(2026, 5, 15),
    fechaRecepcion: null,
    estado: 'PENDIENTE',
    detalle: [
      { productoId: 4, productoNombre: 'Detergente industrial 5L', cantidad: 40, costoUnitario: 45 },
    ],
    notas: null,
  },
  {
    compraId: 4,
    numeroOrden: 'OC-2026-004',
    proveedor: 'Textiles Andinos',
    fechaOrden: new Date(2026, 4, 20),
    fechaRecepcion: new Date(2026, 4, 25),
    estado: 'RECIBIDA',
    detalle: [
      { productoId: 3, productoNombre: 'Toalla de cuerpo blanca', cantidad: 100, costoUnitario: 22 },
    ],
    notas: 'Reposición de lencería para temporada alta.',
  },
  {
    compraId: 5,
    numeroOrden: 'OC-2026-005',
    proveedor: 'Bodega Viña Alta',
    fechaOrden: new Date(2026, 5, 8),
    fechaRecepcion: null,
    estado: 'CANCELADA',
    detalle: [
      { productoId: 6, productoNombre: 'Vino tinto reserva 750ml', cantidad: 24, costoUnitario: 28 },
    ],
    notas: 'Cancelada por cambio de proveedor.',
  },
];

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
      canceladas: all.filter((c) => c.estado === 'CANCELADA').length,
      montoTotalMes: all
        .filter(
          (c) =>
            c.estado !== 'CANCELADA' &&
            c.fechaOrden.getMonth() === now.getMonth() &&
            c.fechaOrden.getFullYear() === now.getFullYear(),
        )
        .reduce((acc, c) => acc + totalCompra(c), 0),
    };
  });

  load(): void {
    this._loading.set(true);
    this._lastError.set(null);
    this.api
      .get<Compra[]>(BASE)
      .pipe(
        catchError(() => of(MOCK_COMPRAS)),
        finalize(() => this._loading.set(false)),
      )
      .subscribe((data) => this._items.set(data));
  }

  findById(id: number): Compra | undefined {
    return this._items().find((c) => c.compraId === id);
  }

  create(payload: CompraCreatePayload): Observable<Compra> {
    return this.api.post<Compra, CompraCreatePayload>(BASE, payload).pipe(
      tap((created) => this._items.update((arr) => [created, ...arr])),
      catchError(() => {
        const fallback: Compra = {
          compraId: Math.max(0, ...this._items().map((c) => c.compraId)) + 1,
          numeroOrden: `OC-2026-${String(this._items().length + 1).padStart(3, '0')}`,
          proveedor: payload.proveedor,
          fechaOrden: new Date(payload.fechaOrden),
          fechaRecepcion: payload.estado === 'RECIBIDA' ? new Date() : null,
          estado: payload.estado,
          detalle: payload.detalle,
          notas: payload.notas,
        };
        this._items.update((arr) => [fallback, ...arr]);
        return of(fallback);
      }),
    );
  }

  update(id: number, payload: CompraUpdatePayload): Observable<Compra> {
    return this.api.put<Compra, CompraUpdatePayload>(`${BASE}/${id}`, payload).pipe(
      tap((updated) =>
        this._items.update((arr) => arr.map((c) => (c.compraId === id ? updated : c))),
      ),
      catchError(() => {
        let result: Compra | undefined;
        this._items.update((arr) =>
          arr.map((c) => {
            if (c.compraId !== id) return c;
            result = {
              ...c,
              ...payload,
              fechaOrden: payload.fechaOrden ? new Date(payload.fechaOrden) : c.fechaOrden,
              fechaRecepcion:
                payload.estado === 'RECIBIDA' ? (c.fechaRecepcion ?? new Date()) : c.fechaRecepcion,
            };
            return result;
          }),
        );
        return of(result as Compra);
      }),
    );
  }

  cambiarEstado(id: number, estado: 'RECIBIDA' | 'CANCELADA'): Observable<Compra> {
    return this.update(id, { estado });
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${BASE}/${id}`).pipe(
      tap(() => this._items.update((arr) => arr.filter((c) => c.compraId !== id))),
      catchError(() => {
        this._items.update((arr) => arr.filter((c) => c.compraId !== id));
        return of(void 0);
      }),
    );
  }
}
