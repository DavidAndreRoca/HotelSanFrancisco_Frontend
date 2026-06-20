import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { EmployeeStats } from '../../models/employee.model';

@Component({
  selector: 'app-employee-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

      <div class="bg-white rounded-2xl border border-[#EEE3D1] px-4 py-3">
        <p class="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8E6F2E]">Total</p>
        <p class="text-2xl font-bold text-[#2D2926] mt-0.5">{{ stats().total }}</p>
        <p class="text-[10px] text-[#2D2926]/40 mt-0.5">empleados</p>
      </div>

      <div class="bg-white rounded-2xl border border-[#EEE3D1] px-4 py-3">
        <p class="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8E6F2E]">Activos</p>
        <p class="text-2xl font-bold text-emerald-600 mt-0.5">{{ stats().active }}</p>
        <p class="text-[10px] text-[#2D2926]/40 mt-0.5">en servicio</p>
      </div>

      <div class="bg-white rounded-2xl border border-[#EEE3D1] px-4 py-3">
        <p class="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8E6F2E]">Inactivos</p>
        <p class="text-2xl font-bold text-red-500 mt-0.5">{{ stats().inactive }}</p>
        <p class="text-[10px] text-[#2D2926]/40 mt-0.5">sin actividad</p>
      </div>

      <div class="bg-white rounded-2xl border border-[#EEE3D1] px-4 py-3">
        <p class="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8E6F2E]">Vacaciones</p>
        <p class="text-2xl font-bold text-amber-500 mt-0.5">{{ stats().onVacation }}</p>
        <p class="text-[10px] text-[#2D2926]/40 mt-0.5">descansando</p>
      </div>

      <div class="bg-white rounded-2xl border border-[#EEE3D1] px-4 py-3">
        <p class="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8E6F2E]">Recepción</p>
        <p class="text-2xl font-bold text-blue-600 mt-0.5">{{ stats().reception }}</p>
        <p class="text-[10px] text-[#2D2926]/40 mt-0.5">personal</p>
      </div>

      <div class="bg-white rounded-2xl border border-[#EEE3D1] px-4 py-3">
        <p class="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8E6F2E]">Limpieza</p>
        <p class="text-2xl font-bold text-[#2D2926] mt-0.5">{{ stats().cleaning }}</p>
        <p class="text-[10px] text-[#2D2926]/40 mt-0.5">personal</p>
      </div>

    </div>
  `,
})
export class EmployeeStatsComponent {
  stats = input.required<EmployeeStats>();
}
