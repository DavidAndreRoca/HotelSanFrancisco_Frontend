import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiClient } from '../../../../core/http/http-client.service';
import { RoomService } from '../../services/room.service';
import { HabitacionCalendarioItem } from '../../models/room.model';

// ── Mapeo de estados del mock local → backend ──────────────────
const LOCAL_TO_API: Record<string, string> = {
  available: 'DISPONIBLE',
  occupied: 'OCUPADA',
  reserved: 'RESERVADA',
  cleaning: 'LIMPIEZA',
  maintenance: 'MANTENIMIENTO',
};

// ── Colores por estado ──────────────────────────────────────────
const ESTADO_BG: Record<string, string> = {
  OCUPADA: '#fecaca',
  RESERVADA: '#fef9c3',
  LIMPIEZA: '#bfdbfe',
  MANTENIMIENTO: '#e5e7eb',
};

const ESTADO_DOT: Record<string, string> = {
  DISPONIBLE: '#22c55e',
  OCUPADA: '#f87171',
  RESERVADA: '#facc15',
  LIMPIEZA: '#60a5fa',
  MANTENIMIENTO: '#9ca3af',
};

@Component({
  selector: 'app-room-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="space-y-5">

      <!-- ── Cabecera ──────────────────────────────────────────── -->
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-[#2D2926]">Gestión de Habitaciones</h1>
          <p class="text-sm text-[#2D2926]/50 mt-1">
            Administra el estado y disponibilidad de las habitaciones
          </p>
        </div>

        <!-- Toggle Grid / Calendario -->
        <div class="flex items-center rounded-lg border border-[#EEE3D1] overflow-hidden bg-white">
          <a
            routerLink="/rooms"
            class="flex items-center gap-2 px-4 h-10 text-sm text-[#2D2926]/60
                   hover:bg-[#F9F5F0] transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                 stroke-width="2" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Grid
          </a>
          <div
            class="flex items-center gap-2 px-4 h-10 bg-[#C5A048] text-white text-sm font-medium">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                 stroke-width="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path stroke-linecap="round" d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            Calendario
          </div>
        </div>
      </div>

      <!-- ── Filtro + Leyenda ───────────────────────────────────── -->
      <div class="flex items-center justify-between flex-wrap gap-4">
        <!-- Filtro por tipo -->
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-[#2D2926]/50" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" d="M3 4h18M6 8h12M9 12h6"/>
          </svg>
          <span class="text-sm font-medium text-[#2D2926]">Filtrar:</span>
          <select
            [value]="filtro()"
            (change)="filtro.set($any($event.target).value)"
            class="h-9 px-3 pr-8 rounded-lg border border-[#EEE3D1] bg-white
                   text-sm text-[#2D2926] focus:outline-none focus:border-[#C5A048]
                   appearance-none cursor-pointer"
            [style.background-image]="chevronBgImage"
            style="background-repeat:no-repeat;background-position:right 8px center;background-size:16px">
            <option value="TODOS">Todos</option>
            @for (tipo of tipos(); track tipo) {
              <option [value]="tipo">{{ tipo }}</option>
            }
          </select>
        </div>

        <!-- Leyenda -->
        <div class="flex items-center gap-4 flex-wrap">
          @for (item of LEYENDA; track item.label) {
            <div class="flex items-center gap-1.5">
              <span
                class="w-2.5 h-2.5 rounded-full shrink-0"
                [style.background-color]="item.color">
              </span>
              <span class="text-xs text-[#2D2926]/65">{{ item.label }}</span>
            </div>
          }
        </div>
      </div>

      <!-- ── Navegación de fechas ────────────────────────────────── -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-[#2D2926]">
          {{ rangoLabel() }}
        </span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            (click)="moverFecha(-14)"
            class="w-8 h-8 rounded-lg border border-[#EEE3D1] bg-white hover:bg-[#F9F5F0]
                   flex items-center justify-center transition-colors"
            aria-label="Semana anterior">
            <svg class="w-4 h-4 text-[#2D2926]" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button
            type="button"
            (click)="moverFecha(14)"
            class="w-8 h-8 rounded-lg border border-[#EEE3D1] bg-white hover:bg-[#F9F5F0]
                   flex items-center justify-center transition-colors"
            aria-label="Semana siguiente">
            <svg class="w-4 h-4 text-[#2D2926]" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- ── Tabla calendario ────────────────────────────────────── -->
      <div class="bg-white rounded-xl border border-[#EEE3D1] overflow-hidden">
        @if (loading()) {
          <div class="h-64 flex items-center justify-center">
            <div class="w-6 h-6 rounded-full border-2 border-[#C5A048] border-r-transparent
                        animate-spin" aria-label="Cargando"></div>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="border-collapse" style="min-width:100%">
              <!-- Encabezado de fechas -->
              <thead>
                <tr class="border-b border-[#EEE3D1]">
                  <th class="text-left px-4 py-3 text-xs font-semibold text-[#2D2926]/55
                             uppercase tracking-wide w-32 sticky left-0 bg-white z-10
                             border-r border-[#EEE3D1]">
                    Habitación
                  </th>
                  @for (dia of fechaDias(); track dia.getTime()) {
                    <th class="py-3 px-1 text-center" style="min-width:46px">
                      <span class="text-[10px] text-[#2D2926]/45 block">
                        {{ diaNombre(dia) }}
                      </span>
                      <span class="text-sm font-semibold text-[#2D2926] block leading-tight">
                        {{ dia.getDate() }}
                      </span>
                    </th>
                  }
                </tr>
              </thead>

              <!-- Filas de habitaciones -->
              <tbody>
                @for (hab of habitacionesFiltradas(); track hab.habitacionId) {
                  <tr class="border-b border-[#EEE3D1] last:border-0">
                    <!-- Columna fija: número de habitación -->
                    <td class="px-4 py-0 h-11 sticky left-0 bg-white z-10
                               border-r border-[#EEE3D1]">
                      <div class="flex items-center gap-2">
                        <span
                          class="w-2.5 h-2.5 rounded-full shrink-0"
                          [style.background-color]="dotColor(estadoActual(hab))">
                        </span>
                        <span class="text-sm font-medium text-[#2D2926]">{{ hab.numero }}</span>
                      </div>
                    </td>

                    <!-- Celda por día -->
                    @for (dia of fechaDias(); let i = $index; track dia.getTime()) {
                      <td class="h-11 px-0 py-1.5" style="padding-left:1px;padding-right:1px">
                        <div
                          class="h-full w-full"
                          [style]="cellStyle(hab, i)">
                        </div>
                      </td>
                    }
                  </tr>
                }

                @if (habitacionesFiltradas().length === 0) {
                  <tr>
                    <td
                      [attr.colspan]="15"
                      class="text-center py-10 text-sm text-[#2D2926]/40">
                      No hay habitaciones para mostrar.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

    </div>
  `,
})
export class RoomCalendarPage {
  private readonly api = inject(ApiClient);
  private readonly roomService = inject(RoomService);

  readonly LEYENDA = [
    { label: 'Disponible', color: ESTADO_DOT['DISPONIBLE'] },
    { label: 'Ocupado', color: ESTADO_DOT['OCUPADA'] },
    { label: 'Reservado', color: ESTADO_DOT['RESERVADA'] },
    { label: 'Limpieza', color: ESTADO_DOT['LIMPIEZA'] },
    { label: 'Mantenimiento', color: ESTADO_DOT['MANTENIMIENTO'] },
  ];

  // SVG del chevron del <select>, generado aquí para evitar comillas
  // anidadas/escapes conflictivos dentro del template HTML.
  readonly chevronBgImage =
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%232D2926' stroke-width='2'%3E%3Cpath stroke-linecap='round' d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`;

  readonly loading = signal(true);
  readonly habitaciones = signal<HabitacionCalendarioItem[]>([]);
  readonly filtro = signal('TODOS');
  readonly fechaInicio = signal(this.startOfToday());

  readonly fechaDias = computed(() => {
    const start = this.fechaInicio();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  });

  readonly rangoLabel = computed(() => {
    const dias = this.fechaDias();
    const ini = dias[0].toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    const fin = dias[dias.length - 1].toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${ini} — ${fin}`;
  });

  readonly tipos = computed(() => [
    ...new Set(this.habitaciones().map((h) => h.tipoHabitacionNombre).filter(Boolean)),
  ]);

  readonly habitacionesFiltradas = computed(() => {
    const f = this.filtro();
    if (f === 'TODOS') return this.habitaciones();
    return this.habitaciones().filter((h) => h.tipoHabitacionNombre === f);
  });

  constructor() {
    this.loadCalendario();
  }

  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private toDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private loadCalendario(): void {
    const ini = this.toDateKey(this.fechaInicio());
    const fin = this.toDateKey(this.fechaDias()[13]);

    this.api
      .get<HabitacionCalendarioItem[]>('/api/v1/habitaciones/calendario', {
        params: { fechaInicio: ini, fechaFin: fin },
      })
      .pipe(
        catchError(() => {
          // Fallback: construye calendario desde los datos mock del RoomService
          const dias = this.fechaDias();
          const items: HabitacionCalendarioItem[] = this.roomService
            .filteredRooms()
            .slice(0, 15)
            .map((r, idx) => {
              const estado = LOCAL_TO_API[r.status] ?? 'DISPONIBLE';
              const diasEstado: Record<string, string> = {};
              dias.forEach((d) => {
                diasEstado[this.toDateKey(d)] = estado;
              });
              return {
                habitacionId: r.id,
                numero: r.number,
                piso: Math.floor(parseInt(r.number, 10) / 100),
                tipoHabitacionNombre: r.type === 'suite' ? 'Suite' : r.type === 'double' ? 'Doble' : 'Simple',
                diasEstado,
              };
            });
          return of(items);
        }),
      )
      .subscribe((data) => {
        this.loading.set(false);
        this.habitaciones.set(data);
      });
  }

  moverFecha(dias: number): void {
    const nueva = new Date(this.fechaInicio());
    nueva.setDate(nueva.getDate() + dias);
    this.fechaInicio.set(nueva);
    this.loading.set(true);
    this.loadCalendario();
  }

  diaNombre(date: Date): string {
    return date.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '');
  }

  estadoActual(hab: HabitacionCalendarioItem): string {
    const hoy = this.toDateKey(new Date());
    return hab.diasEstado[hoy] ?? 'DISPONIBLE';
  }

  dotColor(estado: string): string {
    return ESTADO_DOT[estado] ?? '#9ca3af';
  }

  cellStyle(hab: HabitacionCalendarioItem, diaIndex: number): Record<string, string> {
    const dias = this.fechaDias();
    const key = this.toDateKey(dias[diaIndex]);
    const estado = hab.diasEstado[key] ?? 'DISPONIBLE';

    if (estado === 'DISPONIBLE') return {};

    const bg = ESTADO_BG[estado] ?? 'transparent';

    const prevEstado =
      diaIndex > 0 ? (hab.diasEstado[this.toDateKey(dias[diaIndex - 1])] ?? 'DISPONIBLE') : null;
    const nextEstado =
      diaIndex < dias.length - 1
        ? (hab.diasEstado[this.toDateKey(dias[diaIndex + 1])] ?? 'DISPONIBLE')
        : null;

    const isStart = !prevEstado || prevEstado !== estado;
    const isEnd = !nextEstado || nextEstado !== estado;

    let borderRadius = '0';
    if (isStart && isEnd) borderRadius = '6px';
    else if (isStart) borderRadius = '6px 0 0 6px';
    else if (isEnd) borderRadius = '0 6px 6px 0';

    return { backgroundColor: bg, borderRadius };
  }
}