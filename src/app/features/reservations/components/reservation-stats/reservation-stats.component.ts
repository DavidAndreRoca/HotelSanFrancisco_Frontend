import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReservaStats } from '../../models/reservation.model';

@Component({
  selector: 'app-reservation-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">

      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Total</p>
        <p class="mt-1.5 text-2xl font-bold text-[#2D2926]">{{ stats().total }}</p>
      </div>

      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Confirmadas</p>
        <p class="mt-1.5 text-2xl font-bold text-emerald-600">{{ stats().confirmada }}</p>
      </div>

      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Hospedados</p>
        <p class="mt-1.5 text-2xl font-bold text-[#C5A048]">{{ stats().checkIn }}</p>
      </div>

      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Finalizadas</p>
        <p class="mt-1.5 text-2xl font-bold text-[#2D2926]/50">{{ stats().checkOut }}</p>
      </div>

      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Pendientes</p>
        <p class="mt-1.5 text-2xl font-bold text-amber-500">{{ stats().pendiente }}</p>
      </div>

      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">
          Hoy (llegadas/salidas)
        </p>
        <p class="mt-1.5 text-xl font-bold text-[#8E6F2E]">
          {{ stats().todayCheckIns }}&thinsp;/&thinsp;{{ stats().todayCheckOuts }}
        </p>
      </div>

    </div>
  `,
})
export class ReservationStatsComponent {
  stats = input.required<ReservaStats>();
}
