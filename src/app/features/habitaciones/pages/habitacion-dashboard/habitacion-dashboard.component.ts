import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { HabitacionService } from '../../services/habitacion.service';
import { WebSocketService } from '../../../../core/websocket/websocket.service';
import { WS_TOPICS } from '../../../../core/websocket/websocket-channels';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiSkeletonComponent } from '../../../../shared/ui/skeleton/ui-skeleton.component';
import { Habitacion, EstadoHabitacion, ESTADO_HABITACION_CONFIG } from '../../models/habitacion.model';

@Component({
  selector: 'app-habitacion-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiButtonComponent, UiSkeletonComponent],
  template: `
    <header class="mb-6">
      <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--color-primary-700)] font-semibold mb-1">
        Gestión operativa
      </p>
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Panel de habitaciones</h1>
      <p class="text-[15px] text-[var(--color-ink-muted)] mt-1">
        Estado en tiempo real de todas las unidades del hotel.
      </p>
    </header>

    <!-- KPIs de conteo por estado -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      @for (kpi of kpis(); track kpi.estado) {
        <button
          type="button"
          (click)="toggleFiltroEstado(kpi.estado)"
          [class]="kpiCardClass(kpi.estado)">
          <span class="text-2xl font-bold tabular-nums">{{ kpi.count }}</span>
          <span class="text-[11px] font-semibold uppercase tracking-wider mt-1">{{ kpi.label }}</span>
          <span [class]="'mt-2 w-full h-0.5 rounded ' + kpi.dotColor"></span>
        </button>
      }
    </div>

    <!-- Filtros -->
    <div class="flex flex-wrap gap-3 mb-5">
      <div class="flex-1 min-w-[200px]">
        <select
          [value]="filtroPiso()"
          (change)="filtroPiso.set(+($any($event.target).value) || 0)"
          class="w-full h-9 px-3 rounded-lg border border-[var(--color-border-soft)] bg-white text-[14px] focus:outline-none focus:border-[var(--color-primary-500)]">
          <option value="0">Todos los pisos</option>
          @for (piso of pisos(); track piso) {
            <option [value]="piso">Piso {{ piso }}</option>
          }
        </select>
      </div>
      <ui-button variant="ghost" size="sm" (click)="limpiarFiltros()">Limpiar filtros</ui-button>
      <ui-button variant="ghost" size="sm" (click)="service.load()">Actualizar</ui-button>
      <ui-button size="sm" routerLink="/habitaciones/checkin">Nuevo check-in</ui-button>
      <ui-button variant="outline" size="sm" routerLink="/habitaciones/checkout">Check-out</ui-button>
    </div>

    <!-- Grid de habitaciones -->
    @if (service.loading()) {
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        @for (i of [1,2,3,4,5,6,7,8,9,10,11,12]; track i) {
          <ui-skeleton height="7rem" />
        }
      </div>
    } @else {
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        @for (hab of habitacionesFiltradas(); track hab.habitacionId) {
          <div [class]="cardClass(hab)" role="article" [attr.aria-label]="'Habitación ' + hab.numero">
            <!-- Barra lateral de estado -->
            <div [class]="'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ' + estadoConfig(hab.estado).dotColor"></div>

            <div class="pl-2">
              <div class="flex items-start justify-between">
                <span class="text-[11px] text-[var(--color-ink-muted)] font-medium">Piso {{ hab.piso }}</span>
                <span [class]="'inline-block w-2 h-2 rounded-full ' + estadoConfig(hab.estado).dotColor"></span>
              </div>
              <p class="text-xl font-bold tracking-tight mt-0.5">{{ hab.numero }}</p>
              <p [class]="'text-[11px] font-semibold mt-1.5 ' + estadoConfig(hab.estado).textColor">
                {{ estadoConfig(hab.estado).label }}
              </p>
            </div>

            <!-- Acción rápida según estado -->
            @if (hab.estado === 'LIMPIEZA') {
              <button
                type="button"
                (click)="marcarLimpia(hab)"
                class="mt-3 w-full text-[11px] font-semibold py-1 rounded-md border border-[var(--color-warning-500)] text-[var(--color-warning-700)] hover:bg-[var(--color-warning-500)]/10 transition">
                Marcar limpia
              </button>
            }
          </div>
        }
      </div>

      @if (habitacionesFiltradas().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 text-[var(--color-ink-muted)]">
          <p class="text-[15px] font-medium">Sin resultados para los filtros seleccionados.</p>
          <ui-button variant="ghost" size="sm" class="mt-3" (click)="limpiarFiltros()">
            Limpiar filtros
          </ui-button>
        </div>
      }
    }

    <!-- Leyenda -->
    <div class="mt-6 flex flex-wrap gap-4 text-[12px] text-[var(--color-ink-muted)]">
      @for (entry of leyenda; track entry.estado) {
        <span class="flex items-center gap-1.5">
          <span [class]="'w-2.5 h-2.5 rounded-full ' + entry.dotColor"></span>
          {{ entry.label }}
        </span>
      }
    </div>
  `,
})
export class HabitacionDashboardComponent implements OnInit {
  protected readonly service = inject(HabitacionService);
  private readonly ws = inject(WebSocketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly filtroEstado = signal<EstadoHabitacion | null>(null);
  readonly filtroPiso = signal(0);

  readonly pisos = computed(() => {
    const set = new Set<number>();
    for (const h of this.service.habitaciones()) set.add(h.piso);
    return Array.from(set).sort();
  });

  readonly habitacionesFiltradas = computed(() => {
    let list = this.service.habitaciones();
    if (this.filtroEstado()) list = list.filter((h) => h.estado === this.filtroEstado());
    if (this.filtroPiso()) list = list.filter((h) => h.piso === this.filtroPiso());
    return list;
  });

  readonly kpis = computed(() => {
    const c = this.service.conteoEstados();
    return [
      { estado: 'DISPONIBLE' as const, label: 'Disponibles', count: c.disponible, dotColor: 'bg-[var(--color-success-500)]' },
      { estado: 'OCUPADA' as const, label: 'Ocupadas', count: c.ocupada, dotColor: 'bg-[var(--color-danger-500)]' },
      { estado: 'LIMPIEZA' as const, label: 'En limpieza', count: c.limpieza, dotColor: 'bg-[var(--color-warning-500)]' },
      { estado: 'MANTENIMIENTO' as const, label: 'Mantenimiento', count: c.mantenimiento, dotColor: 'bg-[var(--color-ink-muted)]' },
      { estado: 'BLOQUEADA' as const, label: 'Bloqueadas', count: c.bloqueada, dotColor: 'bg-[var(--color-ink)]' },
    ];
  });

  readonly leyenda = [
    { estado: 'DISPONIBLE', label: 'Disponible', dotColor: 'bg-[var(--color-success-500)]' },
    { estado: 'OCUPADA', label: 'Ocupada', dotColor: 'bg-[var(--color-danger-500)]' },
    { estado: 'LIMPIEZA', label: 'En limpieza', dotColor: 'bg-[var(--color-warning-500)]' },
    { estado: 'MANTENIMIENTO', label: 'Mantenimiento', dotColor: 'bg-[var(--color-ink-muted)]' },
    { estado: 'BLOQUEADA', label: 'Bloqueada', dotColor: 'bg-[var(--color-ink)]' },
  ];

  ngOnInit(): void {
    this.service.load();
    this.ws
      .subscribe<{ payload: { habitacionId: number; estado: string } }>(WS_TOPICS.habitaciones)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.service.load());
    this.ws.autoDisposeOn(this.destroyRef);
  }

  toggleFiltroEstado(estado: EstadoHabitacion): void {
    this.filtroEstado.update((prev) => (prev === estado ? null : estado));
  }

  limpiarFiltros(): void {
    this.filtroEstado.set(null);
    this.filtroPiso.set(0);
  }

  marcarLimpia(hab: Habitacion): void {
    this.service.marcarLimpiezaCompletada(hab.habitacionId).subscribe();
  }

  estadoConfig(estado: EstadoHabitacion) {
    return ESTADO_HABITACION_CONFIG[estado];
  }

  cardClass(hab: Habitacion): string {
    const cfg = ESTADO_HABITACION_CONFIG[hab.estado];
    return [
      'relative flex flex-col p-3 rounded-xl border-2 transition-all duration-200 cursor-default',
      cfg.borderColor,
      cfg.bgColor,
    ].join(' ');
  }

  kpiCardClass(estado: EstadoHabitacion): string {
    const active = this.filtroEstado() === estado;
    return [
      'flex flex-col items-center p-3 rounded-xl border transition-all text-left w-full',
      active
        ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/8 shadow-sm'
        : 'border-[var(--color-border-soft)] bg-white hover:border-[var(--color-primary-500)]/50',
    ].join(' ');
  }
}
