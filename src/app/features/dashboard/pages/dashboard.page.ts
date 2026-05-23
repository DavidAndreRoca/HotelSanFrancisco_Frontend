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
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { WebSocketService } from '../../../core/websocket/websocket.service';
import { WS_TOPICS } from '../../../core/websocket/websocket-channels';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiCardComponent } from '../../../shared/ui/card/ui-card.component';
import { UiBadgeComponent, BadgeTone } from '../../../shared/ui/badge/ui-badge.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/ui-skeleton.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/ui-empty-state.component';
import { RoomTypesService } from '../../rooms/services/room-types.service';

interface ReservaWsPayload {
  reservaId: number;
  codReserva: string;
  estado: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  montoTotal: number | null;
}

interface ActivityItem {
  type: string;
  payload: ReservaWsPayload;
  timestamp: string;
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    UiButtonComponent,
    UiCardComponent,
    UiBadgeComponent,
    UiSkeletonComponent,
    UiEmptyStateComponent,
  ],
  template: `
    <header class="mb-6">
      <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--color-primary-700)] font-semibold mb-1">
        Panel general
      </p>
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">
        Hola, {{ greetName() }} 👋
      </h1>
      <p class="text-[15px] text-[var(--color-ink-muted)] mt-1">
        Resumen de la operación del hotel en tiempo real.
      </p>
    </header>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <ui-card padding="md">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">
              Tipos activos
            </p>
            @if (roomsService.loading()) {
              <ui-skeleton height="2rem" width="3rem" />
            } @else {
              <p class="text-3xl font-bold mt-1">{{ roomsService.totalActive() }}</p>
            }
          </div>
          <span class="text-[var(--color-primary-500)]" aria-hidden="true">◇</span>
        </div>
      </ui-card>

      <ui-card padding="md">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">
              Capacidad total
            </p>
            @if (roomsService.loading()) {
              <ui-skeleton height="2rem" width="3rem" />
            } @else {
              <p class="text-3xl font-bold mt-1">{{ roomsService.totalCapacity() }}</p>
            }
          </div>
          <span class="text-[var(--color-primary-500)]" aria-hidden="true">☷</span>
        </div>
      </ui-card>

      <ui-card padding="md">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">
              Precio promedio
            </p>
            @if (roomsService.loading()) {
              <ui-skeleton height="2rem" width="4rem" />
            } @else {
              <p class="text-3xl font-bold mt-1 text-[var(--color-primary-700)]">
                {{ roomsService.averagePrice() | currency:'PEN':'symbol-narrow':'1.0-0' }}
              </p>
            }
          </div>
          <span class="text-[var(--color-primary-500)]" aria-hidden="true">✦</span>
        </div>
      </ui-card>

      <ui-card padding="md">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">
              Eventos hoy
            </p>
            <p class="text-3xl font-bold mt-1">{{ activity().length }}</p>
          </div>
          <span [class]="wsDotClass()" [attr.aria-label]="wsLabel()"></span>
        </div>
        <p class="mt-2 text-[12px] text-[var(--color-ink-muted)]">
          Conexión en vivo: {{ wsLabel() }}
        </p>
      </ui-card>
    </div>

    <div class="grid lg:grid-cols-[1fr_320px] gap-6">
      <!-- Accesos rápidos -->
      <ui-card title="Accesos rápidos" subtitle="Operaciones más frecuentes del equipo.">
        <div class="grid sm:grid-cols-2 gap-3">
          @for (action of quickActions; track action.link) {
            <a
              [routerLink]="action.link"
              class="group flex items-start gap-3 p-4 rounded-xl border border-[var(--color-border-soft)] hover:border-[var(--color-primary-500)] hover:shadow-[var(--shadow-card)] transition">
              <div
                class="w-10 h-10 rounded-lg bg-[var(--color-primary-500)]/15 text-[var(--color-primary-700)] flex items-center justify-center text-lg font-semibold shrink-0"
                aria-hidden="true">
                {{ action.icon }}
              </div>
              <div>
                <p class="text-[14px] font-semibold">{{ action.title }}</p>
                <p class="text-[12px] text-[var(--color-ink-muted)] mt-0.5">
                  {{ action.subtitle }}
                </p>
              </div>
            </a>
          }
        </div>
      </ui-card>

      <!-- Actividad en vivo -->
      <ui-card title="Actividad en vivo" subtitle="Eventos de reservas en tiempo real.">
        @if (activity().length === 0) {
          <ui-empty-state
            icon="✦"
            title="Aún no hay actividad"
            description="Cuando ocurra una reserva, aparecerá aquí.">
          </ui-empty-state>
        } @else {
          <ul class="space-y-3 max-h-[420px] overflow-y-auto pr-1" role="log" aria-live="polite">
            @for (item of activity(); track item.timestamp + item.payload.reservaId) {
              <li class="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-soft)]">
                <ui-badge [tone]="badgeForType(item.type)">{{ shortType(item.type) }}</ui-badge>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-medium truncate">
                    Reserva {{ item.payload.codReserva || '#' + item.payload.reservaId }}
                  </p>
                  <p class="text-[11px] text-[var(--color-ink-muted)]">
                    {{ item.timestamp | date:'shortTime' }}
                    @if (item.payload.estado) {
                      · {{ item.payload.estado }}
                    }
                    @if (item.payload.montoTotal) {
                      · {{ item.payload.montoTotal | currency:'PEN':'symbol-narrow':'1.2-2' }}
                    }
                  </p>
                </div>
              </li>
            }
          </ul>
        }
      </ui-card>
    </div>

    <footer class="mt-8 flex flex-wrap items-center justify-between gap-3 text-[12px] text-[var(--color-ink-muted)]">
      <span>Sesión activa como <strong class="text-[var(--color-ink-soft)]">{{ store.user()?.rol }}</strong></span>
      <ui-button variant="ghost" size="sm" (click)="refresh()">Actualizar datos</ui-button>
    </footer>
  `,
})
export class DashboardPage implements OnInit {
  protected readonly store = inject(AuthStore);
  protected readonly roomsService = inject(RoomTypesService);
  private readonly ws = inject(WebSocketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly activity = signal<ActivityItem[]>([]);

  readonly greetName = computed(() => {
    const u = this.store.user();
    return u?.nombre ?? 'usuario';
  });

  readonly wsLabel = computed(() => {
    const status = this.ws.status();
    if (status === 'connected') return 'En vivo';
    if (status === 'connecting') return 'Conectando…';
    if (status === 'disconnected') return 'Desconectado';
    return 'Inactivo';
  });

  readonly wsDotClass = computed(() => {
    const tone =
      this.ws.status() === 'connected'
        ? 'bg-[var(--color-success-500)] animate-pulse'
        : this.ws.status() === 'connecting'
          ? 'bg-[var(--color-warning-500)]'
          : 'bg-[var(--color-ink-muted)]';
    return `inline-block w-2.5 h-2.5 rounded-full ${tone}`;
  });

  readonly quickActions = [
    { title: 'Tipos de habitación', subtitle: 'Catálogo y precios', icon: '◇', link: '/rooms' },
    { title: 'Reservas', subtitle: 'Gestión de estancias', icon: '☷', link: '/reservations' },
    { title: 'Huéspedes', subtitle: 'Directorio de clientes', icon: '☺', link: '/guests' },
    { title: 'Empleados', subtitle: 'Operación del equipo', icon: '✤', link: '/employees' },
  ] as const;

  ngOnInit(): void {
    this.roomsService.load({ size: 50 });
    this.subscribeReservas();
    this.ws.autoDisposeOn(this.destroyRef);
  }

  refresh(): void {
    this.roomsService.load({ size: 50 });
  }

  private subscribeReservas(): void {
    this.ws
      .subscribe<{ type: string; entity: string; payload: ReservaWsPayload; timestamp: string }>(
        WS_TOPICS.reservas,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (!event?.payload) return;
        this.activity.update((list) =>
          [{ type: event.type, payload: event.payload, timestamp: event.timestamp }, ...list].slice(0, 20),
        );
      });
  }

  shortType(t: string): string {
    return t.replace('RESERVA_', '');
  }

  badgeForType(t: string): BadgeTone {
    if (t.includes('ELIMINADA')) return 'danger';
    if (t.includes('CREADA')) return 'success';
    if (t.includes('CAMBIO_ESTADO')) return 'info';
    if (t.includes('ACTUALIZADA')) return 'warning';
    return 'neutral';
  }
}
