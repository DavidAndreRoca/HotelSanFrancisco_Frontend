import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiModalComponent } from '../../../../shared/ui/modal/ui-modal.component';
import {
  EstanciaLookupService,
  HabitacionOcupada,
} from '../../../../core/estancias/estancia-lookup.service';
import { CreateIncidenciaPayload, Incidencia, PrioridadIncidencia } from '../../models/incidencia.model';

@Component({
  selector: 'app-incidencia-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, UiButtonComponent, UiModalComponent],
  template: `
    <ui-modal
      [open]="open()"
      [title]="title()"
      subtitle="Registra el problema detectado para que el equipo lo atienda."
      size="lg"
      (closed)="closed.emit()">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate id="incidencia-form" class="space-y-4">
        <div>
          <label for="descripcion" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
            Descripción <span class="text-[var(--color-danger-500)]">*</span>
          </label>
          <textarea
            id="descripcion"
            formControlName="descripcion"
            rows="3"
            maxlength="500"
            [class]="inputCls(form.controls.descripcion)"
            placeholder="Ej. Aire acondicionado no enfría en habitación 304"></textarea>
          @if (errMsg('descripcion'); as msg) {
            <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
          }
          <p class="text-[11px] text-[var(--color-ink-muted)] mt-1 text-right">
            {{ descripcionLength() }}/500
          </p>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label for="prioridad" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Prioridad <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <select id="prioridad" formControlName="prioridad" [class]="inputCls(form.controls.prioridad)">
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>

          <div>
            <label for="reservaHabitacionId" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Habitación
            </label>
            <select
              id="reservaHabitacionId"
              formControlName="reservaHabitacionId"
              [class]="inputCls(form.controls.reservaHabitacionId)">
              <option [ngValue]="null">Área común / sin habitación</option>
              @for (h of habitaciones(); track h.reservaHabitacionId) {
                <option [ngValue]="h.reservaHabitacionId">
                  Hab. {{ h.habitacionNumero }} — {{ h.codReserva }} · {{ h.huespedNombre }}
                </option>
              }
            </select>
            @if (cargandoHabitaciones()) {
              <p class="text-[11px] text-[var(--color-ink-muted)] mt-1">Cargando habitaciones ocupadas…</p>
            } @else if (habitaciones().length === 0) {
              <p class="text-[11px] text-[var(--color-ink-muted)] mt-1">
                No hay habitaciones con huéspedes en este momento.
              </p>
            }
          </div>
        </div>

        @if (editing()) {
          <div class="pt-2 border-t border-[var(--color-border-soft)]">
            <label for="solucion" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Solución / notas de seguimiento
            </label>
            <textarea
              id="solucion"
              formControlName="solucion"
              rows="2"
              maxlength="500"
              [class]="inputCls(form.controls.solucion)"
              placeholder="Describe cómo se resolvió o el avance actual..."></textarea>
          </div>
        }
      </form>

      <ng-container modal-footer>
        <ui-button variant="ghost" (click)="closed.emit()" [disabled]="submitting()">
          Cancelar
        </ui-button>
        <ui-button
          type="button"
          variant="primary"
          [loading]="submitting()"
          [disabled]="form.invalid"
          (click)="submit()">
          {{ editing() ? 'Guardar cambios' : 'Reportar incidencia' }}
        </ui-button>
      </ng-container>
    </ui-modal>
  `,
})
export class IncidenciaFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly estanciaLookup = inject(EstanciaLookupService);

  /** Habitaciones ocupadas (reservas CHECK_IN) para el selector. */
  readonly habitacionesOcupadas = signal<HabitacionOcupada[]>([]);
  readonly cargandoHabitaciones = signal(true);

  /**
   * Opciones del selector. Al editar, si el id guardado ya no está en las
   * ocupadas (p. ej. la reserva hizo check-out), se agrega como opción
   * histórica para no romper la carga del registro.
   */
  readonly habitaciones = computed<HabitacionOcupada[]>(() => {
    const base = this.habitacionesOcupadas();
    const edit = this.editing();
    if (
      edit?.reservaHabitacionId != null &&
      !base.some((h) => h.reservaHabitacionId === edit.reservaHabitacionId)
    ) {
      return [
        {
          reservaHabitacionId: edit.reservaHabitacionId,
          habitacionNumero: `RH #${edit.reservaHabitacionId}`,
          codReserva: 'registro anterior',
          huespedNombre: '—',
        },
        ...base,
      ];
    }
    return base;
  });

  readonly open = input.required<boolean>();
  readonly editing = input<Incidencia | null>(null);
  readonly currentUserId = input<number>(1);
  readonly submitting = signal(false);

  readonly closed = output<void>();
  readonly submitted = output<CreateIncidenciaPayload>();
  readonly updated = output<{ descripcion: string; prioridad: PrioridadIncidencia; solucion: string | null }>();

  readonly form = this.fb.nonNullable.group({
    descripcion: ['', [Validators.required, Validators.maxLength(500)]],
    prioridad: ['MEDIA' as PrioridadIncidencia, [Validators.required]],
    reservaHabitacionId: [null as number | null],
    solucion: [''],
  });

  readonly title = computed(() => (this.editing() ? 'Editar incidencia' : 'Reportar incidencia'));

  readonly descripcionLength = computed(() => this.form.controls.descripcion.value?.length ?? 0);

  ngOnInit(): void {
    this.applyEditing();
    this.estanciaLookup
      .buscarHabitacionesOcupadas()
      .pipe(catchError(() => of([] as HabitacionOcupada[])))
      .subscribe((hs) => {
        this.habitacionesOcupadas.set(hs);
        this.cargandoHabitaciones.set(false);
      });
  }

  applyEditing(): void {
    const edit = this.editing();
    if (edit) {
      this.form.patchValue({
        descripcion: edit.descripcion,
        prioridad: edit.prioridad,
        reservaHabitacionId: edit.reservaHabitacionId,
        solucion: edit.solucion ?? '',
      });
    } else {
      this.form.reset({
        descripcion: '',
        prioridad: 'MEDIA',
        reservaHabitacionId: null,
        solucion: '',
      });
    }
  }

  errMsg(field: keyof typeof this.form.controls): string | null {
    const c = this.form.controls[field];
    if (!c.invalid || (!c.touched && !c.dirty)) return null;
    if (c.hasError('required')) return 'Obligatorio.';
    if (c.hasError('maxlength')) return 'Texto demasiado largo.';
    return 'Inválido.';
  }

  inputCls(control: { invalid: boolean; touched: boolean; dirty: boolean }, extra = ''): string {
    const base =
      'w-full px-3.5 py-2.5 rounded-lg border bg-white text-[15px] focus:outline-none transition-all mt-1.5 resize-y';
    const invalid = control.invalid && (control.touched || control.dirty);
    const tone = invalid
      ? 'border-[var(--color-danger-500)] focus:ring-2 focus:ring-[var(--color-danger-500)]/30'
      : 'border-[var(--color-border-soft)] focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25';
    return `${base} ${tone} ${extra}`;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();

    // Solo se aceptan ids provenientes del selector (o ninguno).
    if (
      v.reservaHabitacionId != null &&
      !this.habitaciones().some((h) => h.reservaHabitacionId === v.reservaHabitacionId)
    ) {
      this.form.controls.reservaHabitacionId.setValue(null);
      return;
    }

    if (this.editing()) {
      this.submitting.set(true);
      this.updated.emit({
        descripcion: v.descripcion.trim(),
        prioridad: v.prioridad,
        solucion: v.solucion?.trim() || null,
      });
      return;
    }

    const payload: CreateIncidenciaPayload = {
      descripcion: v.descripcion.trim(),
      prioridad: v.prioridad,
      usuarioId: this.currentUserId(),
      reservaHabitacionId: v.reservaHabitacionId ?? undefined,
    };
    this.submitting.set(true);
    this.submitted.emit(payload);
  }

  finishSubmit(): void {
    this.submitting.set(false);
  }
}
