import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Acompanante, Reserva } from '../../models/reservation.model';

const INPUT_BASE = 'mt-1.5 w-full h-10 px-3.5 rounded-lg border bg-white text-sm focus:outline-none transition';
const INPUT_OK  = `${INPUT_BASE} border-[#EEE3D1] focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20`;
const INPUT_ERR = `${INPUT_BASE} border-red-400 focus:ring-2 focus:ring-red-400/20`;

/**
 * Edición de acompañantes de una reserva propia (cliente).
 * Reemplazo TOTAL: la lista enviada sustituye a todos los acompañantes actuales.
 * El titular no se toca (se conserva del alta). Tope: 1 titular + acompañantes ≤ pax.
 */
@Component({
  selector: 'app-editar-acompanantes-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  host: {
    '(document:keydown.escape)': 'isOpen() && !saving() && onClose.emit()',
    role: 'dialog',
    'aria-modal': 'true',
  },
  template: `
    @if (isOpen() && reserva()) {
      <div class="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-[#2D2926]/75"
           (click)="!saving() && onClose.emit()">
        <div class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh]"
             (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-[#EEE3D1] shrink-0">
            <div>
              <h2 class="text-base font-bold text-[#2D2926]">Editar acompañantes</h2>
              <p class="text-xs font-mono text-[#C5A048] mt-0.5">{{ reserva()!.codReserva }}</p>
            </div>
            <button type="button" (click)="onClose.emit()" [disabled]="saving()"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-[#2D2926]/40
                     hover:text-[#2D2926] hover:bg-[#F9F5F0] transition-colors disabled:opacity-40">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div class="rounded-xl bg-[#FFF8E1] border border-[#FDE68A] px-4 py-3">
              <p class="text-sm font-semibold text-[#8E6F2E]">Reserva a tu nombre</p>
              <p class="text-xs text-[#8E6F2E]/80 mt-0.5">
                El titular se conserva automáticamente. Aquí solo gestionas a tus acompañantes.
              </p>
            </div>

            <div class="flex items-center justify-between">
              <p class="text-[11px] uppercase tracking-wider text-[#C5A048] font-semibold">Acompañantes</p>
              @if (maxAcompanantes() > 0) {
                <span class="text-[11px] text-[#2D2926]/50">
                  Puedes agregar hasta {{ maxAcompanantes() }}
                  acompañante{{ maxAcompanantes() !== 1 ? 's' : '' }}
                </span>
              }
            </div>

            @for (grupo of acompanantesCtrls(); track $index) {
              <div [formGroup]="grupo" class="bg-white border border-[#EEE3D1] rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-semibold text-[#8E6F2E]">Acompañante {{ $index + 1 }}</p>
                  <button type="button" (click)="quitarAcompanante($index)"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors"
                    aria-label="Eliminar acompañante">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                <div class="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">
                      Nombre <span class="text-red-500">*</span>
                    </label>
                    <input type="text" formControlName="nombre" maxlength="80" placeholder="Ana"
                      [class]="icAcomp($index, 'nombre')" />
                  </div>
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">
                      Apellido paterno <span class="text-red-500">*</span>
                    </label>
                    <input type="text" formControlName="apellidoPaterno" maxlength="80" placeholder="Gómez"
                      [class]="icAcomp($index, 'apellidoPaterno')" />
                  </div>
                </div>

                <div class="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">Apellido materno</label>
                    <input type="text" formControlName="apellidoMaterno" maxlength="80" placeholder="López"
                      [class]="icAcomp($index, 'apellidoMaterno')" />
                  </div>
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">
                      N° documento <span class="text-red-500">*</span>
                    </label>
                    <input type="text" formControlName="numeroDocumento" maxlength="20" placeholder="99999999"
                      [class]="icAcomp($index, 'numeroDocumento')" />
                  </div>
                </div>

                <div class="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">Nacionalidad</label>
                    <input type="text" formControlName="nacionalidad" maxlength="60" placeholder="Peruana"
                      [class]="icAcomp($index, 'nacionalidad')" />
                  </div>
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">Correo</label>
                    <input type="email" formControlName="correo" maxlength="150" placeholder="correo@ejemplo.com"
                      [class]="icAcomp($index, 'correo')" />
                    @if (invAcomp($index, 'correo')) {
                      <p class="text-xs text-red-500 mt-1">Correo no válido.</p>
                    }
                  </div>
                </div>

                <div class="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">Teléfono</label>
                    <input type="tel" formControlName="telefono" maxlength="20" placeholder="999 888 777"
                      [class]="icAcomp($index, 'telefono')" />
                  </div>
                </div>
              </div>
            }

            @if (acompanantes.length === 0) {
              <p class="text-sm text-[#2D2926]/50">Sin acompañantes. La reserva queda solo a tu nombre.</p>
            }

            @if (maxAcompanantes() === 0) {
              <p class="text-[11px] text-[#2D2926]/50">
                Esta reserva es para 1 persona; no puedes agregar acompañantes.
              </p>
            } @else {
              <button type="button" (click)="agregarAcompanante()"
                [disabled]="acompanantes.length >= maxAcompanantes()"
                class="w-full h-10 rounded-xl border-2 border-dashed border-[#C5A048] text-[#C5A048]
                       text-sm font-semibold hover:bg-[#FFF8E1] transition-colors
                       flex items-center justify-center gap-2
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" d="M12 4.5v15m7.5-7.5h-15"/>
                </svg>
                Agregar acompañante
              </button>
            }
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#EEE3D1] shrink-0">
            <button type="button" (click)="onClose.emit()" [disabled]="saving()"
              class="h-9 px-4 rounded-xl border border-[#EEE3D1] text-sm font-medium
                     text-[#2D2926]/70 hover:bg-[#F9F5F0] transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="button" (click)="guardar()" [disabled]="acompanantes.invalid || saving()"
              class="h-9 px-5 rounded-xl bg-[#C5A048] text-white text-sm font-semibold
                     hover:bg-[#8E6F2E] transition-colors disabled:opacity-50 flex items-center gap-2">
              @if (saving()) {
                <span class="inline-block w-4 h-4 rounded-full border-2 border-white border-r-transparent animate-spin"></span>
              }
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class EditarAcompanantesModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly isOpen  = input.required<boolean>();
  readonly reserva = input<Reserva | null>(null);
  readonly saving  = input<boolean>(false);

  readonly onClose = output<void>();
  readonly onSave  = output<Acompanante[]>();

  readonly acompanantes = new FormArray<FormGroup>([]);

  readonly maxAcompanantes = computed(() => {
    const r = this.reserva();
    if (!r) return 0;
    return Math.max(0, r.nroAdultos + r.nroNinos - 1);
  });

  private readonly hydrated = signal<number | null>(null);

  constructor() {
    // Al abrir, pre-llena el FormArray con los acompañantes actuales (no-principales),
    // usando los campos partidos de la respuesta. Reemplazo total: se reenvían completos.
    effect(() => {
      const open = this.isOpen();
      const r = this.reserva();
      if (!open) {
        this.hydrated.set(null);
        return;
      }
      if (r && this.hydrated() !== r.reservaId) {
        this.acompanantes.clear();
        for (const h of r.huespedes.filter(x => !x.esPrincipal)) {
          this.acompanantes.push(this.grupoDesde(h));
        }
        this.hydrated.set(r.reservaId);
      }
    });
  }

  acompanantesCtrls(): FormGroup[] {
    return this.acompanantes.controls as FormGroup[];
  }

  private nuevoGrupo(valores: Partial<Record<string, string>> = {}): FormGroup {
    return this.fb.group({
      nombre:          [valores['nombre'] ?? '', [Validators.required, Validators.maxLength(80)]],
      apellidoPaterno: [valores['apellidoPaterno'] ?? '', [Validators.required, Validators.maxLength(80)]],
      apellidoMaterno: [valores['apellidoMaterno'] ?? '', Validators.maxLength(80)],
      numeroDocumento: [valores['numeroDocumento'] ?? '', [Validators.required, Validators.maxLength(20)]],
      nacionalidad:    [valores['nacionalidad'] ?? '', Validators.maxLength(60)],
      correo:          [valores['correo'] ?? '', [Validators.email, Validators.maxLength(150)]],
      telefono:        [valores['telefono'] ?? '', Validators.maxLength(20)],
    });
  }

  private grupoDesde(h: Reserva['huespedes'][number]): FormGroup {
    return this.nuevoGrupo({
      nombre:          h.nombre,
      apellidoPaterno: h.apellidoPaterno,
      apellidoMaterno: h.apellidoMaterno ?? '',
      numeroDocumento: h.numeroDocumento,
      nacionalidad:    h.nacionalidad ?? '',
      correo:          h.correo ?? '',
      telefono:        h.telefono ?? '',
    });
  }

  agregarAcompanante(): void {
    if (this.acompanantes.length >= this.maxAcompanantes()) return;
    this.acompanantes.push(this.nuevoGrupo());
  }

  quitarAcompanante(index: number): void {
    this.acompanantes.removeAt(index);
  }

  invAcomp(index: number, field: string): boolean {
    const c = this.acompanantes.at(index)?.get(field);
    return !!(c?.invalid && c.touched);
  }

  icAcomp(index: number, field: string): string {
    return this.invAcomp(index, field) ? INPUT_ERR : INPUT_OK;
  }

  guardar(): void {
    if (this.acompanantes.invalid) {
      this.acompanantes.markAllAsTouched();
      return;
    }
    if (this.acompanantes.length > this.maxAcompanantes()) return;
    this.onSave.emit(this.construir());
  }

  private construir(): Acompanante[] {
    return this.acompanantesCtrls().map(g => {
      const v = g.getRawValue() as Record<string, string | null>;
      const a: Acompanante = {
        nombre:          (v['nombre'] ?? '').trim(),
        apellidoPaterno: (v['apellidoPaterno'] ?? '').trim(),
        numeroDocumento: (v['numeroDocumento'] ?? '').trim(),
      };
      const apMaterno = v['apellidoMaterno']?.trim();
      const nacionalidad = v['nacionalidad']?.trim();
      const correo = v['correo']?.trim();
      const telefono = v['telefono']?.trim();
      if (apMaterno)    a.apellidoMaterno = apMaterno;
      if (nacionalidad) a.nacionalidad = nacionalidad;
      if (correo)       a.correo = correo;
      if (telefono)     a.telefono = telefono;
      return a;
    });
  }
}
