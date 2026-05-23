import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import {
  EstadoActivo,
  PageResponse,
  RoomType,
  RoomTypeCreatePayload,
  RoomTypeUpdatePayload,
} from '../models/room-type.model';

@Injectable({ providedIn: 'root' })
export class RoomTypesService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/tipos-habitacion';

  private readonly _items = signal<RoomType[]>([]);
  private readonly _page = signal<Omit<PageResponse<RoomType>, 'content'> | null>(null);
  private readonly _loading = signal(false);
  private readonly _lastError = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly page = this._page.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly lastError = this._lastError.asReadonly();

  readonly totalActive = computed(() => this._items().filter((t) => t.estado === 'ACTIVO').length);
  readonly totalCapacity = computed(() =>
    this._items().reduce((acc, t) => acc + (t.estado === 'ACTIVO' ? t.capacidadMaxima : 0), 0),
  );
  readonly averagePrice = computed(() => {
    const list = this._items().filter((t) => t.estado === 'ACTIVO');
    if (!list.length) return 0;
    return list.reduce((acc, t) => acc + t.precioBase, 0) / list.length;
  });

  load(params: { page?: number; size?: number; sort?: string } = {}): void {
    this._loading.set(true);
    this._lastError.set(null);
    this.api
      .get<PageResponse<RoomType>>(this.base, {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 12,
          sort: params.sort ?? 'nombre,asc',
        },
      })
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (res) => {
          this._items.set(res.content);
          const { content: _content, ...rest } = res;
          this._page.set(rest);
        },
        error: (err: { friendlyMessage?: string }) => {
          this._lastError.set(err.friendlyMessage ?? 'No se pudo cargar el listado.');
        },
      });
  }

  findById(id: number): Observable<RoomType> {
    return this.api.get<RoomType>(`${this.base}/${id}`);
  }

  findByEstado(estado: EstadoActivo): Observable<RoomType[]> {
    return this.api.get<RoomType[]>(`${this.base}/estado/${estado}`);
  }

  create(payload: RoomTypeCreatePayload): Observable<RoomType> {
    return this.api
      .post<RoomType, RoomTypeCreatePayload>(this.base, payload)
      .pipe(tap((created) => this._items.update((arr) => [created, ...arr])));
  }

  update(id: number, payload: RoomTypeUpdatePayload): Observable<RoomType> {
    return this.api
      .put<RoomType, RoomTypeUpdatePayload>(`${this.base}/${id}`, payload)
      .pipe(
        tap((updated) =>
          this._items.update((arr) =>
            arr.map((t) => (t.tipoHabitacionId === id ? updated : t)),
          ),
        ),
      );
  }

  delete(id: number): Observable<void> {
    return this.api
      .delete<void>(`${this.base}/${id}`)
      .pipe(
        tap(() =>
          this._items.update((arr) => arr.filter((t) => t.tipoHabitacionId !== id)),
        ),
      );
  }
}
