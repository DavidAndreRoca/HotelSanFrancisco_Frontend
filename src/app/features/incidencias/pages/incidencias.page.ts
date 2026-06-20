import { ChangeDetectionStrategy, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiCardComponent } from '../../../shared/ui/card/ui-card.component';
import { UiBadgeComponent } from '../../../shared/ui/badge/ui-badge.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/ui-skeleton.component';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { IncidenciaFiltersComponent } from '../components/incidencia-filters/incidencia-filters.component';
import { IncidenciaFormComponent } from '../components/incidencia-form/incidencia-form.component';
import { IncidenciaService } from '../services/incidencia.service';
import {
  CreateIncidenciaPayload,
  EstadoIncidencia,
  Incidencia,
  PrioridadIncidencia,
} from '../models/incidencia.model';
import {
  DEFAULT_INCIDENCIA_FILTERS,
  ESTADO_INCIDENCIA_CONFIG,
  IncidenciaStats,
  IncidenciaUiFilters,
  PRIORIDAD_INCIDENCIA_CONFIG,
} from '../models/incidencia-ui.model';

@Component({
  selector: 'app-incidencias-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    UiButtonComponent,
    UiCardComponent,
    UiBadgeComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    IncidenciaFiltersComponent,
    IncidenciaFormComponent,
  ],
  template: `
    <header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--color-primary-700)] font-semibold mb-1">
          Operaciones
        </p>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Incidencias</h1>
        <p class="text-[15px] text-[var(--color-ink-muted)] mt-1">
          Reporta y da seguimiento a problemas de habitaciones y áreas comunes.
        </p>
      </div>
      <ui-button (click)="onCreate()">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" d="M12 5v14M5 12h14"/>
        </svg>
        Reportar incidencia
      </ui-button>
    </header>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <ui-card padding="sm">
        <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Total</p>
        <p class="mt-2 text-2xl font-bold">{{ stats().total }}</p>
      </ui-card>
      <ui-card padding="sm">
        <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Abiertas</p>
        <p class="mt-2 text-2xl font-bold text-[var(--color-warning-500)]">{{ stats().abiertas }}</p>
      </ui-card>
      <ui-card padding="sm">
        <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">En proceso</p>
        <p class="mt-2 text-2xl font-bold text-[var(--color-info-500)]">{{ stats().enProceso }}</p>
      </ui-card>
      <ui-card padding="sm">
        <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Alta prioridad sin cerrar</p>
        <p class="mt-2 text-2xl font-bold text-[var(--color-danger-500)]">{{ stats().altaPrioridad }}</p>
      </ui-card>
    </div>

    <div class="mb-5">
      <app-incidencia-filters
        [initial]="filters()"
        (changed)="onFiltersChanged($event)" />
    </div>

    @if (service.loading()) {
      <div class="space-y-3">
        @for (i of [1,2,3,4]; track i) {
          <ui-skeleton height="5rem" radius="0.75rem" />
        }
      </div>
    } @else if (visible().length === 0) {
      <ui-empty-state
        icon="⚠"
        title="No se encontraron incidencias"
        description="Ajusta los filtros o reporta una nueva incidencia.">
        <ui-button (click)="onCreate()">Reportar primera incidencia</ui-button>
      </ui-empty-state>
    } @else {
      <div class="space-y-3">
        @for (inc of visible(); track inc.incidenciaId) {
          <ui-card padding="sm">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span [class]="'w-2 h-2 rounded-full shrink-0 ' + prioridadCfg(inc).dotColor"></span>
                  <p class="text-[15px] font-semibold text-[var(--color-ink)]">{{ inc.descripcion }}</p>
                </div>

                <div class="flex items-center gap-2 flex-wrap mt-2">
                  <ui-badge [tone]="estadoCfg(inc).badgeTone">{{ estadoCfg(inc).label }}</ui-badge>
                  <ui-badge [tone]="prioridadCfg(inc).badgeTone">Prioridad {{ prioridadCfg(inc).label }}</ui-badge>
                  @if (inc.reservaHabitacionId) {
                    <span class="text-[12px] px-2 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-soft)] text-[var(--color-ink-soft)]">
                      Hab. {{ inc.reservaHabitacionId }}
                    </span>
                  }
                </div>

                <p class="text-[12px] text-[var(--color-ink-muted)] mt-2">
                  Reportado por {{ inc.usuarioNombre || 'Usuario #' + inc.usuarioId }}
                  · {{ inc.fechaReporte | date:'dd MMM yyyy' }}
                  @if (inc.fechaResolucion) {
                    · Resuelto {{ inc.fechaResolucion | date:'dd MMM yyyy' }}
                  }
                </p>

                @if (inc.solucion) {
                  <p class="text-[13px] text-[var(--color-ink-soft)] mt-2 bg-[var(--color-surface)] rounded-lg px-3 py-2">
                    <span class="font-medium">Solución:</span> {{ inc.solucion }}
                  </p>
                }
              </div>

              <div class="flex sm:flex-col items-end gap-2 shrink-0">
                <select
                  class="h-9 px-2.5 rounded-lg border border-[var(--color-border-soft)] bg-white text-[12px] focus:outline-none focus:border-[var(--color-primary-500)] cursor-pointer"
                  [value]="inc.estado"
                  (change)="onCambiarEstado(inc, $any($event.target).value)"
                  [attr.aria-label]="'Cambiar estado de ' + inc.descripcion">
                  <option value="ABIERTA">Abierta</option>
                  <option value="EN_PROCESO">En proceso</option>
                  <option value="RESUELTA">Resuelta</option>
                  <option value="CERRADA">Cerrada</option>
                </select>

                <div class="flex gap-2">
                  <button
                    type="button"
                    class="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[var(--color-border-soft)] hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-700)] transition-colors"
                    (click)="onEdit(inc)">
                    Editar
                  </button>
                  <button
                    type="button"
                    class="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[var(--color-border-soft)] hover:border-[var(--color-danger-500)] hover:text-[var(--color-danger-500)] transition-colors"
                    (click)="onDelete(inc)">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </ui-card>
        }
      </div>
      <p class="mt-3 text-[12px] text-[var(--color-ink-muted)]">
        Mostrando {{ visible().length }} de {{ service.incidencias().length }} incidencias
      </p>
    }

    @if (formOpen()) {
      <app-incidencia-form
        #formCmp
        [open]="formOpen()"
        [editing]="editingIncidencia()"
        [currentUserId]="currentUserId()"
        (closed)="closeForm()"
        (submitted)="onSubmit($event)"
        (updated)="onUpdate($event)" />
    }
  `,
})
export class IncidenciasPage implements OnInit {
  protected readonly service = inject(IncidenciaService);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly auth = inject(AuthStore);

  @ViewChild('formCmp') private formCmp?: IncidenciaFormComponent;

  readonly filters = signal<IncidenciaUiFilters>({ ...DEFAULT_INCIDENCIA_FILTERS });
  readonly formOpen = signal(false);
  readonly editingIncidencia = signal<Incidencia | null>(null);

  readonly currentUserId = computed(() => this.auth.user()?.usuarioId ?? 1);

  readonly stats = computed<IncidenciaStats>(() => {
    const all = this.service.incidencias();
    return {
      total: all.length,
      abiertas: all.filter((i) => i.estado === 'ABIERTA').length,
      enProceso: all.filter((i) => i.estado === 'EN_PROCESO').length,
      resueltas: all.filter((i) => i.estado === 'RESUELTA' || i.estado === 'CERRADA').length,
      altaPrioridad: all.filter(
        (i) => i.prioridad === 'ALTA' && i.estado !== 'CERRADA' && i.estado !== 'RESUELTA',
      ).length,
    };
  });

  readonly visible = computed(() => {
    const f = this.filters();
    return this.service.incidencias().filter((inc) => {
      if (f.estado && inc.estado !== f.estado) return false;
      if (f.prioridad && inc.prioridad !== f.prioridad) return false;
      if (f.search) {
        const q = f.search.toLowerCase();
        const hay =
          inc.descripcion.toLowerCase().includes(q) ||
          (inc.usuarioNombre?.toLowerCase().includes(q) ?? false);
        if (!hay) return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.service.load();
  }

  estadoCfg(inc: Incidencia) {
    return ESTADO_INCIDENCIA_CONFIG[inc.estado];
  }

  prioridadCfg(inc: Incidencia) {
    return PRIORIDAD_INCIDENCIA_CONFIG[inc.prioridad];
  }

  onFiltersChanged(patch: Partial<IncidenciaUiFilters>): void {
    this.filters.update((f) => ({ ...f, ...patch }));
  }

  onCreate(): void {
    this.editingIncidencia.set(null);
    this.formOpen.set(true);
  }

  onEdit(inc: Incidencia): void {
    this.editingIncidencia.set(inc);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingIncidencia.set(null);
  }

  onSubmit(payload: CreateIncidenciaPayload): void {
    this.service.create(payload).subscribe({
      next: () => {
        this.formCmp?.finishSubmit();
        this.toastr.success('Incidencia reportada correctamente.');
        this.closeForm();
      },
      error: (err: { friendlyMessage?: string }) => {
        this.formCmp?.finishSubmit();
        this.toastr.error(err.friendlyMessage ?? 'No se pudo reportar la incidencia.', 'Error');
      },
    });
  }

  onUpdate(changes: { descripcion: string; prioridad: PrioridadIncidencia; solucion: string | null }): void {
    const editing = this.editingIncidencia();
    if (!editing) return;

    this.service
      .update(editing.incidenciaId, {
        descripcion: changes.descripcion,
        prioridad: changes.prioridad,
        solucion: changes.solucion ?? undefined,
      })
      .subscribe({
        next: () => {
          this.formCmp?.finishSubmit();
          this.toastr.success('Incidencia actualizada.');
          this.closeForm();
        },
        error: (err: { friendlyMessage?: string }) => {
          this.formCmp?.finishSubmit();
          this.toastr.error(err.friendlyMessage ?? 'No se pudo actualizar la incidencia.', 'Error');
        },
      });
  }

  onCambiarEstado(inc: Incidencia, nuevoEstado: EstadoIncidencia): void {
    if (nuevoEstado === inc.estado) return;

    this.service.cambiarEstado(inc.incidenciaId, { nuevoEstado }).subscribe({
      next: () => this.toastr.success(`Incidencia marcada como ${this.estadoLabel(nuevoEstado)}.`),
      error: (err: { friendlyMessage?: string }) =>
        this.toastr.error(err.friendlyMessage ?? 'No se pudo cambiar el estado.', 'Error'),
    });
  }

  private estadoLabel(estado: EstadoIncidencia): string {
    return ESTADO_INCIDENCIA_CONFIG[estado].label.toLowerCase();
  }

  async onDelete(inc: Incidencia): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Eliminar incidencia',
      message: `¿Eliminar el reporte "${inc.descripcion}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;

    this.service.delete(inc.incidenciaId).subscribe({
      next: () => this.toastr.success('Incidencia eliminada correctamente.'),
      error: (err: { friendlyMessage?: string }) =>
        this.toastr.error(err.friendlyMessage ?? 'No se pudo eliminar la incidencia.', 'Error'),
    });
  }
}
