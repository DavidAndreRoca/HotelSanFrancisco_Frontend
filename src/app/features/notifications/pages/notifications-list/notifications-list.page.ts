import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { catchError, debounceTime, map, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiClient } from '../../../../core/http/http-client.service';
import { WebSocketService } from '../../../../core/websocket/websocket.service';
import { WS_TOPICS } from '../../../../core/websocket/websocket-channels';
import { NotificacionHuesped, TipoNotificacion } from '../../models/notification.model';

interface GrupoNotificacion {
  label: string;
  items: NotificacionHuesped[];
}

const PAGE_SIZE = 4;

@Component({
  selector: 'app-notifications-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `
    <div class="space-y-6">

      <!-- Cabecera + acciones -->
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-[#2D2926]">Notificaciones</h1>
          <p class="text-sm text-[#2D2926]/55 mt-0.5">
            @if (sinLeer() > 0) {
              {{ sinLeer() }} sin leer
            } @else {
              Todo al día
            }
          </p>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            (click)="marcarTodasLeidas()"
            [disabled]="marcando() || sinLeer() === 0"
            class="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#C5A048] text-white
                   text-sm font-medium transition-colors hover:bg-[#8E6F2E]
                   disabled:opacity-40 disabled:cursor-not-allowed">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Marcar como leído
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        @for (f of filtros; track f.key) {
          <button
            type="button"
            (click)="setFiltro(f.key)"
            class="shrink-0 h-8 px-4 rounded-full text-sm font-medium transition-colors"
            [ngClass]="filtro() === f.key
              ? 'bg-[#C5A048] text-white shadow-sm'
              : 'bg-white border border-[#EEE3D1] text-[#2D2926]/65 hover:bg-[#F9F5F0]'">
            {{ f.label }}
          </button>
        }
      </div>

      <!-- Skeleton de carga -->
      @if (loading()) {
        <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden divide-y divide-[#EEE3D1]">
          @for (_ of [1, 2, 3, 4, 5]; track $index) {
            <div class="flex items-start gap-4 px-5 py-4">
              <div class="w-10 h-10 rounded-xl bg-[#EEE3D1] animate-pulse shrink-0"></div>
              <div class="flex-1 space-y-2 pt-0.5">
                <div class="h-4 w-44 bg-[#EEE3D1] rounded animate-pulse"></div>
                <div class="h-3 w-72 bg-[#EEE3D1] rounded animate-pulse"></div>
                <div class="h-3 w-20 bg-[#EEE3D1] rounded animate-pulse"></div>
              </div>
            </div>
          }
        </div>

      <!-- Estado de error -->
      } @else if (error()) {
        <div class="bg-white rounded-2xl border border-[#EEE3D1] py-20 flex flex-col items-center gap-3">
          <div class="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <svg class="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667
                       1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34
                       16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <p class="text-sm font-semibold text-[#2D2926]">No se pudieron cargar las notificaciones</p>
          <p class="text-xs text-[#2D2926]/45">Vuelve a intentarlo en unos momentos.</p>
          <button
            type="button"
            (click)="reintentar()"
            class="mt-1 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#C5A048]
                   text-white text-sm font-medium transition-colors hover:bg-[#8E6F2E]">
            Reintentar
          </button>
        </div>

      <!-- Estado vacío -->
      } @else if (grupos().length === 0) {
        <div class="bg-white rounded-2xl border border-[#EEE3D1] py-20 flex flex-col items-center gap-3">
          <div class="w-14 h-14 rounded-full bg-[#F9F5F0] flex items-center justify-center">
            <svg class="w-7 h-7 text-[#C5A048]/60" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002
                       6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388
                       6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3
                       0 11-6 0v-1m6 0H9"/>
            </svg>
          </div>
          <p class="text-sm font-semibold text-[#2D2926]">Sin notificaciones</p>
          <p class="text-xs text-[#2D2926]/45">No hay notificaciones en esta categoría.</p>
        </div>

      <!-- Lista agrupada por fecha -->
      } @else {
        <div class="space-y-5">
          @for (grupo of grupos(); track grupo.label) {
            <div>
              <!-- Separador de fecha -->
              <div class="flex items-center gap-3 mb-2">
                <span class="text-xs font-semibold tracking-wide text-[#2D2926]/50 uppercase shrink-0">
                  {{ grupo.label }}
                </span>
                <div class="flex-1 h-px bg-[#EEE3D1]"></div>
              </div>

              <!-- Tarjeta del grupo -->
              <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden
                          divide-y divide-[#EEE3D1]">
                @for (n of grupo.items; track n.notificacionId) {
                  <div
                    class="flex items-start gap-4 px-5 py-4 transition-colors"
                    [style.border-left]="!n.leida ? '3px solid #C5A048' : '3px solid transparent'"
                    [style.background-color]="!n.leida ? '#FEF9EF' : 'white'">

                    <!-- Icono -->
                    <div
                      class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      [ngClass]="iconBg(n.tipo)">
                      @switch (n.tipo) {
                        @case ('CHECK_IN') {
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                               stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        }
                        @case ('CHECK_OUT') {
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                               stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        }
                        @case ('PAGO') {
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                               stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3
                                     3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                          </svg>
                        }
                        @case ('SERVICIO') {
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                               stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667
                                     1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34
                                     16c-.77 1.333.192 3 1.732 3z"/>
                          </svg>
                        }
                        @case ('CONFIRMACION') {
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                               stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2
                                     2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                        }
                        @default {
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                               stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0
                                     012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1
                                     0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                        }
                      }
                    </div>

                    <!-- Contenido -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <p class="text-sm font-semibold text-[#2D2926] truncate">
                          {{ n.titulo }}
                        </p>
                        @if (!n.leida) {
                          <span class="w-2 h-2 rounded-full bg-[#C5A048] shrink-0"
                                aria-label="No leída"></span>
                        }
                      </div>
                      <p class="text-xs text-[#2D2926]/55 mt-0.5 leading-relaxed line-clamp-2">
                        {{ n.mensaje }}
                      </p>
                      <p class="text-[11px] text-[#2D2926]/40 mt-1.5">
                        {{ formatHora(n.fechaCreacion) }}
                      </p>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Paginación -->
        @if (totalPages() > 1) {
          <div class="flex items-center justify-between gap-3 pt-1">
            <p class="text-xs text-[#2D2926]/50">
              {{ totalItems() }} notificación(es) · Página {{ pageIndex() + 1 }} de {{ totalPages() }}
            </p>
            <div class="flex items-center gap-2">
              <button type="button" (click)="paginaAnterior()" [disabled]="pageIndex() === 0"
                class="h-8 px-3 rounded-lg border border-[#EEE3D1] text-xs font-medium
                       text-[#2D2926]/70 hover:bg-[#F9F5F0] disabled:opacity-40
                       disabled:cursor-not-allowed transition-colors">Anterior</button>
              <button type="button" (click)="paginaSiguiente()" [disabled]="pageIndex() >= totalPages() - 1"
                class="h-8 px-3 rounded-lg border border-[#EEE3D1] text-xs font-medium
                       text-[#2D2926]/70 hover:bg-[#F9F5F0] disabled:opacity-40
                       disabled:cursor-not-allowed transition-colors">Siguiente</button>
            </div>
          </div>
        }
      }

    </div>
  `,
})
export class NotificationsListPage {
  private readonly api = inject(ApiClient);
  private readonly toastr = inject(ToastrService);
  private readonly ws = inject(WebSocketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly marcando = signal(false);
  readonly notificaciones = signal<NotificacionHuesped[]>([]);
  readonly filtro = signal<string>('TODAS');
  readonly pageIndex = signal(0);

  readonly filtros = [
    { key: 'TODAS',          label: 'Todas' },
    { key: 'CHECK_IN_OUT',   label: 'Check-in/out' },
    { key: 'PAGOS',          label: 'Pagos' },
    { key: 'SERVICIOS',      label: 'Servicios' },
    { key: 'CONFIRMACIONES', label: 'Confirmaciones' },
    { key: 'FACTURAS',       label: 'Facturas' },
  ] as const;

  readonly sinLeer = computed(() =>
    this.notificaciones().filter((n) => !n.leida).length,
  );

  private readonly filtradas = computed(() => {
    const f = this.filtro();
    const all = this.notificaciones();
    if (f === 'TODAS') return all;
    const tipoMap: Record<string, TipoNotificacion[]> = {
      CHECK_IN_OUT:    ['CHECK_IN', 'CHECK_OUT'],
      PAGOS:           ['PAGO'],
      SERVICIOS:       ['SERVICIO'],
      CONFIRMACIONES:  ['CONFIRMACION'],
      FACTURAS:        ['FACTURA'],
    };
    return all.filter((n) => (tipoMap[f] ?? []).includes(n.tipo));
  });

  // Orden global (más reciente primero) sobre el que se pagina.
  private readonly ordenadas = computed(() =>
    [...this.filtradas()].sort(
      (a, b) => +new Date(b.fechaCreacion) - +new Date(a.fechaCreacion),
    ),
  );

  readonly totalItems = computed(() => this.ordenadas().length);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / PAGE_SIZE)),
  );

  private readonly paginadas = computed(() => {
    const start = this.pageIndex() * PAGE_SIZE;
    return this.ordenadas().slice(start, start + PAGE_SIZE);
  });

  readonly grupos = computed<GrupoNotificacion[]>(() =>
    this.agrupar(this.paginadas()),
  );

  constructor() {
    this.load();
    // Cola personal del huésped: cada notificación nueva refresca la bandeja.
    this.ws
      .onTopic<unknown>(WS_TOPICS.notificaciones, this.destroyRef)
      .pipe(debounceTime(300))
      .subscribe(() => this.load());
  }

  private load(): void {
    this.error.set(false);
    this.api
      .get<{ content: NotificacionHuesped[] } | null>('/api/v1/notificaciones')
      // `res?.content ?? []` sobrevive al periodo entre despliegues: si el backend
      // aún responde crudo (sin el sobre `data`), `unwrap` devuelve undefined y
      // aquí queda como lista vacía en vez de romper. Nunca mostramos datos falsos.
      .pipe(
        map((res) => res?.content ?? []),
        catchError(() => {
          this.error.set(true);
          return of<NotificacionHuesped[]>([]);
        }),
      )
      .subscribe((data) => {
        this.notificaciones.set(data);
        this.loading.set(false);
      });
  }

  marcarTodasLeidas(): void {
    if (this.marcando() || this.sinLeer() === 0) return;
    this.marcando.set(true);
    this.api
      .patch<void, null>('/api/v1/notificaciones/leer-todas', null)
      .pipe(catchError(() => of(undefined)))
      .subscribe(() => {
        this.notificaciones.update((ns) => ns.map((n) => ({ ...n, leida: true })));
        this.marcando.set(false);
        this.toastr.success('Todas las notificaciones marcadas como leídas.');
      });
  }

  reintentar(): void {
    this.loading.set(true);
    this.load();
  }

  setFiltro(key: string): void {
    this.filtro.set(key);
    this.pageIndex.set(0);
  }

  paginaAnterior(): void {
    if (this.pageIndex() === 0) return;
    this.pageIndex.update((p) => p - 1);
  }

  paginaSiguiente(): void {
    if (this.pageIndex() >= this.totalPages() - 1) return;
    this.pageIndex.update((p) => p + 1);
  }

  iconBg(tipo: TipoNotificacion): string {
    const map: Record<TipoNotificacion, string> = {
      CHECK_IN:    'bg-emerald-50 text-emerald-500',
      CHECK_OUT:   'bg-orange-50 text-orange-500',
      PAGO:        'bg-blue-50 text-blue-500',
      SERVICIO:    'bg-purple-50 text-purple-500',
      CONFIRMACION:'bg-amber-50 text-amber-500',
      FACTURA:     'bg-teal-50 text-teal-500',
    };
    return map[tipo] ?? 'bg-gray-50 text-gray-500';
  }

  formatHora(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private agrupar(items: NotificacionHuesped[]): GrupoNotificacion[] {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);

    const map = new Map<string, { label: string; ts: number; items: NotificacionHuesped[] }>();

    for (const n of items) {
      const d = new Date(n.fechaCreacion); d.setHours(0, 0, 0, 0);
      let key: string;
      let label: string;

      if (d.getTime() === hoy.getTime()) {
        key = 'hoy'; label = 'Hoy';
      } else if (d.getTime() === ayer.getTime()) {
        key = 'ayer'; label = 'Ayer';
      } else {
        key = d.toISOString().slice(0, 10);
        label = d.toLocaleDateString('es-PE', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
      }

      if (!map.has(key)) map.set(key, { label, ts: d.getTime(), items: [] });
      map.get(key)!.items.push(n);
    }

    return [...map.values()]
      .sort((a, b) => b.ts - a.ts)
      .map(({ label, items }) => ({ label, items }));
  }
}
