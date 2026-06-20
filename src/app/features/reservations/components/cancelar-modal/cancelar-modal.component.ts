import { Component, input, output, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Reserva, CancelarReservaPayload } from '../../models/reservation.model';

@Component({
  selector: 'app-cancelar-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DecimalPipe],
  host: {
    '(document:keydown.escape)': 'isOpen() && onClose.emit()',
    role: 'dialog',
    'aria-modal': 'true',
  },
  template: `
    @if (isOpen() && reserva()) {
      <div class="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-[#2D2926]/75"
           (click)="onClose.emit()">
        <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]
                    overflow-y-auto relative"
             (click)="$event.stopPropagation()">

          <!-- Cerrar -->
          <button type="button" (click)="onClose.emit()" aria-label="Cerrar"
            class="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F9F5F0] border border-[#EEE3D1]
                   flex items-center justify-center text-[#2D2926]/40
                   hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors z-10">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>

          <!-- Header -->
          <div class="flex items-start gap-4 px-6 py-5 border-b-2 border-red-500">
            <div class="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71
                         c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898
                         0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-base font-bold text-[#2D2926]">Cancelar Reserva</h2>
              <p class="text-xs font-mono text-red-600 font-semibold mt-0.5">{{ reserva()!.codReserva }}</p>
            </div>
          </div>

          <!-- Body -->
          <div class="p-6">

            <!-- Aviso -->
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm text-[#2D2926] leading-relaxed">
              <p>
                Estás a punto de cancelar la reserva de
                <strong>{{ huespedPrincipal() }}</strong>
                del <strong>{{ formatFecha(reserva()!.fechaInicio) }}</strong>
                al <strong>{{ formatFecha(reserva()!.fechaFin) }}</strong>.
              </p>
              @if (reserva()!.adelanto > 0) {
                <p class="mt-2 text-red-700 font-medium">
                  Adelanto registrado: <strong>S/ {{ reserva()!.adelanto | number:'1.2-2' }}</strong>
                </p>
              }
            </div>

            <form [formGroup]="form" (ngSubmit)="confirmar()" class="space-y-4">

              <!-- Motivo -->
              <div>
                <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E] block mb-1.5">
                  Motivo de cancelación <span class="text-red-500">*</span>
                </label>
                <textarea
                  formControlName="motivo"
                  rows="3"
                  maxlength="500"
                  placeholder="Indique el motivo de la cancelación..."
                  class="w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none transition
                         focus:outline-none focus:ring-2"
                  [class]="isInvalid('motivo')
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                    : 'border-[#EEE3D1] focus:border-red-400 focus:ring-red-400/20'">
                </textarea>
                <div class="flex items-center justify-between mt-1">
                  @if (isInvalid('motivo')) {
                    <span class="text-[11px] text-red-600">El motivo es obligatorio (máx. 500 caracteres)</span>
                  } @else {
                    <span></span>
                  }
                  <span class="text-[11px] text-[#8E6F2E]">
                    {{ form.get('motivo')?.value?.length ?? 0 }} / 500
                  </span>
                </div>
              </div>

              <!-- Penalización -->
              @if (reserva()!.adelanto > 0) {
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E] block mb-1.5">
                    Política de penalización
                  </label>
                  <select formControlName="aplicarPenalizacion"
                    class="w-full h-10 px-3.5 rounded-xl border border-[#EEE3D1] text-sm bg-white
                           focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition">
                    <option value="auto">Automática (según días de anticipación)</option>
                    <option value="true">Aplicar penalización</option>
                    <option value="false">Exonerar penalización (devolución total)</option>
                  </select>
                  <p class="text-[11px] text-[#8E6F2E] mt-1.5">
                    @if (form.get('aplicarPenalizacion')?.value === 'false') {
                      El cliente recibirá devolución total: S/ {{ reserva()!.adelanto | number:'1.2-2' }}
                    } @else if (form.get('aplicarPenalizacion')?.value === 'true') {
                      Penalización estimada: S/ {{ reserva()!.adelanto * 0.2 | number:'1.2-2' }}
                      — Devolución: S/ {{ reserva()!.adelanto * 0.8 | number:'1.2-2' }}
                    } @else {
                      La penalización se calculará según la política del hotel.
                    }
                  </p>
                </div>
              }

              <!-- Acciones -->
              <div class="flex justify-end gap-3 pt-2 border-t border-[#EEE3D1]">
                <button type="button" (click)="onClose.emit()"
                  class="h-9 px-4 rounded-xl border border-[#EEE3D1] text-sm font-semibold
                         text-[#2D2926] hover:border-[#C5A048] hover:bg-[#F9F5F0] transition-colors">
                  Cancelar
                </button>
                <button type="submit" [disabled]="form.invalid"
                  class="h-9 px-5 rounded-xl text-sm font-semibold text-white transition-colors
                         bg-red-600 hover:bg-red-700 disabled:bg-red-200 disabled:cursor-not-allowed">
                  Confirmar cancelación
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    }
  `,
})
export class CancelarModalComponent {
  private readonly fb = inject(FormBuilder);

  isOpen  = input.required<boolean>();
  reserva = input<Reserva | null>(null);

  onClose    = output<void>();
  onCancelar = output<CancelarReservaPayload>();

  form = this.fb.group({
    motivo:              ['', [Validators.required, Validators.maxLength(500)]],
    aplicarPenalizacion: ['auto'],
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        this.form.reset({ aplicarPenalizacion: 'auto' });
      }
    });
  }

  huespedPrincipal(): string {
    const r = this.reserva();
    if (!r) return '';
    return r.huespedes.find(h => h.esPrincipal)?.nombreCompleto
        ?? r.huespedes.at(0)?.nombreCompleto
        ?? '—';
  }

  formatFecha(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  confirmar(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const penalizacion = v.aplicarPenalizacion === 'true' ? true
                       : v.aplicarPenalizacion === 'false' ? false
                       : null;
    this.onCancelar.emit({ motivo: v.motivo!, aplicarPenalizacion: penalizacion });
  }
}
