import { ChangeDetectionStrategy, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiCardComponent } from '../../../shared/ui/card/ui-card.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/ui-skeleton.component';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { RoomTypeCardComponent } from '../components/room-type-card/room-type-card.component';
import { RoomTypeFiltersComponent } from '../components/room-type-filters/room-type-filters.component';
import { RoomTypeFormComponent } from '../components/room-type-form/room-type-form.component';
import { RoomTypesService } from '../services/room-types.service';
import {
  DEFAULT_ROOM_TYPE_FILTERS,
  RoomType,
  RoomTypeCreatePayload,
  RoomTypeFilters,
} from '../models/room-type.model';

@Component({
  selector: 'app-rooms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    UiButtonComponent,
    UiCardComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    RoomTypeCardComponent,
    RoomTypeFiltersComponent,
    RoomTypeFormComponent,
  ],
  template: `
    <header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--color-primary-700)] font-semibold mb-1">
          Recepción
        </p>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Tipos de habitación</h1>
        <p class="text-[15px] text-[var(--color-ink-muted)] mt-1">
          Gestiona el catálogo de habitaciones que se ofrecen a tus huéspedes.
        </p>
      </div>
      <ui-button (click)="onCreate()">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" d="M12 5v14M5 12h14"/>
        </svg>
        Nuevo tipo
      </ui-button>
    </header>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <ui-card padding="sm">
        <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Total tipos</p>
        <p class="mt-2 text-2xl font-bold">{{ totalRecords() }}</p>
      </ui-card>
      <ui-card padding="sm">
        <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Activos</p>
        <p class="mt-2 text-2xl font-bold text-[var(--color-success-500)]">{{ service.totalActive() }}</p>
      </ui-card>
      <ui-card padding="sm">
        <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Capacidad activa</p>
        <p class="mt-2 text-2xl font-bold text-[var(--color-primary-700)]">{{ service.totalCapacity() }}</p>
      </ui-card>
      <ui-card padding="sm">
        <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Precio promedio</p>
        <p class="mt-2 text-2xl font-bold">
          {{ service.averagePrice() | currency:'PEN':'symbol-narrow':'1.2-2' }}
        </p>
      </ui-card>
    </div>

    <div class="mb-5">
      <app-room-type-filters
        [initial]="filters()"
        (changed)="onFiltersChanged($event)" />
    </div>

    @if (service.loading()) {
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        @for (i of [1,2,3,4,5,6]; track i) {
          <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5 space-y-3">
            <ui-skeleton height="8rem" radius="0.75rem" />
            <ui-skeleton height="1.2rem" width="70%" />
            <ui-skeleton height="0.9rem" />
            <ui-skeleton height="0.9rem" width="50%" />
          </div>
        }
      </div>
    } @else if (visible().length === 0) {
      <ui-empty-state
        icon="◇"
        title="Aún no hay tipos de habitación"
        description="Crea el primer tipo para comenzar a recibir reservas.">
        <ui-button (click)="onCreate()">Crear primer tipo</ui-button>
      </ui-empty-state>
    } @else {
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        @for (room of visible(); track room.tipoHabitacionId) {
          <app-room-type-card
            [room]="room"
            (view)="onView($event)"
            (edit)="onEdit($event)"
            (remove)="onDelete($event)"
            (toggleEstado)="onToggleEstado($event)" />
        }
      </div>

      @if (service.page(); as pg) {
        <nav
          class="mt-6 flex items-center justify-between text-[13px] text-[var(--color-ink-soft)]"
          aria-label="Paginación">
          <span>
            Mostrando {{ visible().length }} de {{ pg.totalElements }} (página {{ pg.page + 1 }} de {{ pg.totalPages || 1 }})
          </span>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-3 py-2 rounded-lg border border-[var(--color-border-soft)] hover:border-[var(--color-primary-500)] disabled:opacity-40 disabled:cursor-not-allowed"
              [disabled]="pg.first"
              (click)="changePage(pg.page - 1)">Anterior</button>
            <button
              type="button"
              class="px-3 py-2 rounded-lg border border-[var(--color-border-soft)] hover:border-[var(--color-primary-500)] disabled:opacity-40 disabled:cursor-not-allowed"
              [disabled]="pg.last"
              (click)="changePage(pg.page + 1)">Siguiente</button>
          </div>
        </nav>
      }
    }

    @if (formOpen()) {
      <app-room-type-form
        #formCmp
        [open]="formOpen()"
        [editing]="editingRoom()"
        (closed)="closeForm()"
        (submitted)="onSubmit($event)" />
    }
  `,
})
export class RoomsListPage implements OnInit {
  protected readonly service = inject(RoomTypesService);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly router = inject(Router);

  @ViewChild('formCmp') private formCmp?: RoomTypeFormComponent;

  readonly filters = signal<RoomTypeFilters>({ ...DEFAULT_ROOM_TYPE_FILTERS });
  readonly formOpen = signal(false);
  readonly editingRoom = signal<RoomType | null>(null);

  readonly totalRecords = computed(
    () => this.service.page()?.totalElements ?? this.service.items().length,
  );

  readonly visible = computed(() => {
    const f = this.filters();
    return this.service.items().filter((r) => {
      if (f.estado && r.estado !== f.estado) return false;
      if (f.search) {
        const q = f.search.toLowerCase();
        const hay =
          r.nombre.toLowerCase().includes(q) ||
          (r.descripcion?.toLowerCase().includes(q) ?? false);
        if (!hay) return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    const f = this.filters();
    this.service.load({ page: f.page, size: f.size, sort: f.sort });
  }

  onFiltersChanged(patch: Partial<RoomTypeFilters>): void {
    this.filters.update((f) => ({ ...f, ...patch }));
    // search y estado se resuelven client-side en visible(); solo recargamos
    // del backend cuando cambia el orden o la página explícitamente.
    if (patch.sort !== undefined || (patch.page !== undefined && patch.search === undefined && patch.estado === undefined)) {
      this.fetch();
    }
  }

  changePage(page: number): void {
    this.filters.update((f) => ({ ...f, page }));
    this.fetch();
  }

  onCreate(): void {
    this.editingRoom.set(null);
    this.formOpen.set(true);
  }

  onEdit(room: RoomType): void {
    this.editingRoom.set(room);
    this.formOpen.set(true);
  }

  onView(room: RoomType): void {
    this.router.navigate(['/rooms', room.tipoHabitacionId]);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingRoom.set(null);
  }

  onSubmit(payload: RoomTypeCreatePayload): void {
    const editing = this.editingRoom();
    const op$ = editing
      ? this.service.update(editing.tipoHabitacionId, payload)
      : this.service.create(payload);

    op$.subscribe({
      next: () => {
        this.formCmp?.finishSubmit();
        this.toastr.success(
          editing ? 'Tipo de habitación actualizado.' : 'Tipo de habitación creado.',
        );
        this.closeForm();
        this.fetch();
      },
      error: (err: { friendlyMessage?: string }) => {
        this.formCmp?.finishSubmit();
        this.toastr.error(err.friendlyMessage ?? 'No se pudo guardar.', 'Error');
      },
    });
  }

  async onDelete(room: RoomType): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Eliminar tipo de habitación',
      message: `¿Eliminar "${room.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;

    this.service.delete(room.tipoHabitacionId).subscribe({
      next: () => {
        this.toastr.success('Tipo eliminado correctamente.');
        this.fetch();
      },
      error: (err: { friendlyMessage?: string }) => {
        this.toastr.error(
          err.friendlyMessage ?? 'No se pudo eliminar. Puede tener reservas activas.',
          'Error',
        );
      },
    });
  }

  onToggleEstado(room: RoomType): void {
    const nextEstado = room.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.service.update(room.tipoHabitacionId, { estado: nextEstado }).subscribe({
      next: () => this.toastr.success(`"${room.nombre}" ${nextEstado === 'ACTIVO' ? 'activado' : 'desactivado'}.`),
      error: (err: { friendlyMessage?: string }) =>
        this.toastr.error(err.friendlyMessage ?? 'No se pudo cambiar el estado.', 'Error'),
    });
  }
}
