import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiModalComponent } from '../../../../shared/ui/modal/ui-modal.component';
import { EstadoActivo, RoomType, RoomTypeCreatePayload } from '../../models/room-type.model';

@Component({
  selector: 'app-room-type-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, UiButtonComponent, UiModalComponent],
  template: `
    <ui-modal
      [open]="open()"
      [title]="title()"
      [subtitle]="'Define la categoría comercial. El precio aplica por noche.'"
      size="lg"
      (closed)="closed.emit()">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate id="room-type-form" class="space-y-4">
        <div>
          <label for="nombre" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
            Nombre <span class="text-[var(--color-danger-500)]">*</span>
          </label>
          <input
            id="nombre"
            formControlName="nombre"
            [class]="inputCls(form.controls.nombre)"
            placeholder="Ej. Suite ejecutiva"
            maxlength="80" />
          @if (errMsg('nombre'); as msg) {
            <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
          }
        </div>

        <div [class]="editing() ? 'grid sm:grid-cols-3 gap-4' : 'grid sm:grid-cols-2 gap-4'">
          <div>
            <label for="precioBase" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Precio base <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <div class="relative mt-1.5">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] text-[13px]">
                S/
              </span>
              <input
                id="precioBase"
                type="number"
                step="0.01"
                min="0"
                formControlName="precioBase"
                [class]="inputCls(form.controls.precioBase, 'pl-8 mt-0')"
                placeholder="0.00" />
            </div>
            @if (errMsg('precioBase'); as msg) {
              <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
            }
          </div>

          <div>
            <label for="capacidadMaxima" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Capacidad <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <input
              id="capacidadMaxima"
              type="number"
              min="1"
              max="20"
              formControlName="capacidadMaxima"
              [class]="inputCls(form.controls.capacidadMaxima)"
              placeholder="2" />
            @if (errMsg('capacidadMaxima'); as msg) {
              <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
            }
          </div>

          @if (editing()) {
            <div>
              <label for="estado" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                Estado <span class="text-[var(--color-danger-500)]">*</span>
              </label>
              <select
                id="estado"
                formControlName="estado"
                [class]="inputCls(form.controls.estado)">
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
          }
        </div>

        <div>
          <label for="descripcion" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
            Descripción
          </label>
          <textarea
            id="descripcion"
            formControlName="descripcion"
            rows="3"
            maxlength="2000"
            class="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border-soft)] bg-white text-[15px] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 transition resize-y"
            placeholder="Comodidades destacadas, vista, tamaño..."></textarea>
          <p class="text-[11px] text-[var(--color-ink-muted)] mt-1 text-right">
            {{ descripcionLength() }}/2000
          </p>
        </div>
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
          {{ editing() ? 'Guardar cambios' : 'Crear tipo' }}
        </ui-button>
      </ng-container>
    </ui-modal>
  `,
})
export class RoomTypeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly open = input.required<boolean>();
  readonly editing = input<RoomType | null>(null);
  readonly submitting = signal(false);

  readonly closed = output<void>();
  readonly submitted = output<RoomTypeCreatePayload>();

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    precioBase: [0, [Validators.required, Validators.min(0)]],
    capacidadMaxima: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
    estado: ['ACTIVO' as EstadoActivo, [Validators.required]],
    descripcion: ['', [Validators.maxLength(2000)]],
  });

  readonly title = computed(() =>
    this.editing() ? 'Editar tipo de habitación' : 'Nuevo tipo de habitación',
  );

  readonly descripcionLength = computed(() => this.form.controls.descripcion.value?.length ?? 0);

  ngOnInit(): void {
    this.applyEditing();
  }

  applyEditing(): void {
    const edit = this.editing();
    if (edit) {
      this.form.patchValue({
        nombre: edit.nombre,
        precioBase: Number(edit.precioBase),
        capacidadMaxima: edit.capacidadMaxima,
        estado: edit.estado,
        descripcion: edit.descripcion ?? '',
      });
    } else {
      this.form.reset({
        nombre: '',
        precioBase: 0,
        capacidadMaxima: 1,
        estado: 'ACTIVO',
        descripcion: '',
      });
    }
  }

  errMsg(field: keyof typeof this.form.controls): string | null {
    const c = this.form.controls[field];
    if (!c.invalid || (!c.touched && !c.dirty)) return null;
    if (c.hasError('required')) return 'Obligatorio.';
    if (c.hasError('min')) return 'Valor demasiado bajo.';
    if (c.hasError('max')) return 'Valor demasiado alto.';
    if (c.hasError('maxlength')) return 'Texto demasiado largo.';
    return 'Inválido.';
  }

  inputCls(control: { invalid: boolean; touched: boolean; dirty: boolean }, extra = ''): string {
    const base =
      'w-full h-11 px-3.5 rounded-lg border bg-white text-[15px] focus:outline-none transition-all mt-1.5';
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
    const payload: RoomTypeCreatePayload = {
      nombre: v.nombre.trim(),
      precioBase: Number(v.precioBase),
      capacidadMaxima: Number(v.capacidadMaxima),
      estado: this.editing() ? v.estado : 'ACTIVO',
      descripcion: v.descripcion?.trim() || null,
    };
    this.submitting.set(true);
    this.submitted.emit(payload);
  }

  finishSubmit(): void {
    this.submitting.set(false);
  }
}
