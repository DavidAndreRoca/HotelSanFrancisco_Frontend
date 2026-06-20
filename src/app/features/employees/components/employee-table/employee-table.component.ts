import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Employee, EmployeeRole, EmployeeStatus } from '../../models/employee.model';

const ROLE_CFG: Record<EmployeeRole, { label: string; cls: string }> = {
  reception:   { label: 'Recepción',      cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  cleaning:    { label: 'Limpieza',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  maintenance: { label: 'Mantenimiento',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  security:    { label: 'Seguridad',      cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  management:  { label: 'Administración', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const STATUS_CFG: Record<EmployeeStatus, { label: string; dot: string; cls: string }> = {
  'active':      { label: 'Activo',          dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'inactive':    { label: 'Inactivo',        dot: 'bg-red-500',     cls: 'bg-red-50 text-red-700 border-red-200' },
  'on-vacation': { label: 'Vacaciones',      dot: 'bg-amber-400',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  'sick-leave':  { label: 'Licencia médica', dot: 'bg-orange-400',  cls: 'bg-orange-50 text-orange-700 border-orange-200' },
};

@Component({
  selector: 'app-employee-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden">

      @if (employees().length === 0) {
        <div class="py-16 text-center">
          <p class="text-sm font-semibold text-[#2D2926]">Sin empleados</p>
          <p class="text-xs text-[#2D2926]/45 mt-1">No se encontraron empleados con los filtros aplicados.</p>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full min-w-[860px] text-sm">
            <thead>
              <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase tracking-wide
                         text-[#2D2926]/50">
                <th class="px-4 py-3 font-semibold">Nombre</th>
                <th class="px-4 py-3 font-semibold">Documento</th>
                <th class="px-4 py-3 font-semibold">Teléfono</th>
                <th class="px-4 py-3 font-semibold">Rol</th>
                <th class="px-4 py-3 font-semibold">Último turno</th>
                <th class="px-4 py-3 font-semibold">Estado</th>
                <th class="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (e of employees(); track e.id) {
                <tr class="border-b border-[#EEE3D1] last:border-0 hover:bg-[#F9F5F0] transition-colors">

                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-full bg-[#C5A048] text-white shrink-0
                                  flex items-center justify-center font-bold text-xs">
                        {{ e.name.charAt(0) }}
                      </div>
                      <div>
                        <p class="font-semibold text-[#2D2926]">{{ e.name }}</p>
                        <p class="text-[11px] text-[#2D2926]/45">{{ e.email }}</p>
                      </div>
                    </div>
                  </td>

                  <td class="px-4 py-3">
                    <span class="font-mono text-xs text-[#2D2926]/60">{{ e.document }}</span>
                  </td>

                  <td class="px-4 py-3 text-[#2D2926]/70">{{ e.phone }}</td>

                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                          [class]="roleCls(e.role)">
                      {{ roleLabel(e.role) }}
                    </span>
                  </td>

                  <td class="px-4 py-3">
                    <span class="font-mono text-xs text-[#2D2926]/60">{{ fmtDate(e.lastShift) }}</span>
                  </td>

                  <td class="px-4 py-3">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                 text-[11px] font-semibold border"
                          [class]="statusCls(e.status)">
                      <span class="w-1.5 h-1.5 rounded-full" [class]="statusDot(e.status)"></span>
                      {{ statusLabel(e.status) }}
                    </span>
                  </td>

                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1.5">
                      <button type="button" (click)="onEditEmployee.emit(e.id)"
                        class="h-7 px-2.5 rounded-lg border border-[#EEE3D1] text-[11px] font-medium
                               text-[#2D2926]/60 hover:border-[#C5A048] hover:text-[#C5A048] transition-colors"
                        title="Editar">
                        Editar
                      </button>
                      <button type="button" (click)="onToggleStatus.emit(e.id)"
                        class="h-7 px-2.5 rounded-lg border border-[#EEE3D1] text-[11px] font-medium
                               text-[#2D2926]/60 hover:border-[#C5A048] hover:text-[#C5A048] transition-colors"
                        title="Cambiar estado">
                        Estado
                      </button>
                      <button type="button" (click)="onDeleteEmployee.emit(e.id)"
                        class="h-7 px-2.5 rounded-lg border border-red-100 text-[11px] font-medium
                               text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar">
                        Eliminar
                      </button>
                    </div>
                  </td>

                </tr>
              }
            </tbody>
          </table>
        </div>
      }

    </div>
  `,
})
export class EmployeeTableComponent {
  employees        = input.required<Employee[]>();
  onEditEmployee   = output<number>();
  onToggleStatus   = output<number>();
  onDeleteEmployee = output<number>();

  roleCls(role: EmployeeRole):     string { return ROLE_CFG[role].cls; }
  roleLabel(role: EmployeeRole):   string { return ROLE_CFG[role].label; }
  statusCls(s: EmployeeStatus):    string { return STATUS_CFG[s].cls; }
  statusDot(s: EmployeeStatus):    string { return STATUS_CFG[s].dot; }
  statusLabel(s: EmployeeStatus):  string { return STATUS_CFG[s].label; }

  fmtDate(d: Date): string {
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }
}
