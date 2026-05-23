// features/employees/pages/employees-dashboard/employees-dashboard.component.ts
import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeStatsComponent } from '../../components/employee-stats/employee-stats.component';
import { EmployeeTableComponent } from '../../components/employee-table/employee-table.component';
import { EmployeeFiltersComponent } from '../../components/employee-filters/employee-filters.component';
import { EmployeeModalComponent } from '../../components/employee-modal/employee-modal.component';
import { RoomSidebarComponent } from '../../../rooms/components/room-sidebar/room-sidebar.component';
import { EmployeeRole, EmployeeStatus, Employee } from '../../models/employee.model';

@Component({
  selector: 'app-employees-dashboard',
  standalone: true,
  imports: [
    RoomSidebarComponent,
    EmployeeStatsComponent,
    EmployeeTableComponent,
    EmployeeFiltersComponent,
    EmployeeModalComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-layout">
      <app-room-sidebar />
      
      <main class="main-content">
        <div class="header">
          <h1>Gestión de Empleados</h1>
          <p class="subtitle">Registro y administración de empleados</p>
        </div>

        <app-employee-stats [stats]="employeeService.stats()" />

        <app-employee-filters
          [receptionCount]="employeeService.roleCounts().reception"
          [cleaningCount]="employeeService.roleCounts().cleaning"
          [maintenanceCount]="employeeService.roleCounts().maintenance"
          [securityCount]="employeeService.roleCounts().security"
          [managementCount]="employeeService.roleCounts().management"
          [activeCount]="employeeService.activeCount()"
          [inactiveCount]="employeeService.inactiveCount()"
          [onVacationCount]="employeeService.onVacationCount()"
          [sickLeaveCount]="employeeService.sickLeaveCount()"
          (onSearch)="handleSearch($event)"
          (onRoleFilter)="handleRoleFilter($event)"
          (onStatusFilter)="handleStatusFilter($event)" />

        <app-employee-table
          [employees]="employeeService.filteredEmployees()"
          (onAddEmployee)="openAddModal()"
          (onEditEmployee)="editEmployee($event)"
          (onToggleStatus)="toggleEmployeeStatus($event)"
          (onDeleteEmployee)="deleteEmployee($event)" />
      </main>
    </div>

    <!-- Modal de empleado -->
    <app-employee-modal
      [isOpen]="isModalOpen()"
      [employee]="selectedEmployee()"
      (onClose)="closeModal()"
      (onSave)="saveEmployee($event)" />
    `,
  styles: `
    /* Importar fuente Inter */
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');

    * {
      font-family: 'Inter', sans-serif;
    }

    .dashboard-layout {
      display: flex;
      min-height: 100vh;
      background: #F9F5F0; /* Background: Blanco Hueso */
    }

    .main-content {
      flex: 1;
      margin-left: 260px; /* Coincide con el ancho del sidebar */
      padding: 2rem;
      background: #F9F5F0; /* Background: Blanco Hueso */
      min-height: 100vh;
    }

    .header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #C5A048; /* Primary: Dorado Principal */
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.875rem;
      font-weight: 700;
      color: #2D2926; /* Sidebar/Contrast: Gris Carbón */
      letter-spacing: -0.02em;
      position: relative;
      display: inline-block;
    }

    .header-left h1::before {
      content: '👔';
      font-size: 1.5rem;
      margin-right: 0.75rem;
      display: inline-block;
      vertical-align: middle;
    }

    .subtitle {
      color: #8E6F2E; /* Secondary: Ocre Oscuro */
      margin: 0;
      font-size: 1rem;
      font-weight: 400;
    }

    .header-stats {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: linear-gradient(135deg, #2D2926 0%, #3a3633 100%);
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .quick-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .quick-stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #C5A048; /* Dorado Principal */
      line-height: 1;
    }

    .quick-stat-label {
      font-size: 0.7rem;
      font-weight: 500;
      color: #F9F5F0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .quick-stat-divider {
      width: 1px;
      height: 30px;
      background: rgba(255, 255, 255, 0.2);
    }

    /* Contenedores de componentes */
    app-employee-stats {
      display: block;
      margin-bottom: 1.5rem;
    }

    app-employee-filters {
      display: block;
      margin-bottom: 1.5rem;
    }

    app-employee-table {
      display: block;
    }

    /* Animación de entrada */
    .main-content {
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive para tablets */
    @media (max-width: 1024px) {
      .main-content {
        margin-left: 72px; /* Sidebar contraído */
        padding: 1.5rem;
      }

      .header-left h1 {
        font-size: 1.5rem;
      }

      .header-left h1::before {
        font-size: 1.25rem;
      }
    }

    /* Responsive para móviles */
    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
        padding: 1rem;
        padding-bottom: 80px; /* Espacio para sidebar móvil */
      }

      .header {
        flex-direction: column;
        align-items: flex-start;
        margin-bottom: 1.5rem;
      }

      .header-left h1 {
        font-size: 1.25rem;
      }

      .header-left h1::before {
        font-size: 1rem;
        margin-right: 0.5rem;
      }

      .subtitle {
        font-size: 0.875rem;
      }

      .header-stats {
        padding: 0.5rem 1rem;
        gap: 0.75rem;
      }

      .quick-stat-value {
        font-size: 1.25rem;
      }

      .quick-stat-label {
        font-size: 0.65rem;
      }

      .quick-stat-divider {
        height: 25px;
      }
    }

    /* Para pantallas muy pequeñas */
    @media (max-width: 480px) {
      .main-content {
        padding: 0.75rem;
        padding-bottom: 80px;
      }

      .header {
        margin-bottom: 1rem;
      }

      .header-stats {
        width: 100%;
        justify-content: center;
      }
    }

    /* Scroll suave */
    html {
      scroll-behavior: smooth;
    }

    /* Mejora de focus para accesibilidad */
    :focus-visible {
      outline: 2px solid #C5A048;
      outline-offset: 2px;
    }
  `
})
export class EmployeesDashboardComponent {
  employeeService = inject(EmployeeService);
  
  isModalOpen = signal(false);
  selectedEmployee = signal<Employee | null>(null);

  handleSearch(term: string) {
    this.employeeService.setSearchTerm(term);
  }

  handleRoleFilter(role: EmployeeRole | 'all') {
    this.employeeService.setRoleFilter(role);
  }

  handleStatusFilter(status: EmployeeStatus | 'all') {
    this.employeeService.setStatusFilter(status);
  }

  openAddModal() {
    this.selectedEmployee.set(null);
    this.isModalOpen.set(true);
  }

  editEmployee(id: number) {
    const employee = this.employeeService.filteredEmployees().find(e => e.id === id);
    if (employee) {
      this.selectedEmployee.set(employee);
      this.isModalOpen.set(true);
    }
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedEmployee.set(null);
  }

  saveEmployee(employeeData: any) {
    if (this.selectedEmployee()) {
      // Editar empleado existente
      this.employeeService.updateEmployeeStatus(this.selectedEmployee()!.id, employeeData.status);
      this.employeeService.updateEmployeeRole(this.selectedEmployee()!.id, employeeData.role);
    } else {
      // Agregar nuevo empleado
      this.employeeService.addEmployee({
        ...employeeData,
        hireDate: new Date(employeeData.hireDate),
        lastShift: new Date()
      } as any);
    }
    this.closeModal();
  }

  toggleEmployeeStatus(id: number) {
    const employee = this.employeeService.filteredEmployees().find(e => e.id === id);
    if (employee) {
      const newStatus = employee.status === 'active' ? 'inactive' : 'active';
      this.employeeService.updateEmployeeStatus(id, newStatus as EmployeeStatus);
    }
  }

  deleteEmployee(id: number) {
    this.employeeService.deleteEmployee(id);
  }
}