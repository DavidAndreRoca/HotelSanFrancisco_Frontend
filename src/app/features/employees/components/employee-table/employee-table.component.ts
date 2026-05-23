// features/employees/components/employee-table/employee-table.component.ts
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Employee, EmployeeRole, EmployeeStatus } from '../../models/employee.model';

@Component({
  selector: 'app-employee-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-container">
      <div class="table-header">
        <button class="add-btn" (click)="onAddEmployee.emit()">
          ➕ Nuevo Empleado
        </button>
      </div>

      <table class="employee-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Teléfono</th>
            <th>Rol</th>
            <th>Último turno</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (employee of employees(); track employee.id) {
            <tr>
              <td class="name-cell">
                <div class="employee-name">{{ employee.name }}</div>
                <div class="employee-email">{{ employee.email }}</div>
              </td>
              <td>{{ employee.document }}</td>
              <td>{{ employee.phone }}</td>
              <td>
                <span class="role-badge" [class]="getRoleClass(employee.role)">
                  {{ getRoleLabel(employee.role) }}
                </span>
              </td>
              <td>{{ formatDate(employee.lastShift) }}</td>
              <td>
                <span class="status-badge" [class]="getStatusClass(employee.status)">
                  {{ getStatusLabel(employee.status) }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    class="action-btn edit-btn"
                    (click)="onEditEmployee.emit(employee.id)"
                    title="Editar empleado">
                    ✏️
                  </button>
                  <button 
                    class="action-btn status-btn"
                    (click)="onToggleStatus.emit(employee.id)"
                    title="Cambiar estado">
                    🔄
                  </button>
                  <button 
                    class="action-btn delete-btn"
                    (click)="onDeleteEmployee.emit(employee.id)"
                    title="Eliminar empleado">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7" class="empty-table">
                No se encontraron empleados
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
   `,
  styles: `
    /* Importar fuente Inter */
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');

    * {
      font-family: 'Inter', sans-serif;
    }

    .table-container {
      background: white;
      border-radius: 0.75rem;
      overflow-x: auto;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      border: 1px solid #EEE3D1; /* Details: Crema Suave */
    }

    .table-header {
      padding: 1rem 1.25rem;
      border-bottom: 2px solid #C5A048; /* Primary: Dorado Principal */
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      background: #F9F5F0;
    }

    .table-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .title-icon {
      font-size: 1.25rem;
    }

    .table-title h3 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #2D2926;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .add-btn {
      padding: 0.5rem 1.25rem;
      background: #C5A048; /* Primary: Dorado Principal */
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.8125rem;
      font-weight: 600;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .add-btn:hover {
      background: #8E6F2E; /* Secondary: Ocre Oscuro */
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(197, 160, 72, 0.3);
    }

    .employee-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 900px;
    }

    .employee-table th {
      text-align: left;
      padding: 0.875rem 1rem;
      background: #F9F5F0;
      font-weight: 600;
      font-size: 0.75rem;
      color: #8E6F2E; /* Secondary: Ocre Oscuro */
      border-bottom: 1px solid #EEE3D1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .employee-table td {
      padding: 1rem;
      border-bottom: 1px solid #EEE3D1;
      vertical-align: middle;
      font-size: 0.875rem;
      color: #2D2926;
    }

    .employee-table tr {
      transition: background 0.2s ease;
    }

    .employee-table tr:hover {
      background: #F9F5F0;
    }

    /* Estilo para filas según estado */
    .employee-table tr.row-active:hover {
      background: #FEF9E7;
    }

    .employee-table tr.row-inactive:hover {
      background: #FEF2F2;
    }

    .employee-table tr.row-on-vacation:hover {
      background: #FFFDF5;
    }

    .name-cell {
      min-width: 220px;
    }

    .employee-name {
      font-weight: 600;
      color: #2D2926;
      font-size: 0.875rem;
    }

    .employee-email {
      font-size: 0.7rem;
      color: #8E6F2E;
      margin-top: 0.25rem;
    }

    .document-cell, .phone-cell {
      font-family: 'Courier New', monospace;
      font-size: 0.8125rem;
      color: #6B7280;
      letter-spacing: 0.5px;
    }

    .date-cell {
      font-size: 0.8125rem;
      color: #6B7280;
      font-family: 'Courier New', monospace;
    }

    .role-cell, .status-cell {
      text-align: center;
    }

    .role-badge, .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 2rem;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* Roles */
    .role-reception {
      background: #E3F2FD;
      color: #1565C0;
    }

    .role-cleaning {
      background: #E8F5E9;
      color: #2E7D32;
    }

    .role-maintenance {
      background: #FFF8E1;
      color: #C5A048;
    }

    .role-security {
      background: #E0E7FF;
      color: #4338CA;
    }

    .role-management {
      background: linear-gradient(135deg, #F3E8FF, #E9D5FF);
      color: #6B21A5;
    }

    /* Estados */
    .status-active {
      background: #E8F5E9;
      color: #2E7D32;
    }

    .status-inactive {
      background: #FFEBEE;
      color: #C62828;
    }

    .status-on-vacation {
      background: #FFF8E1;
      color: #C5A048;
    }

    .status-sick-leave {
      background: #FFE0B2;
      color: #E65100;
    }

    .actions-cell {
      text-align: center;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }

    .action-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.375rem;
      transition: all 0.2s ease;
      border-radius: 0.375rem;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-btn:hover {
      transform: scale(1.05);
    }

    .edit-btn:hover { 
      background: #E3F2FD; 
      color: #1565C0;
    }
    .status-btn:hover { 
      background: #FFF8E1; 
      color: #C5A048;
    }
    .delete-btn:hover { 
      background: #FFEBEE; 
      color: #C62828;
    }

    /* Estado vacío */
    .empty-table {
      text-align: center;
      padding: 3rem !important;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .empty-icon {
      font-size: 3rem;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      color: #2D2926;
      font-weight: 500;
    }

    .empty-hint {
      font-size: 0.75rem;
      color: #8E6F2E;
    }

    /* Ocultar columna de rol en móvil */
    .employee-role-mobile {
      display: none;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .table-header {
        padding: 0.75rem 1rem;
        flex-direction: column;
        align-items: stretch;
      }

      .add-btn {
        justify-content: center;
      }

      .employee-table th,
      .employee-table td {
        padding: 0.75rem;
      }

      /* Ocultar columna de rol en desktop y mostrar en móvil */
      .role-cell {
        display: none;
      }

      .employee-role-mobile {
        display: block;
        margin-top: 0.5rem;
      }

      .action-buttons {
        flex-direction: column;
        gap: 0.25rem;
      }

      .action-btn {
        width: 32px;
        height: 32px;
      }
    }

    @media (max-width: 480px) {
      .employee-table th,
      .employee-table td {
        padding: 0.5rem;
      }

      .employee-name {
        font-size: 0.8125rem;
      }

      .document-cell, .phone-cell, .date-cell {
        font-size: 0.7rem;
      }
    }
  `
})
export class EmployeeTableComponent {
  employees = input.required<Employee[]>();
  onAddEmployee = output<void>();
  onEditEmployee = output<number>();
  onToggleStatus = output<number>();
  onDeleteEmployee = output<number>();

  formatDate(date: Date): string {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  getRoleClass(role: EmployeeRole): string {
    return `role-${role}`;
  }

  getRoleLabel(role: EmployeeRole): string {
    const labels = {
      'reception': 'Recepción',
      'cleaning': 'Limpieza',
      'maintenance': 'Mantenimiento',
      'security': 'Seguridad',
      'management': 'Administración'
    };
    return labels[role];
  }

  getStatusClass(status: EmployeeStatus): string {
    return `status-${status}`;
  }

  getStatusLabel(status: EmployeeStatus): string {
    const labels = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'on-vacation': 'Vacaciones',
      'sick-leave': 'Licencia médica'
    };
    return labels[status];
  }
}