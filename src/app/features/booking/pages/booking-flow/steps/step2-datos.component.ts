import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Output,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BookingStateService } from '../../../services/booking.service';
import { DniLookupComponent } from '../../../../../shared/components/dni-lookup/dni-lookup.component';
import { ReniecPersona } from '../../../../../core/reniec/reniec.service';

@Component({
  selector: 'app-step2-datos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DecimalPipe, DniLookupComponent],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Formulario (izquierda) -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-6 shadow-[var(--shadow-card)]">
          <h2 class="text-lg font-bold text-[#2D2926] mb-5">Datos del huésped</h2>
          <form [formGroup]="form" class="space-y-4" novalidate>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Número de documento <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input type="text" formControlName="numeroDocumento" placeholder="DNI / Pasaporte"
                  [class]="inputClass('numeroDocumento')" />
                @if (err('numeroDocumento')) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1" role="alert">
                    El documento es obligatorio.
                  </p>
                }
                <app-dni-lookup
                  [dni]="form.controls.numeroDocumento.value"
                  (found)="onReniec($event)" />
              </div>
              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Teléfono
                </label>
                <input type="tel" formControlName="telefono" placeholder="+51 999 999 999"
                  [class]="inputClass('telefono')" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Nombres <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input type="text" formControlName="nombres" placeholder="Ej. Juan Carlos"
                  [class]="inputClass('nombres')" />
                @if (err('nombres')) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1" role="alert">
                    El nombre es obligatorio.
                  </p>
                }
              </div>
              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Apellidos <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input type="text" formControlName="apellidos" placeholder="Ej. García López"
                  [class]="inputClass('apellidos')" />
                @if (err('apellidos')) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1" role="alert">
                    Los apellidos son obligatorios.
                  </p>
                }
              </div>
            </div>

            <div>
              <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                Correo electrónico <span class="text-[var(--color-danger-500)]">*</span>
              </label>
              <input type="email" formControlName="correo" placeholder="correo@ejemplo.com"
                [class]="inputClass('correo')" />
              @if (err('correo')) {
                <p class="text-xs text-[var(--color-danger-500)] mt-1" role="alert">
                  Ingresa un correo válido.
                </p>
              }
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Adultos <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <select formControlName="nroAdultos" [class]="inputClass('nroAdultos')">
                  @for (n of [1,2,3,4]; track n) {
                    <option [value]="n">{{ n }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Menores de edad
                </label>
                <select formControlName="nroNinos" [class]="inputClass('nroNinos')">
                  @for (n of [0,1,2,3]; track n) {
                    <option [value]="n">{{ n }}</option>
                  }
                </select>
              </div>
            </div>

            <div>
              <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                Servicios adicionales / Observaciones
              </label>
              <textarea formControlName="serviciosAdicionales" rows="3"
                placeholder="Desayuno incluido, cuna para bebé, llegada tardía..."
                class="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border-soft)] text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A048] resize-none">
              </textarea>
            </div>

          </form>
        </div>
      </div>

      <!-- Resumen habitación seleccionada (derecha) -->
      <div class="lg:col-span-1">
        @if (state.habitacionSeleccionada(); as hab) {
          <div class="bg-white rounded-2xl border border-[#C5A048] p-5 shadow-[var(--shadow-card)] sticky top-4">
            <p class="text-[11px] font-semibold text-[#C5A048] uppercase tracking-widest mb-3">Su selección</p>
            <p class="font-bold text-[#2D2926] text-[16px]">{{ hab.tipoHabitacionNombre }}</p>
            <p class="text-[13px] text-[var(--color-ink-muted)] mb-4">
              Hab. {{ hab.numero }} — Piso {{ hab.piso }}
            </p>
            <div class="space-y-2 text-[13px]">
              <div class="flex justify-between">
                <span class="text-[var(--color-ink-muted)]">Entrada</span>
                <span class="font-medium">{{ state.searchParams()?.checkIn }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[var(--color-ink-muted)]">Salida</span>
                <span class="font-medium">{{ state.searchParams()?.checkOut }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[var(--color-ink-muted)]">Noches</span>
                <span class="font-medium">{{ state.noches() }}</span>
              </div>
              <div class="border-t border-[var(--color-border-soft)] pt-2 flex justify-between">
                <span class="text-[var(--color-ink-muted)]">Precio / noche</span>
                <span class="font-medium">S/ {{ hab.precioBase | number:'1.2-2' }}</span>
              </div>
              <div class="flex justify-between font-bold text-[#2D2926] text-[15px] pt-1">
                <span>Total (inc. IGV)</span>
                <span class="text-[#C5A048]">S/ {{ state.montoTotal() | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Nav buttons -->
    <div class="mt-6 flex justify-between">
      <button (click)="back.emit()"
        class="px-6 h-10 border border-[var(--color-border-soft)] text-[var(--color-ink-muted)] rounded-lg text-[14px] hover:border-[#C5A048] hover:text-[#C5A048] transition-colors">
        Anterior
      </button>
      <button (click)="continuar()"
        class="px-8 h-10 bg-[#C5A048] hover:bg-[#b8923e] text-white font-semibold rounded-lg text-[14px] transition-colors">
        Continuar
      </button>
    </div>
  `,
})
export class Step2DatosComponent {
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  readonly state = inject(BookingStateService);

  readonly form = this.fb.nonNullable.group({
    numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
    nombres: ['', [Validators.required, Validators.maxLength(80)]],
    apellidos: ['', [Validators.required, Validators.maxLength(80)]],
    telefono: [''],
    correo: ['', [Validators.required, Validators.email]],
    nroAdultos: [1, [Validators.required, Validators.min(1)]],
    nroNinos: [0],
    serviciosAdicionales: [''],
  });

  constructor() {
    const existing = this.state.datosHuesped();
    if (existing) this.form.patchValue(existing);
  }

  onReniec(p: ReniecPersona): void {
    this.form.patchValue({
      nombres: p.nombres,
      apellidos: `${p.apellidoPaterno} ${p.apellidoMaterno}`.trim(),
    });
  }

  inputClass(field: string): string {
    const invalid = this.err(field);
    return `w-full h-10 px-3.5 rounded-lg border text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A048] ${
      invalid ? 'border-[var(--color-danger-500)]' : 'border-[var(--color-border-soft)]'
    }`;
  }

  err(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  continuar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Completa todos los campos obligatorios.');
      return;
    }
    const v = this.form.getRawValue();
    this.state.setDatosHuesped({
      numeroDocumento: v.numeroDocumento,
      nombres: v.nombres,
      apellidos: v.apellidos,
      telefono: v.telefono,
      correo: v.correo,
      nroAdultos: v.nroAdultos,
      nroNinos: v.nroNinos,
      serviciosAdicionales: v.serviciosAdicionales,
    });
    this.next.emit();
  }
}
