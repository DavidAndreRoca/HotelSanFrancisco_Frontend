import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { IncidenciaService } from '../../../incidencias/services/incidencia.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiSkeletonComponent } from '../../../../shared/ui/skeleton/ui-skeleton.component';
import { Incidencia, PrioridadIncidencia } from '../../../incidencias/models/incidencia.model';

const PRIORIDAD_CONFIG: Record<PrioridadIncidencia, { label: string; bg: string; text: string }> = {
  ALTA: { label: 'Alta', bg: 'bg-[var(--color-danger-500)]/12', text: 'text-[var(--color-danger-700)]' },
  MEDIA: { label: 'Media', bg: 'bg-[var(--color-warning-500)]/12', text: 'text-[var(--color-warning-700)]' },
  BAJA: { label: 'Baja', bg: 'bg-[var(--color-success-500)]/12', text: 'text-[var(--color-success-700)]' },
};

const ESTADO_CONFIG: Record<string, { label: string; dot: string }> = {
  ABIERTA: { label: 'Abierta', dot: 'bg-[var(--color-danger-500)]' },
  EN_PROCESO: { label: 'En proceso', dot: 'bg-[var(--color-warning-500)]' },
  RESUELTA: { label: 'Resuelta', dot: 'bg-[var(--color-success-500)]' },
  CERRADA: { label: 'Cerrada', dot: 'bg-[var(--color-ink-muted)]' },
};

@Component({
  selector: 'app-mantenimiento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, SlicePipe, UiButtonComponent, UiSkeletonComponent],
  template: `
    <div>
      <div class="mb-6">
        <a routerLink="/habitaciones" class="text-[13px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition">
          ← Volver al panel
        </a>
        <h1 class="text-2xl font-bold tracking-tight mt-2">Mantenimiento e Incidencias</h1>
        <p class="text-[14px] text-[var(--color-ink-muted)] mt-1">
          Reporte y gestione incidencias operativas. Las de prioridad ALTA bloquean la habitación automáticamente.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

        <!-- Formulario nuevo reporte -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5 shadow-[var(--shadow-card)]">
            <h2 class="text-[15px] font-bold mb-4 pb-3 border-b border-[var(--color-border-soft)]">
              Nueva incidencia
            </h2>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="space-y-4">

              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Descripción <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <textarea
                  formControlName="descripcion"
                  rows="3"
                  placeholder="Describa la incidencia con detalle..."
                  class="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border-soft)] bg-white text-[14px] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 transition resize-none"
                  [class.border-[var(--color-danger-500)]]="showError('descripcion')"></textarea>
                @if (showError('descripcion')) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1">La descripción es obligatoria.</p>
                }
              </div>

              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Prioridad <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <select
                  formControlName="prioridad"
                  class="w-full h-10 px-3.5 rounded-lg border border-[var(--color-border-soft)] bg-white text-[14px] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 transition">
                  <option value="">Seleccionar...</option>
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta — bloquea la habitación</option>
                </select>
                @if (showError('prioridad')) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1">Seleccione una prioridad.</p>
                }
                @if (form.get('prioridad')?.value === 'ALTA') {
                  <p class="text-[12px] text-[var(--color-danger-600)] mt-1 font-medium">
                    La habitación pasará a estado MANTENIMIENTO de inmediato.
                  </p>
                }
              </div>

              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  ID de reserva-habitación (opcional)
                </label>
                <input
                  type="number"
                  formControlName="reservaHabitacionId"
                  placeholder="Ej. 7"
                  class="w-full h-10 px-3.5 rounded-lg border border-[var(--color-border-soft)] bg-white text-[14px] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 transition" />
                <p class="text-[12px] text-[var(--color-ink-muted)] mt-1">
                  Vincule la incidencia a una habitación específica.
                </p>
              </div>

              <ui-button type="submit" [block]="true" [loading]="submitting()" [disabled]="form.invalid">
                Registrar incidencia
              </ui-button>
            </form>
          </div>
        </div>

        <!-- Listado de incidencias -->
        <div class="lg:col-span-3">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-[15px] font-bold">Historial reciente</h2>
            <div class="flex items-center gap-2">
              <select
                [value]="filtroEstado()"
                (change)="filtroEstado.set($any($event.target).value)"
                class="h-8 px-2.5 rounded-lg border border-[var(--color-border-soft)] bg-white text-[13px] focus:outline-none focus:border-[var(--color-primary-500)] transition">
                <option value="">Todos los estados</option>
                <option value="ABIERTA">Abierta</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="RESUELTA">Resuelta</option>
                <option value="CERRADA">Cerrada</option>
              </select>
              <ui-button variant="ghost" size="sm" (click)="loadIncidencias()">Refrescar</ui-button>
            </div>
          </div>

          @if (incidenciaService.loading()) {
            <div class="space-y-3">
              @for (i of [1,2,3,4]; track i) {
                <ui-skeleton height="5rem" />
              }
            </div>
          } @else if (incidenciasFiltradas().length === 0) {
            <div class="flex flex-col items-center justify-center py-16 text-[var(--color-ink-muted)] border border-dashed border-[var(--color-border-soft)] rounded-xl">
              <p class="text-[14px] font-medium">Sin incidencias registradas.</p>
              <p class="text-[13px] mt-1">Use el formulario para reportar una nueva incidencia.</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (inc of incidenciasFiltradas(); track inc.incidenciaId) {
                <div class="bg-white rounded-xl border border-[var(--color-border-soft)] p-4 shadow-[var(--shadow-card)]">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <!-- Estado -->
                        <span class="flex items-center gap-1 text-[12px] text-[var(--color-ink-muted)]">
                          <span [class]="'w-1.5 h-1.5 rounded-full ' + estadoConfig(inc.estado).dot"></span>
                          {{ estadoConfig(inc.estado).label }}
                        </span>
                        <!-- Prioridad -->
                        <span [class]="'text-[11px] font-semibold px-2 py-0.5 rounded-full ' + prioridadConfig(inc.prioridad).bg + ' ' + prioridadConfig(inc.prioridad).text">
                          {{ prioridadConfig(inc.prioridad).label }}
                        </span>
                        @if (inc.reservaHabitacionId) {
                          <span class="text-[11px] text-[var(--color-ink-muted)]">
                            RH #{{ inc.reservaHabitacionId }}
                          </span>
                        }
                      </div>
                      <p class="text-[14px] text-[var(--color-ink)] mt-1.5 line-clamp-2">{{ inc.descripcion }}</p>
                      @if (inc.solucion) {
                        <p class="text-[12px] text-[var(--color-ink-muted)] mt-1 italic">Solución: {{ inc.solucion }}</p>
                      }
                      <p class="text-[11px] text-[var(--color-ink-muted)] mt-2">
                        Reportada el {{ inc.fechaReporte | slice:0:10 }}
                        @if (inc.usuarioNombre) { · {{ inc.usuarioNombre }} }
                      </p>
                    </div>

                    <!-- Cambio rápido de estado -->
                    @if (inc.estado !== 'CERRADA' && inc.estado !== 'RESUELTA') {
                      <div class="shrink-0">
                        <select
                          [value]="inc.estado"
                          (change)="cambiarEstado(inc, $any($event.target).value)"
                          class="h-8 px-2.5 rounded-lg border border-[var(--color-border-soft)] bg-white text-[12px] focus:outline-none focus:border-[var(--color-primary-500)] transition">
                          <option value="ABIERTA">Abierta</option>
                          <option value="EN_PROCESO">En proceso</option>
                          <option value="RESUELTA">Resuelta</option>
                          <option value="CERRADA">Cerrada</option>
                        </select>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class MantenimientoPage implements OnInit {
  protected readonly incidenciaService = inject(IncidenciaService);
  private readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  readonly submitting = signal(false);
  readonly filtroEstado = signal('');

  readonly form = this.fb.nonNullable.group({
    descripcion: ['', [Validators.required, Validators.minLength(5)]],
    prioridad: ['', Validators.required],
    reservaHabitacionId: [null as number | null],
  });

  readonly incidenciasFiltradas = computed(() => {
    const estado = this.filtroEstado();
    const all = this.incidenciaService.incidencias();
    return estado ? all.filter((i) => i.estado === estado) : all;
  });

  ngOnInit(): void {
    this.loadIncidencias();
  }

  loadIncidencias(): void {
    this.incidenciaService.load({}, 0, 50);
  }

  showError(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  prioridadConfig(p: PrioridadIncidencia) {
    return PRIORIDAD_CONFIG[p];
  }

  estadoConfig(e: string) {
    return ESTADO_CONFIG[e] ?? { label: e, dot: 'bg-[var(--color-ink-muted)]' };
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const usuarioId = this.authStore.user()?.usuarioId;
    if (!usuarioId) { this.toastr.error('Sesión no válida.'); return; }

    this.submitting.set(true);
    const v = this.form.getRawValue();

    this.incidenciaService.create({
      descripcion: v.descripcion,
      fechaReporte: new Date().toISOString().slice(0, 10),
      prioridad: v.prioridad as PrioridadIncidencia,
      usuarioId,
      reservaHabitacionId: v.reservaHabitacionId ?? undefined,
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastr.success('Incidencia registrada correctamente.');
        this.form.reset();
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.submitting.set(false);
        this.toastr.error(err.friendlyMessage ?? 'Error al registrar la incidencia.', 'Error');
      },
    });
  }

  cambiarEstado(inc: Incidencia, nuevoEstado: string): void {
    this.incidenciaService.cambiarEstado(inc.incidenciaId, { nuevoEstado: nuevoEstado as Incidencia['estado'] }).subscribe({
      next: () => this.toastr.success(`Estado actualizado a ${ESTADO_CONFIG[nuevoEstado]?.label ?? nuevoEstado}.`),
      error: (err: { friendlyMessage?: string }) =>
        this.toastr.error(err.friendlyMessage ?? 'Error al cambiar el estado.'),
    });
  }
}
