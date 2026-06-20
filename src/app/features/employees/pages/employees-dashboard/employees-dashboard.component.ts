import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeStatsComponent } from '../../components/employee-stats/employee-stats.component';
import { EmployeeTableComponent } from '../../components/employee-table/employee-table.component';
import { EmployeeFiltersComponent } from '../../components/employee-filters/employee-filters.component';
import { EmployeeModalComponent } from '../../components/employee-modal/employee-modal.component';
import { Employee, EmployeeRole, EmployeeStatus } from '../../models/employee.model';

@Component({
  selector: 'app-employees-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeeStatsComponent, EmployeeTableComponent, EmployeeFiltersComponent, EmployeeModalComponent],
  template: `
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#C5A048] mb-1">
            Administración
          </p>
          <h1 class="text-2xl font-bold text-[#2D2926] leading-tight">Empleados</h1>
          <p class="text-sm text-[#8E6F2E] mt-0.5">Gestión y administración del personal del hotel</p>
        </div>
        <button type="button" (click)="openAddModal()"
          class="shrink-0 h-9 px-4 bg-[#C5A048] text-white text-sm font-semibold rounded-xl
                 hover:bg-[#8E6F2E] transition-colors flex items-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" d="M12 5v14M5 12h14"/>
          </svg>
          Nuevo empleado
        </button>
      </div>

      <!-- Stats -->
      <app-employee-stats [stats]="svc.stats()" />

      <!-- Filters -->
      <app-employee-filters
        [receptionCount]="svc.roleCounts().reception"
        [cleaningCount]="svc.roleCounts().cleaning"
        [maintenanceCount]="svc.roleCounts().maintenance"
        [securityCount]="svc.roleCounts().security"
        [managementCount]="svc.roleCounts().management"
        [activeCount]="svc.activeCount()"
        [inactiveCount]="svc.inactiveCount()"
        [onVacationCount]="svc.onVacationCount()"
        [sickLeaveCount]="svc.sickLeaveCount()"
        (onSearch)="svc.setSearchTerm($event)"
        (onRoleFilter)="svc.setRoleFilter($event)"
        (onStatusFilter)="svc.setStatusFilter($event)" />

      <!-- Table -->
      <app-employee-table
        [employees]="svc.filteredEmployees()"
        (onEditEmployee)="editEmployee($event)"
        (onToggleStatus)="toggleStatus($event)"
        (onDeleteEmployee)="svc.deleteEmployee($event)" />

    </div>

    <app-employee-modal
      [isOpen]="modalOpen()"
      [employee]="selected()"
      (onClose)="closeModal()"
      (onSave)="saveEmployee($event)" />
  `,
})
export class EmployeesDashboardComponent {
  protected readonly svc = inject(EmployeeService);

  modalOpen = signal(false);
  selected  = signal<Employee | null>(null);

  openAddModal() {
    this.selected.set(null);
    this.modalOpen.set(true);
  }

  editEmployee(id: number) {
    const emp = this.svc.filteredEmployees().find(e => e.id === id);
    if (emp) { this.selected.set(emp); this.modalOpen.set(true); }
  }

  closeModal() {
    this.modalOpen.set(false);
    this.selected.set(null);
  }

  saveEmployee(data: Record<string, unknown>) {
    const emp = this.selected();
    if (emp) {
      this.svc.updateEmployeeStatus(emp.id, data['status'] as EmployeeStatus);
      this.svc.updateEmployeeRole(emp.id, data['role'] as EmployeeRole);
    } else {
      this.svc.addEmployee({
        ...(data as Omit<Employee, 'id' | 'lastShift' | 'hireDate'>),
        hireDate:  new Date(data['hireDate'] as string),
        lastShift: new Date(),
      });
    }
    this.closeModal();
  }

  toggleStatus(id: number) {
    const emp = this.svc.filteredEmployees().find(e => e.id === id);
    if (emp) {
      this.svc.updateEmployeeStatus(id, emp.status === 'active' ? 'inactive' : 'active');
    }
  }
}
