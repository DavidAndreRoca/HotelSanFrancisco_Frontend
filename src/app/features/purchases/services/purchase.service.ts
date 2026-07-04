import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Observable, Subject, catchError, forkJoin, of, switchMap } from 'rxjs';
import { ApiClient, QueryParams } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import {
  CambiarEstadoPayload,
  Compra,
  CompraCreatePayload,
  CompraFilterRequest,
  CompraStats,
  CompraStatsResponse,
  CompraUpdatePayload,
  EstadoCompra,
} from '../models/purchase.model';

const BASE = '/api/v1/compras';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly api = inject(ApiClient);

  private readonly _page = signal<PageResponse<Compra> | null>(null);
  private readonly _stats = signal<CompraStats>({
    total: 0,
    pendientes: 0,
    recibidas: 0,
    anuladas: 0,
    montoTotalMes: 0,
  });
  private readonly _loading = signal(false);
  private readonly _lastError = signal<string | null>(null);

  readonly page = this._page.asReadonly();
  readonly items = computed(() => this._page()?.content ?? []);
  readonly totalElements = computed(() => this._page()?.totalElements ?? 0);
  readonly totalPages = computed(() => Math.max(1, this._page()?.totalPages ?? 1));
  readonly isLast = computed(() => this._page()?.last ?? true);
  readonly stats = this._stats.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly lastError = this._lastError.asReadonly();

  // switchMap cancela la petición anterior si llega una nueva carga: evita que
  // una respuesta lenta y obsoleta pise a la más reciente al cambiar filtros.
  private readonly loadRequest$ = new Subject<CompraFilterRequest>();

  constructor() {
    this.loadRequest$
      .pipe(
        switchMap((filtros) =>
          this.api.get<PageResponse<Compra>>(BASE, { params: filtros as QueryParams }).pipe(
            catchError((err: { friendlyMessage?: string }) => {
              this._page.set(null);
              this._loading.set(false);
              this._lastError.set(err.friendlyMessage ?? 'No se pudieron cargar las compras.');
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe((res) => {
        this._page.set(res);
        this._loading.set(false);
      });
  }

  /** Listado paginado y filtrado por el servidor. */
  load(filtros: CompraFilterRequest = {}): void {
    this._loading.set(true);
    this._lastError.set(null);
    this.loadRequest$.next(filtros);
  }

  /**
   * Carga las tarjetas desde el backend:
   *  - conteos globales (sin filtros),
   *  - monto del mes (rango = mes actual; el backend ya excluye ANULADA).
   */
  loadStats(): void {
    const now = new Date();
    const desde = this.toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const hasta = this.toIsoDate(now);

    const empty: CompraStatsResponse = {
      total: 0,
      pendientes: 0,
      recibidas: 0,
      anuladas: 0,
      montoTotalPeriodo: 0,
    };

    // Cada llamada cae por separado: si la del mes falla, los conteos globales
    // se muestran igual (y viceversa).
    forkJoin({
      global: this.api
        .get<CompraStatsResponse>(`${BASE}/stats`)
        .pipe(catchError(() => of(empty))),
      mes: this.api
        .get<CompraStatsResponse>(`${BASE}/stats`, {
          params: { fechaCompraDesde: desde, fechaCompraHasta: hasta },
        })
        .pipe(catchError(() => of(empty))),
    }).subscribe(({ global, mes }) =>
      this._stats.set({
        total: global.total,
        pendientes: global.pendientes,
        recibidas: global.recibidas,
        anuladas: global.anuladas,
        montoTotalMes: mes.montoTotalPeriodo,
      }),
    );
  }

  create(payload: CompraCreatePayload): Observable<Compra> {
    return this.api.post<Compra, CompraCreatePayload>(BASE, payload);
  }

  update(id: number, payload: CompraUpdatePayload): Observable<Compra> {
    return this.api.put<Compra, CompraUpdatePayload>(`${BASE}/${id}`, payload);
  }

  cambiarEstado(id: number, nuevoEstado: EstadoCompra, motivo?: string): Observable<Compra> {
    return this.api.patch<Compra, CambiarEstadoPayload>(`${BASE}/${id}/estado`, {
      nuevoEstado,
      motivo,
    });
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${BASE}/${id}`);
  }

  /** Fecha local en formato YYYY-MM-DD (sin desfase de zona horaria). */
  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
