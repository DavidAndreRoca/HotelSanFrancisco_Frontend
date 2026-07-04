import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, Subject, catchError, switchMap, tap } from 'rxjs';
import { ApiClient, QueryParams } from '../../../core/http/http-client.service';
import {
  CambiarEstadoIncidenciaPayload,
  CreateIncidenciaPayload,
  Incidencia,
  IncidenciaFilters,
  UpdateIncidenciaPayload,
} from '../models/incidencia.model';

const BASE = '/api/v1/incidencias';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class IncidenciaService {
  private readonly api = inject(ApiClient);

  private readonly _incidencias = signal<Incidencia[]>([]);
  private readonly _loading = signal(false);

  readonly incidencias = this._incidencias.asReadonly();
  readonly loading = this._loading.asReadonly();

  // switchMap cancela la petición anterior si llega una nueva carga: evita que
  // una respuesta lenta y obsoleta pise a la más reciente al cambiar filtros.
  private readonly loadRequest$ = new Subject<QueryParams>();

  constructor() {
    this.loadRequest$
      .pipe(
        switchMap((params) =>
          this.api.get<PageResponse<Incidencia>>(BASE, { params }).pipe(
            catchError(() => {
              this._loading.set(false);
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe((res) => {
        this._incidencias.set(res.content);
        this._loading.set(false);
      });
  }

  load(filters: IncidenciaFilters = {}, page = 0, size = 20): void {
    this._loading.set(true);
    this.loadRequest$.next({ ...filters, page, size });
  }

  getById(id: number): Observable<Incidencia> {
    return this.api.get<Incidencia>(`${BASE}/${id}`);
  }

  create(payload: CreateIncidenciaPayload): Observable<Incidencia> {
    return this.api.post<Incidencia>(BASE, payload).pipe(
      tap((inc) => this._incidencias.update((list) => [inc, ...list])),
    );
  }

  update(id: number, payload: UpdateIncidenciaPayload): Observable<Incidencia> {
    return this.api.put<Incidencia>(`${BASE}/${id}`, payload).pipe(
      tap((updated) =>
        this._incidencias.update((list) =>
          list.map((i) => (i.incidenciaId === id ? updated : i)),
        ),
      ),
    );
  }

  cambiarEstado(id: number, payload: CambiarEstadoIncidenciaPayload): Observable<Incidencia> {
    return this.api.patch<Incidencia>(`${BASE}/${id}/estado`, payload).pipe(
      tap((updated) =>
        this._incidencias.update((list) =>
          list.map((i) => (i.incidenciaId === id ? updated : i)),
        ),
      ),
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${BASE}/${id}`).pipe(
      tap(() =>
        this._incidencias.update((list) => list.filter((i) => i.incidenciaId !== id)),
      ),
    );
  }
}
