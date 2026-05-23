// features/employees/components/employee-stats/employee-stats.component.ts
import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { EmployeeStats } from '../../models/employee.model';

@Component({
  selector: 'app-employee-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().total }}</div>
          <div class="stat-label">Total Empleados</div>
        </div>
      </div>

      <div class="stat-card status-active">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().active }}</div>
          <div class="stat-label">Activos</div>
        </div>
      </div>

      <div class="stat-card status-inactive">
        <div class="stat-icon">❌</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().inactive }}</div>
          <div class="stat-label">Inactivos</div>
        </div>
      </div>

      <div class="stat-card status-vacation">
        <div class="stat-icon">🏖️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().onVacation }}</div>
          <div class="stat-label">Vacaciones</div>
        </div>
      </div>

      <div class="stat-card status-role">
        <div class="stat-icon">🛎️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().reception }}</div>
          <div class="stat-label">Recepción</div>
        </div>
      </div>

      <div class="stat-card status-role">
        <div class="stat-icon">🧹</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().cleaning }}</div>
          <div class="stat-label">Limpieza</div>
        </div>
      </div>
    </div>
 `,
  styles: `
    /* Importar fuente Inter */
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');

    * {
      font-family: 'Inter', sans-serif;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.25rem;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      transition: all 0.3s ease;
      border: 1px solid #EEE3D1; /* Details: Crema Suave */
      cursor: default;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: #C5A048; /* Primary: Dorado Principal */
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
      border-color: #C5A048;
    }

    .stat-card:hover::before {
      opacity: 1;
    }

    .stat-icon {
      font-size: 2.25rem;
      transition: transform 0.2s ease;
    }

    .stat-card:hover .stat-icon {
      transform: scale(1.05);
    }

    .stat-info {
      flex: 1;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2D2926; /* Sidebar/Contrast: Gris Carbón */
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .stat-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: #8E6F2E; /* Secondary: Ocre Oscuro */
      margin-top: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Estados */
    .status-active .stat-value {
      color: #2E7D32; /* Verde oscuro */
    }

    .status-inactive .stat-value {
      color: #C62828; /* Rojo */
    }

    .status-vacation .stat-value {
      color: #C5A048; /* Dorado Principal */
    }

    .status-sick-leave .stat-value {
      color: #E65100; /* Naranja oscuro */
    }

    /* Roles */
    .status-role-reception .stat-value {
      color: #1565C0; /* Azul */
    }

    .status-role-cleaning .stat-value {
      color: #2E7D32; /* Verde */
    }

    .status-role-maintenance .stat-value {
      color: #C5A048; /* Dorado */
    }

    .status-role-security .stat-value {
      color: #4338CA; /* Índigo */
    }

    .status-role-management .stat-value {
      color: #6B21A5; /* Púrpura */
    }

    /* Iconos con sombra específica */
    .status-active .stat-icon {
      filter: drop-shadow(0 2px 4px rgba(46, 125, 50, 0.2));
    }

    .status-role-reception .stat-icon {
      filter: drop-shadow(0 2px 4px rgba(21, 101, 192, 0.2));
    }

    .status-role-management .stat-icon {
      filter: drop-shadow(0 2px 4px rgba(107, 33, 168, 0.2));
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.875rem;
      }

      .stat-value {
        font-size: 1.25rem;
      }

      .stat-icon {
        font-size: 2rem;
      }
    }

    @media (max-width: 992px) {
      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }

      .stat-card {
        padding: 1rem;
      }

      .stat-value {
        font-size: 1.125rem;
      }

      .stat-icon {
        font-size: 1.5rem;
      }

      .stat-label {
        font-size: 0.65rem;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 0.625rem;
      }

      .stat-card {
        padding: 0.875rem;
      }

      .stat-value {
        font-size: 1rem;
      }

      .stat-icon {
        font-size: 1.25rem;
      }
    }
  `
})
export class EmployeeStatsComponent {
  stats = input.required<EmployeeStats>();
}