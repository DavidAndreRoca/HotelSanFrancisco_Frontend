import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, of, tap } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import {
  Producto,
  ProductoCreatePayload,
  ProductoUpdatePayload,
  ProductoStats,
} from '../models/product.model';

const BASE = '/api/v1/productos';

// ── Datos mock de respaldo (se usan solo si el backend no responde) ─────────
const MOCK_PRODUCTOS: Producto[] = [
  {
    productoId: 1,
    nombre: 'Agua mineral 500ml',
    sku: 'BEB-0001',
    categoria: 'BEBIDAS',
    descripcion: 'Botella de agua mineral sin gas para minibar',
    unidadMedida: 'unidad',
    precioVenta: 8,
    costoUnitario: 2.5,
    stockActual: 86,
    stockMinimo: 30,
    proveedorPrincipal: 'Distribuidora San Martín',
    estado: 'ACTIVO',
    actualizadoEn: new Date(2026, 5, 12),
  },
  {
    productoId: 2,
    nombre: 'Shampoo amenity 30ml',
    sku: 'AME-0010',
    categoria: 'AMENITIES',
    descripcion: 'Shampoo individual para huéspedes',
    unidadMedida: 'unidad',
    precioVenta: 0,
    costoUnitario: 0.85,
    stockActual: 18,
    stockMinimo: 50,
    proveedorPrincipal: 'Cosméticos del Sur SAC',
    estado: 'ACTIVO',
    actualizadoEn: new Date(2026, 5, 14),
  },
  {
    productoId: 3,
    nombre: 'Toalla de cuerpo blanca',
    sku: 'LEN-0003',
    categoria: 'LENCERIA',
    descripcion: 'Toalla 100% algodón 70x140cm',
    unidadMedida: 'unidad',
    precioVenta: 0,
    costoUnitario: 22,
    stockActual: 140,
    stockMinimo: 40,
    proveedorPrincipal: 'Textiles Andinos',
    estado: 'ACTIVO',
    actualizadoEn: new Date(2026, 4, 28),
  },
  {
    productoId: 4,
    nombre: 'Detergente industrial 5L',
    sku: 'LIM-0007',
    categoria: 'LIMPIEZA',
    descripcion: 'Detergente concentrado para lavandería',
    unidadMedida: 'galón',
    precioVenta: 0,
    costoUnitario: 45,
    stockActual: 6,
    stockMinimo: 10,
    proveedorPrincipal: 'Quimicorp Perú',
    estado: 'ACTIVO',
    actualizadoEn: new Date(2026, 5, 18),
  },
  {
    productoId: 5,
    nombre: 'Snack mix frutos secos',
    sku: 'MIN-0021',
    categoria: 'MINIBAR',
    descripcion: 'Bolsa individual de frutos secos para minibar',
    unidadMedida: 'unidad',
    precioVenta: 15,
    costoUnitario: 6.2,
    stockActual: 42,
    stockMinimo: 20,
    proveedorPrincipal: 'Distribuidora San Martín',
    estado: 'ACTIVO',
    actualizadoEn: new Date(2026, 5, 10),
  },
  {
    productoId: 6,
    nombre: 'Vino tinto reserva 750ml',
    sku: 'BEB-0014',
    categoria: 'BEBIDAS',
    descripcion: 'Vino tinto reserva para minibar y restaurante',
    unidadMedida: 'botella',
    precioVenta: 65,
    costoUnitario: 28,
    stockActual: 24,
    stockMinimo: 12,
    proveedorPrincipal: 'Bodega Viña Alta',
    estado: 'ACTIVO',
    actualizadoEn: new Date(2026, 5, 5),
  },
  {
    productoId: 7,
    nombre: 'Bombilla LED 9W',
    sku: 'MAN-0005',
    categoria: 'MANTENIMIENTO',
    descripcion: 'Bombilla LED luz cálida para habitaciones',
    unidadMedida: 'unidad',
    precioVenta: 0,
    costoUnitario: 9.5,
    stockActual: 3,
    stockMinimo: 15,
    proveedorPrincipal: 'Electro Repuestos SAC',
    estado: 'ACTIVO',
    actualizadoEn: new Date(2026, 5, 19),
  },
  {
    productoId: 8,
    nombre: 'Café gourmet en cápsulas',
    sku: 'ALI-0009',
    categoria: 'ALIMENTOS',
    descripcion: 'Caja de 10 cápsulas de café para habitaciones',
    unidadMedida: 'caja',
    precioVenta: 0,
    costoUnitario: 18,
    stockActual: 35,
    stockMinimo: 15,
    proveedorPrincipal: 'Café del Valle',
    estado: 'INACTIVO',
    actualizadoEn: new Date(2026, 3, 22),
  },
];

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
      inactivos: all.filter((p) => p.estado === 'INACTIVO').length,
      bajoStock: all.filter((p) => p.stockActual <= p.stockMinimo).length,
      valorInventario: all.reduce((acc, p) => acc + p.stockActual * p.costoUnitario, 0),
    };
  });

  load(): void {
    this._loading.set(true);
    this._lastError.set(null);
    this.api
      .get<Producto[]>(BASE)
      .pipe(
        catchError(() => {
          // Backend no disponible todavía: usamos datos mock para no bloquear la UI.
          return of(MOCK_PRODUCTOS);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe((data) => this._items.set(data));
  }

  findById(id: number): Producto | undefined {
    return this._items().find((p) => p.productoId === id);
  }

  create(payload: ProductoCreatePayload): Observable<Producto> {
    return this.api.post<Producto, ProductoCreatePayload>(BASE, payload).pipe(
      tap((created) => this._items.update((arr) => [created, ...arr])),
      catchError(() => {
        // Fallback local cuando no hay backend disponible.
        const fallback: Producto = {
          ...payload,
          productoId: Math.max(0, ...this._items().map((p) => p.productoId)) + 1,
          actualizadoEn: new Date(),
        };
        this._items.update((arr) => [fallback, ...arr]);
        return of(fallback);
      }),
    );
  }

  update(id: number, payload: ProductoUpdatePayload): Observable<Producto> {
    return this.api.put<Producto, ProductoUpdatePayload>(`${BASE}/${id}`, payload).pipe(
      tap((updated) =>
        this._items.update((arr) => arr.map((p) => (p.productoId === id ? updated : p))),
      ),
      catchError(() => {
        let result: Producto | undefined;
        this._items.update((arr) =>
          arr.map((p) => {
            if (p.productoId !== id) return p;
            result = { ...p, ...payload, actualizadoEn: new Date() };
            return result;
          }),
        );
        return of(result as Producto);
      }),
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${BASE}/${id}`).pipe(
      tap(() => this._items.update((arr) => arr.filter((p) => p.productoId !== id))),
      catchError(() => {
        this._items.update((arr) => arr.filter((p) => p.productoId !== id));
        return of(void 0);
      }),
    );
  }
}
