import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../http/http-client.service';
import { PageResponse } from '../api/api-response.interface';

/** Subconjunto de ProductoResponse usado en autocompletes de POS. */
export interface ProductoResumen {
  productoId: number;
  nombre: string;
  precioVenta: number;
  stockActual: number;
  estado: string;
}

@Injectable({ providedIn: 'root' })
export class ProductoLookupService {
  private readonly api = inject(ApiClient);

  /** Productos activos por nombre (GET /api/v1/productos?nombre=&estado=ACTIVO). */
  /** Producto puntual (GET /api/v1/productos/{id}); usado para refrescar precios. */
  obtenerPorId(id: number): Observable<ProductoResumen> {
    return this.api.get<ProductoResumen>(`/api/v1/productos/${id}`);
  }

  buscarActivos(nombre: string): Observable<ProductoResumen[]> {
    return this.api
      .get<PageResponse<ProductoResumen>>('/api/v1/productos', {
        params: {
          nombre: nombre.trim() || undefined,
          estado: 'ACTIVO',
          size: 10,
          sort: 'nombre,asc',
        },
      })
      .pipe(map((page) => page.content));
  }
}
