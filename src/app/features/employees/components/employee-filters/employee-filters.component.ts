import { Component, output, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EmployeeRole, EmployeeStatus } from '../../models/employee.model';

@Component({
  selector: 'app-employee-filters',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4 space-y-4">

      <!-- Search -->
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E6F2E] pointer-events-none"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path stroke-linecap="round" d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" [formControl]="searchControl"
               placeholder="Buscar por nombre, documento o teléfono..."
               aria-label="Buscar empleados"
               class="w-full h-10 pl-9 pr-3.5 rounded-lg border border-[#EEE3D1] bg-[#F9F5F0] text-sm
                      text-[#2D2926] placeholder:text-[#8E6F2E]/50 focus:outline-none
                      focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20 transition">
      </div>

      <!-- Role filters -->
      <div>
        <p class="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8E6F2E] mb-2">Rol</p>
        <div class="flex flex-wrap gap-1.5">
          @for (f of roleFilters; track f.value) {
            <button type="button" (click)="setRole(f.value)"
              class="h-7 px-3 rounded-lg border text-[11px] font-medium transition-colors"
              [class]="selectedRole() === f.value
                ? 'bg-[#C5A048] border-[#C5A048] text-white'
                : 'border-[#EEE3D1] text-[#2D2926]/60 hover:border-[#C5A048] hover:text-[#C5A048]'">
              {{ f.label }}
              @if (f.value !== 'all') {
                <span class="ml-1 opacity-75">{{ getRoleCount(f.value) }}</span>
              }
            </button>
          }
        </div>
      </div>

      <!-- Status filters -->
      <div>
        <p class="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8E6F2E] mb-2">Estado</p>
        <div class="flex flex-wrap gap-1.5">
          @for (f of statusFilters; track f.value) {
            <button type="button" (click)="setStatus(f.value)"
              class="h-7 px-3 rounded-lg border text-[11px] font-medium transition-colors"
              [class]="selectedStatus() === f.value
                ? 'bg-[#C5A048] border-[#C5A048] text-white'
                : 'border-[#EEE3D1] text-[#2D2926]/60 hover:border-[#C5A048] hover:text-[#C5A048]'">
              {{ f.label }}
              @if (f.value !== 'all') {
                <span class="ml-1 opacity-75">{{ getStatusCount(f.value) }}</span>
              }
            </button>
          }
        </div>
      </div>

    </div>
  `,
})
export class EmployeeFiltersComponent {
  onSearch       = output<string>();
  onRoleFilter   = output<EmployeeRole | 'all'>();
  onStatusFilter = output<EmployeeStatus | 'all'>();

  receptionCount   = input(0);
  cleaningCount    = input(0);
  maintenanceCount = input(0);
  securityCount    = input(0);
  managementCount  = input(0);

  activeCount     = input(0);
  inactiveCount   = input(0);
  onVacationCount = input(0);
  sickLeaveCount  = input(0);

  searchControl  = new FormControl('');
  selectedRole   = signal<EmployeeRole | 'all'>('all');
  selectedStatus = signal<EmployeeStatus | 'all'>('all');

  readonly roleFilters = [
    { label: 'Todos',           value: 'all'         as const },
    { label: 'Recepción',       value: 'reception'   as const },
    { label: 'Limpieza',        value: 'cleaning'    as const },
    { label: 'Mantenimiento',   value: 'maintenance' as const },
    { label: 'Seguridad',       value: 'security'    as const },
    { label: 'Administración',  value: 'management'  as const },
  ];

  readonly statusFilters = [
    { label: 'Todos',           value: 'all'          as const },
    { label: 'Activo',          value: 'active'       as const },
    { label: 'Inactivo',        value: 'inactive'     as const },
    { label: 'Vacaciones',      value: 'on-vacation'  as const },
    { label: 'Licencia médica', value: 'sick-leave'   as const },
  ];

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(v => this.onSearch.emit(v ?? ''));
  }

  setRole(role: EmployeeRole | 'all') {
    this.selectedRole.set(role);
    this.onRoleFilter.emit(role);
  }

  setStatus(status: EmployeeStatus | 'all') {
    this.selectedStatus.set(status);
    this.onStatusFilter.emit(status);
  }

  getRoleCount(role: EmployeeRole): number {
    switch (role) {
      case 'reception':   return this.receptionCount();
      case 'cleaning':    return this.cleaningCount();
      case 'maintenance': return this.maintenanceCount();
      case 'security':    return this.securityCount();
      case 'management':  return this.managementCount();
    }
  }

  getStatusCount(status: EmployeeStatus): number {
    switch (status) {
      case 'active':      return this.activeCount();
      case 'inactive':    return this.inactiveCount();
      case 'on-vacation': return this.onVacationCount();
      case 'sick-leave':  return this.sickLeaveCount();
    }
  }
}
