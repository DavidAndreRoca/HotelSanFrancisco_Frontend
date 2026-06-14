import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HabitacionService } from '../../services/habitacion.service';
import { WebSocketService } from '../../../../core/websocket/websocket.service';
import { WS_TOPICS } from '../../../../core/websocket/websocket-channels';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiSkeletonComponent } from '../../../../shared/ui/skeleton/ui-skeleton.component';
import { Habitacion } from '../../models/habitacion.model';

@Component({
  selector: 'app-limpieza',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiButtonComponent, UiSkeletonComponent],
  template: `
    <div>
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <a routerLink="/habitaciones" class="text-[13px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition">
            ← Volver al panel
          </a>
          <h1 class="text-2xl font-bold tracking-tight mt-2">Cola de limpieza</h1>
          <p class="text-[14px] text-[var(--color-ink-muted)] mt-1">
            Habitaciones pendientes de limpieza tras check-out. Márquelas como listas para disponibilizarlas.
          </p>
        </div>
        <ui-button variant="outline" size="sm" (click)="reload()">Actualizar</ui-button>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1,2,3,4,5,6]; track i) {
            <ui-skeleton height="5.5rem" />
          }
        </div>
      } @else if (habitaciones().length === 0) {
        <div class="flex flex-col items-center justify-center py-24 text-[var(--color-ink-muted)]">
          <div class="w-12 h-12 rounded-full bg-[var(--color-success-500)]/15 flex items-center justify-center mb-4">
            <span class="w-5 h-5 rounded-full bg-[var(--color-success-500)] inline-block"></span>
          </div>
          <p class="text-[15px] font-semibold text-[var(--color-ink-soft)]">Sin pendientes</p>
          <p class="text-[13px] mt-1">Todas las habitaciones están disponibles o en otro estado.</p>
        </div>
      } @else {
        <div class="mb-4 text-[13px] text-[var(--color-ink-muted)]">
          <strong class="text-[var(--color-ink-soft)]">{{ habitaciones().length }}</strong>
          habitación{{ habitaciones().length !== 1 ? 'es' : '' }} en cola
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (hab of habitaciones(); track hab.habitacionId) {
            <div class="bg-white rounded-xl border-2 border-[var(--color-warning-400)] shadow-[var(--shadow-card)] p-4 flex items-center gap-4">
              <!-- Indicador visual -->
              <div class="shrink-0 w-10 h-10 rounded-lg bg-[var(--color-warning-500)]/15 flex items-center justify-center">
                <span class="w-3 h-3 rounded-full bg-[var(--color-warning-500)] inline-block"></span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-2">
                  <span class="text-[18px] font-bold tracking-tight">{{ hab.numero }}</span>
                  <span class="text-[12px] text-[var(--color-ink-muted)]">Piso {{ hab.piso }}</span>
                </div>
                @if (hab.observaciones) {
                  <p class="text-[12px] text-[var(--color-ink-muted)] mt-0.5 truncate">{{ hab.observaciones }}</p>
                }
                <span class="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-warning-700)] px-2 py-0.5 rounded-full bg-[var(--color-warning-500)]/12">
                  Limpieza pendiente
                </span>
              </div>

              <ui-button
                size="sm"
                [loading]="marcandoId() === hab.habitacionId"
                (click)="marcarLimpia(hab)">
                Limpia
              </ui-button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class LimpiezaPage implements OnInit {
  private readonly habitacionService = inject(HabitacionService);
  private readonly ws = inject(WebSocketService);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly habitaciones = signal<Habitacion[]>([]);
  readonly marcandoId = signal<number | null>(null);

  ngOnInit(): void {
    this.reload();
    this.ws
      .subscribe<unknown>(WS_TOPICS.habitaciones)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
    this.ws.autoDisposeOn(this.destroyRef);
  }

  reload(): void {
    this.loading.set(true);
    this.habitacionService.getLimpieza().subscribe({
      next: (list) => {
        this.habitaciones.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  marcarLimpia(hab: Habitacion): void {
    this.marcandoId.set(hab.habitacionId);
    this.habitacionService.marcarLimpiezaCompletada(hab.habitacionId).subscribe({
      next: () => {
        this.marcandoId.set(null);
        this.toastr.success(`Habitación ${hab.numero} disponible.`);
        this.habitaciones.update((list) => list.filter((h) => h.habitacionId !== hab.habitacionId));
      },
      error: (err: { friendlyMessage?: string }) => {
        this.marcandoId.set(null);
        this.toastr.error(err.friendlyMessage ?? 'Error al actualizar el estado.');
      },
    });
  }
}
