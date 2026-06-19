import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { ReservaStats } from '../../models/reservation.model';

@Component({
  selector: 'app-reservation-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().total }}</div>
          <div class="stat-label">Total Reservas</div>
        </div>
      </div>

      <div class="stat-card status-confirmed">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().confirmada }}</div>
          <div class="stat-label">Confirmadas</div>
        </div>
      </div>

      <div class="stat-card status-checked-in">
        <div class="stat-icon">🏨</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().checkIn }}</div>
          <div class="stat-label">Hospedados</div>
        </div>
      </div>

      <div class="stat-card status-checked-out">
        <div class="stat-icon">🚪</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().checkOut }}</div>
          <div class="stat-label">Check-out</div>
        </div>
      </div>

      <div class="stat-card status-pending">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().pendiente }}</div>
          <div class="stat-label">Pendientes</div>
        </div>
      </div>

      <div class="stat-card status-today">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <div class="stat-value">
            {{ stats().todayCheckIns }} / {{ stats().todayCheckOuts }}
          </div>
          <div class="stat-label">Check-in / Check-out hoy</div>
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
      font-size: 1.75rem;
      font-weight: 700;
      color: #2D2926; /* Sidebar/Contrast: Gris Carbón */
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .stat-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #8E6F2E; /* Secondary: Ocre Oscuro */
      margin-top: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Colores específicos por estado - usando la paleta */
    .status-confirmed .stat-value {
      color: #2E7D32; /* Verde oscuro */
    }

    .status-checked-in .stat-value {
      color: #C5A048; /* Primary: Dorado Principal */
    }

    .status-checked-out .stat-value {
      color: #6B7280; /* Gris neutral */
    }

    .status-pending .stat-value {
      color: #E6A017; /* Ámbar */
    }

    .status-cancelled .stat-value {
      color: #DC2626; /* Rojo */
    }

    .status-today .stat-value {
      color: #8E6F2E; /* Secondary: Ocre Oscuro */
      font-size: 1.5rem;
    }

    /* Iconos específicos por estado con color de fondo sutil */
    .status-confirmed .stat-icon {
      filter: drop-shadow(0 2px 4px rgba(46, 125, 50, 0.2));
    }

    .status-checked-in .stat-icon {
      filter: drop-shadow(0 2px 4px rgba(197, 160, 72, 0.2));
    }

    .status-pending .stat-icon {
      filter: drop-shadow(0 2px 4px rgba(230, 160, 23, 0.2));
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.875rem;
      }

      .stat-value {
        font-size: 1.5rem;
      }

      .stat-icon {
        font-size: 2rem;
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
        font-size: 1.25rem;
      }

      .status-today .stat-value {
        font-size: 1.125rem;
      }

      .stat-icon {
        font-size: 1.75rem;
      }

      .stat-label {
        font-size: 0.7rem;
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
        font-size: 1.125rem;
      }

      .stat-icon {
        font-size: 1.5rem;
      }
    }
  `
})
export class ReservationStatsComponent {
  stats = input.required<ReservaStats>();
}