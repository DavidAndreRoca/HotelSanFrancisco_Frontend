import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Output,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { BookingStateService } from '../../../services/booking.service';
import { TipoPago } from '../../../models/booking.model';

@Component({
  selector: 'app-step3-resumen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-6 shadow-[var(--shadow-card)]">
        <h2 class="text-lg font-bold text-[#2D2926] mb-5">Resumen de reserva</h2>

        <!-- Habitación -->
        <section class="mb-5">
          <p class="text-[11px] font-semibold text-[#C5A048] uppercase tracking-widest mb-2">Habitación</p>
          @if (state.habitacionSeleccionada(); as hab) {
            <div class="grid grid-cols-2 gap-2 text-[14px]">
              <span class="text-[var(--color-ink-muted)]">Tipo</span>
              <span class="font-medium text-right">{{ hab.tipoHabitacionNombre }}</span>
              <span class="text-[var(--color-ink-muted)]">Número</span>
              <span class="font-medium text-right">{{ hab.numero }}</span>
              <span class="text-[var(--color-ink-muted)]">Piso</span>
              <span class="font-medium text-right">{{ hab.piso }}</span>
            </div>
          }
        </section>

        <hr class="border-[var(--color-border-soft)] mb-5" />

        <!-- Fechas -->
        <section class="mb-5">
          <p class="text-[11px] font-semibold text-[#C5A048] uppercase tracking-widest mb-2">Fechas</p>
          <div class="grid grid-cols-2 gap-2 text-[14px]">
            <span class="text-[var(--color-ink-muted)]">Entrada</span>
            <span class="font-medium text-right">{{ state.searchParams()?.checkIn }}</span>
            <span class="text-[var(--color-ink-muted)]">Salida</span>
            <span class="font-medium text-right">{{ state.searchParams()?.checkOut }}</span>
            <span class="text-[var(--color-ink-muted)]">Noches</span>
            <span class="font-medium text-right">{{ state.noches() }}</span>
          </div>
        </section>

        <hr class="border-[var(--color-border-soft)] mb-5" />

        <!-- Huésped -->
        <section class="mb-5">
          <p class="text-[11px] font-semibold text-[#C5A048] uppercase tracking-widest mb-2">Huésped</p>
          @if (state.datosHuesped(); as d) {
            <div class="grid grid-cols-2 gap-2 text-[14px]">
              <span class="text-[var(--color-ink-muted)]">Nombre</span>
              <span class="font-medium text-right">{{ d.nombres }} {{ d.apellidos }}</span>
              <span class="text-[var(--color-ink-muted)]">Documento</span>
              <span class="font-medium text-right">{{ d.numeroDocumento }}</span>
              <span class="text-[var(--color-ink-muted)]">Correo</span>
              <span class="font-medium text-right break-all">{{ d.correo }}</span>
              @if (d.telefono) {
                <span class="text-[var(--color-ink-muted)]">Teléfono</span>
                <span class="font-medium text-right">{{ d.telefono }}</span>
              }
              <span class="text-[var(--color-ink-muted)]">Adultos / Menores</span>
              <span class="font-medium text-right">{{ d.nroAdultos }} / {{ d.nroNinos }}</span>
            </div>
            @if (d.serviciosAdicionales) {
              <div class="mt-3 p-3 bg-[#F9F5F0] rounded-lg text-[13px] text-[var(--color-ink-muted)]">
                <strong class="text-[var(--color-ink-soft)]">Observaciones:</strong> {{ d.serviciosAdicionales }}
              </div>
            }
          }
        </section>

        <hr class="border-[var(--color-border-soft)] mb-5" />

        <!-- Tipo de pago -->
        <section>
          <p class="text-[11px] font-semibold text-[#C5A048] uppercase tracking-widest mb-3">Modalidad de pago</p>
          <div class="space-y-3">
            <label class="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors"
              [class]="state.tipoPago() === 'TOTAL' ? 'border-[#C5A048] bg-[#FDF8EF]' : 'border-[var(--color-border-soft)]'">
              <input type="radio" name="tipoPago" value="TOTAL"
                [checked]="state.tipoPago() === 'TOTAL'"
                (change)="setTipoPago('TOTAL')"
                class="mt-0.5 accent-[#C5A048]" />
              <div>
                <p class="font-semibold text-[#2D2926] text-[14px]">Pago total</p>
                <p class="text-[12px] text-[var(--color-ink-muted)]">
                  Paga el 100% ahora: <strong class="text-[#2D2926]">S/ {{ state.montoTotal() | number:'1.2-2' }}</strong>
                </p>
              </div>
            </label>
            <label class="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors"
              [class]="state.tipoPago() === 'ANTICIPO' ? 'border-[#C5A048] bg-[#FDF8EF]' : 'border-[var(--color-border-soft)]'">
              <input type="radio" name="tipoPago" value="ANTICIPO"
                [checked]="state.tipoPago() === 'ANTICIPO'"
                (change)="setTipoPago('ANTICIPO')"
                class="mt-0.5 accent-[#C5A048]" />
              <div>
                <p class="font-semibold text-[#2D2926] text-[14px]">Pago parcial (50%)</p>
                <p class="text-[12px] text-[var(--color-ink-muted)]">
                  Paga ahora <strong class="text-[#2D2926]">S/ {{ (state.montoTotal() * 0.5) | number:'1.2-2' }}</strong>
                  y el resto al llegar.
                </p>
              </div>
            </label>
          </div>

          <!-- Desglose -->
          @if (state.habitacionSeleccionada(); as hab) {
            <div class="mt-4 p-4 bg-[#F9F5F0] rounded-xl text-[13px] space-y-2">
              <div class="flex justify-between">
                <span class="text-[var(--color-ink-muted)]">
                  S/ {{ hab.precioBase | number:'1.2-2' }} × {{ state.noches() }} noche{{ state.noches() > 1 ? 's' : '' }}
                </span>
                <span>S/ {{ (hab.precioBase * state.noches()) | number:'1.2-2' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[var(--color-ink-muted)]">IGV (18%)</span>
                <span>S/ {{ (hab.precioBase * state.noches() * 0.18) | number:'1.2-2' }}</span>
              </div>
              <div class="flex justify-between font-bold text-[#2D2926] border-t border-[var(--color-border-soft)] pt-2">
                <span>Total</span>
                <span>S/ {{ state.montoTotal() | number:'1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-[#C5A048] font-semibold">
                <span>A pagar ahora</span>
                <span>S/ {{ state.adelanto() | number:'1.2-2' }}</span>
              </div>
              @if (state.montoPendiente() > 0) {
                <div class="flex justify-between text-[var(--color-ink-muted)]">
                  <span>Pendiente al llegar</span>
                  <span>S/ {{ state.montoPendiente() | number:'1.2-2' }}</span>
                </div>
              }
            </div>
          }
        </section>
      </div>

      <!-- Nav -->
      <div class="flex justify-between">
        <button (click)="back.emit()"
          class="px-6 h-10 border border-[var(--color-border-soft)] text-[var(--color-ink-muted)] rounded-lg text-[14px] hover:border-[#C5A048] hover:text-[#C5A048] transition-colors">
          Anterior
        </button>
        <button (click)="next.emit()"
          class="px-8 h-10 bg-[#C5A048] hover:bg-[#b8923e] text-white font-semibold rounded-lg text-[14px] transition-colors">
          Continuar al pago
        </button>
      </div>
    </div>
  `,
})
export class Step3ResumenComponent {
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  readonly state = inject(BookingStateService);

  setTipoPago(tipo: TipoPago): void {
    this.state.setTipoPago(tipo);
  }
}
