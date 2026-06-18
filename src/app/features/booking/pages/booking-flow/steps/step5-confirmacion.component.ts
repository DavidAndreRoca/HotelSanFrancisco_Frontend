import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Output,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { BookingStateService } from '../../../services/booking.service';

@Component({
  selector: 'app-step5-confirmacion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="max-w-2xl mx-auto">
      @if (state.confirmacion(); as c) {
        <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-8 shadow-[var(--shadow-card)] text-center">
          <!-- Icono de confirmación -->
          <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg class="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 class="text-2xl font-bold text-[#2D2926] mb-1">Reserva confirmada</h2>
          <p class="text-[var(--color-ink-muted)] text-sm mb-6">
            Recibirá un correo de confirmación en <strong>{{ c.huespedCorreo }}</strong>
          </p>

          <!-- Código de reserva -->
          <div class="bg-[#F9F5F0] rounded-xl px-6 py-4 mb-8 inline-block mx-auto">
            <p class="text-[11px] text-[var(--color-ink-muted)] uppercase tracking-widest mb-1">Código de reserva</p>
            <p class="text-3xl font-bold text-[#C5A048] tracking-widest">{{ c.codReserva }}</p>
          </div>

          <!-- Detalles -->
          <div class="text-left space-y-6">
            <!-- Habitación y fechas -->
            <section>
              <p class="text-[11px] font-semibold text-[#C5A048] uppercase tracking-widest mb-3">Habitación</p>
              <div class="grid grid-cols-2 gap-y-2 text-[14px]">
                <span class="text-[var(--color-ink-muted)]">Tipo</span>
                <span class="font-medium text-right">{{ c.tipoHabitacionNombre }}</span>
                <span class="text-[var(--color-ink-muted)]">Número</span>
                <span class="font-medium text-right">Hab. {{ c.habitacionNumero }} — Piso {{ c.habitacionPiso }}</span>
                <span class="text-[var(--color-ink-muted)]">Entrada</span>
                <span class="font-medium text-right">{{ c.fechaInicio }}</span>
                <span class="text-[var(--color-ink-muted)]">Salida</span>
                <span class="font-medium text-right">{{ c.fechaFin }}</span>
                <span class="text-[var(--color-ink-muted)]">Noches</span>
                <span class="font-medium text-right">{{ c.noches }}</span>
              </div>
            </section>

            <hr class="border-[var(--color-border-soft)]" />

            <!-- Huésped -->
            <section>
              <p class="text-[11px] font-semibold text-[#C5A048] uppercase tracking-widest mb-3">Huésped</p>
              <div class="grid grid-cols-2 gap-y-2 text-[14px]">
                <span class="text-[var(--color-ink-muted)]">Nombre</span>
                <span class="font-medium text-right">{{ c.huespedNombres }} {{ c.huespedApellidos }}</span>
                <span class="text-[var(--color-ink-muted)]">Documento</span>
                <span class="font-medium text-right">{{ c.huespedDocumento }}</span>
              </div>
            </section>

            <hr class="border-[var(--color-border-soft)]" />

            <!-- Pago -->
            <section>
              <p class="text-[11px] font-semibold text-[#C5A048] uppercase tracking-widest mb-3">Resumen de pago</p>
              <div class="space-y-2 text-[14px]">
                <div class="flex justify-between">
                  <span class="text-[var(--color-ink-muted)]">
                    S/ {{ c.precioNoche | number:'1.2-2' }} × {{ c.noches }} noche{{ c.noches > 1 ? 's' : '' }}
                  </span>
                  <span>S/ {{ c.subtotal | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[var(--color-ink-muted)]">IGV (18%)</span>
                  <span>S/ {{ c.impuesto | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between font-bold border-t border-[var(--color-border-soft)] pt-2">
                  <span>Total</span>
                  <span>S/ {{ c.montoTotal | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between text-green-700 font-semibold">
                  <span>Pagado ({{ c.metodoPagoNombre }})</span>
                  <span>S/ {{ c.adelanto | number:'1.2-2' }}</span>
                </div>
                @if (c.montoPendiente > 0) {
                  <div class="flex justify-between text-[var(--color-ink-muted)]">
                    <span>Pendiente al llegar</span>
                    <span>S/ {{ c.montoPendiente | number:'1.2-2' }}</span>
                  </div>
                }
              </div>
            </section>
          </div>

          <!-- Acciones -->
          <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button (click)="restart.emit()"
              class="px-6 h-10 border border-[var(--color-border-soft)] text-[var(--color-ink-muted)] rounded-lg text-[14px] hover:border-[#C5A048] hover:text-[#C5A048] transition-colors">
              Volver al inicio
            </button>
          </div>
        </div>
      } @else {
        <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-10 text-center">
          <p class="text-[var(--color-ink-muted)]">No hay datos de confirmación.</p>
        </div>
      }
    </div>
  `,
})
export class Step5ConfirmacionComponent {
  @Output() restart = new EventEmitter<void>();
  readonly state = inject(BookingStateService);
}
