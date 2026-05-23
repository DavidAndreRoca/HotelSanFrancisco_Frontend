import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { UiBadgeComponent } from '../../../shared/ui/badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiCardComponent } from '../../../shared/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/ui-skeleton.component';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { RoomTypeFormComponent } from '../components/room-type-form/room-type-form.component';
import { RoomTypesService } from '../services/room-types.service';
import { RoomType, RoomTypeCreatePayload } from '../models/room-type.model';

@Component({
  selector: 'app-room-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CurrencyPipe,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiSkeletonComponent,
    RoomTypeFormComponent,
  ],
  template: `
    <div class="mb-6 flex items-center gap-2 text-[13px] text-[var(--color-ink-muted)]">
      <a routerLink="/rooms" class="hover:text-[var(--color-primary-700)] hover:underline">Tipos de habitación</a>
      <span aria-hidden="true">/</span>
      <span class="text-[var(--color-ink-soft)] font-medium">Detalle</span>
    </div>

    @if (loading()) {
      <ui-card>
        <ui-skeleton height="1.6rem" width="40%" />
        <div class="mt-4 grid sm:grid-cols-3 gap-4">
          <ui-skeleton height="4rem" />
          <ui-skeleton height="4rem" />
          <ui-skeleton height="4rem" />
        </div>
        <ui-skeleton height="6rem" />
      </ui-card>
    } @else if (room(); as r) {
      <ui-card>
        <header class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-bold tracking-tight">{{ r.nombre }}</h1>
              <ui-badge [tone]="r.estado === 'ACTIVO' ? 'success' : 'neutral'">
                {{ r.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
              </ui-badge>
            </div>
            <p class="text-[14px] text-[var(--color-ink-muted)]">
              Identificador interno: #{{ r.tipoHabitacionId }}
            </p>
          </div>
          <div class="flex gap-2">
            <ui-button variant="outline" (click)="onToggleEstado(r)">
              {{ r.estado === 'ACTIVO' ? 'Desactivar' : 'Activar' }}
            </ui-button>
            <ui-button (click)="onEdit()">Editar</ui-button>
          </div>
        </header>

        <div class="grid sm:grid-cols-3 gap-4 mb-8">
          <div class="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border-soft)]">
            <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">
              Precio por noche
            </p>
            <p class="mt-1 text-2xl font-bold text-[var(--color-primary-700)]">
              {{ r.precioBase | currency:'PEN':'symbol-narrow':'1.2-2' }}
            </p>
          </div>
          <div class="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border-soft)]">
            <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">
              Capacidad máxima
            </p>
            <p class="mt-1 text-2xl font-bold">
              {{ r.capacidadMaxima }} {{ r.capacidadMaxima === 1 ? 'huésped' : 'huéspedes' }}
            </p>
          </div>
          <div class="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border-soft)]">
            <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">
              Estado comercial
            </p>
            <p class="mt-1 text-2xl font-bold">
              {{ r.estado === 'ACTIVO' ? 'Disponible' : 'Pausado' }}
            </p>
          </div>
        </div>

        <section>
          <h2 class="text-base font-semibold mb-2">Descripción</h2>
          <p class="text-[15px] leading-relaxed text-[var(--color-ink-soft)] whitespace-pre-line">
            {{ r.descripcion || 'Sin descripción registrada.' }}
          </p>
        </section>

        <footer class="mt-8 pt-6 border-t border-[var(--color-border-soft)] flex flex-wrap items-center justify-between gap-3">
          <a routerLink="/rooms" class="text-[13px] font-medium text-[var(--color-primary-700)] hover:underline">
            ← Volver al listado
          </a>
          <ui-button variant="danger" (click)="onDelete(r)">Eliminar</ui-button>
        </footer>
      </ui-card>
    } @else {
      <ui-card>
        <p class="text-[var(--color-ink-muted)]">No se encontró el tipo de habitación solicitado.</p>
        <div class="mt-4">
          <a routerLink="/rooms">
            <ui-button variant="outline">Volver al listado</ui-button>
          </a>
        </div>
      </ui-card>
    }

    @if (formOpen()) {
      <app-room-type-form
        #formCmp
        [open]="formOpen()"
        [editing]="room()"
        (closed)="formOpen.set(false)"
        (submitted)="onSubmit($event)" />
    }
  `,
})
export class RoomDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(RoomTypesService);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);

  @ViewChild('formCmp') private formCmp?: RoomTypeFormComponent;

  readonly room = signal<RoomType | null>(null);
  readonly loading = signal(true);
  readonly formOpen = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.router.navigate(['/rooms']);
      return;
    }
    this.fetch(id);
  }

  fetch(id: number): void {
    this.loading.set(true);
    this.service.findById(id).subscribe({
      next: (r) => {
        this.room.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.room.set(null);
        this.loading.set(false);
      },
    });
  }

  onEdit(): void {
    this.formOpen.set(true);
  }

  onSubmit(payload: RoomTypeCreatePayload): void {
    const current = this.room();
    if (!current) return;
    this.service.update(current.tipoHabitacionId, payload).subscribe({
      next: (updated) => {
        this.room.set(updated);
        this.formCmp?.finishSubmit();
        this.formOpen.set(false);
        this.toastr.success('Cambios guardados.');
      },
      error: (err: { friendlyMessage?: string }) => {
        this.formCmp?.finishSubmit();
        this.toastr.error(err.friendlyMessage ?? 'No se pudo guardar.', 'Error');
      },
    });
  }

  onToggleEstado(r: RoomType): void {
    const nextEstado = r.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.service.update(r.tipoHabitacionId, { estado: nextEstado }).subscribe({
      next: (updated) => {
        this.room.set(updated);
        this.toastr.success(`Tipo ${nextEstado === 'ACTIVO' ? 'activado' : 'desactivado'}.`);
      },
      error: (err: { friendlyMessage?: string }) =>
        this.toastr.error(err.friendlyMessage ?? 'No se pudo cambiar el estado.', 'Error'),
    });
  }

  async onDelete(r: RoomType): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Eliminar tipo',
      message: `¿Eliminar "${r.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    this.service.delete(r.tipoHabitacionId).subscribe({
      next: () => {
        this.toastr.success('Tipo eliminado.');
        this.router.navigate(['/rooms']);
      },
      error: (err: { friendlyMessage?: string }) =>
        this.toastr.error(err.friendlyMessage ?? 'No se pudo eliminar.', 'Error'),
    });
  }
}
