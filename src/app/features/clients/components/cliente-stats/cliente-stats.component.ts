import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { ClienteStats } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().total }}</div>
          <div class="stat-label">Total Clientes</div>
        </div>
      </div>

      <div class="stat-card status-activo">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().activos }}</div>
          <div class="stat-label">Activos</div>
        </div>
      </div>

      <div class="stat-card status-inactivo">
        <div class="stat-icon">⛔</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().inactivos }}</div>
          <div class="stat-label">Inactivos</div>
        </div>
      </div>
    </div>
  `,
  styles: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');
    * { font-family: 'Inter', sans-serif; }

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
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      border: 1px solid #EEE3D1;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 4px; height: 100%;
      background: #C5A048;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 16px -4px rgba(0,0,0,0.1); border-color: #C5A048; }
    .stat-card:hover::before { opacity: 1; }

    .stat-icon { font-size: 2.25rem; transition: transform 0.2s ease; }
    .stat-card:hover .stat-icon { transform: scale(1.05); }
    .stat-info { flex: 1; }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #2D2926;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .stat-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #8E6F2E;
      margin-top: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-activo .stat-value { color: #2E7D32; }
    .status-inactivo .stat-value { color: #DC2626; }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
      .stat-card { padding: 1rem; }
      .stat-value { font-size: 1.25rem; }
      .stat-icon { font-size: 1.75rem; }
    }
  `
})
export class ClienteStatsComponent {
  stats = input.required<ClienteStats>();
}
