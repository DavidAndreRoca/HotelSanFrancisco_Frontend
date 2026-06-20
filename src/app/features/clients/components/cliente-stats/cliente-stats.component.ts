import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { ClienteStats } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-3 gap-3">

      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Total</p>
        <p class="mt-1.5 text-2xl font-bold text-[#2D2926]">{{ stats().total }}</p>
      </div>

      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Activos</p>
        <p class="mt-1.5 text-2xl font-bold text-emerald-600">{{ stats().activos }}</p>
      </div>

      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Inactivos</p>
        <p class="mt-1.5 text-2xl font-bold text-red-500">{{ stats().inactivos }}</p>
      </div>

    </div>
  `,
})
export class ClienteStatsComponent {
  stats = input.required<ClienteStats>();
}
