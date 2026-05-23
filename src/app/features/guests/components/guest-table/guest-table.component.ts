// features/guests/components/guest-table/guest-table.component.ts
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Guest, GuestStatus, GuestType } from '../../models/guest.model';

@Component({
  selector: 'app-guest-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-container">
      <div class="table-header">
        <button class="add-btn" (click)="onAddGuest.emit()">
          ➕ Nuevo Huésped
        </button>
      </div>

      <table class="guest-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Teléfono</th>
            <th>Estadías</th>
            <th>Última visita</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (guest of guests(); track guest.id) {
            <tr>
              <td class="name-cell">
                <div class="guest-name">{{ guest.name }}</div>
                <div class="guest-type">
                  <span class="type-badge" [class]="getTypeClass(guest.type)">
                    {{ getTypeLabel(guest.type) }}
                  </span>
                </div>
              </td>
              <td>{{ guest.document }}</td>
              <td>{{ guest.phone }}</td>
              <td class="stays-cell">
                <span class="stays-count">{{ guest.totalStays }}</span>
                <span class="stays-label">estadías</span>
              </td>
              <td>{{ formatDate(guest.lastVisit) }}</td>
              <td>
                <span class="status-badge" [class]="getStatusClass(guest.status)">
                  {{ getStatusLabel(guest.status) }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    class="action-btn view-btn"
                    (click)="onViewGuest.emit(guest.id)"
                    title="Ver detalles">
                    👁️
                  </button>
                  <button 
                    class="action-btn edit-btn"
                    (click)="onEditGuest.emit(guest.id)"
                    title="Editar huésped">
                    ✏️
                  </button>
                  <button 
                    class="action-btn delete-btn"
                    (click)="onDeleteGuest.emit(guest.id)"
                    title="Eliminar huésped">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7" class="empty-table">
                No se encontraron huéspedes
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

    .guest-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 900px;
    }

    .guest-table th {
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

    .guest-table td {
      padding: 1rem;
      border-bottom: 1px solid #EEE3D1;
      vertical-align: middle;
      font-size: 0.875rem;
      color: #2D2926;
    }

    .guest-table tr {
      transition: background 0.2s ease;
    }

    .guest-table tr:hover {
      background: #F9F5F0;
    }

    /* Estilo para filas según estado */
    .guest-table tr.row-checked-in:hover {
      background: #FEF9E7;
    }

    .guest-table tr.row-checked-out:hover {
      background: #F5F3F0;
    }

    .guest-table tr.row-reserved:hover {
      background: #FFFDF5;
    }

    .name-cell {
      min-width: 220px;
    }

    .guest-name {
      font-weight: 600;
      color: #2D2926;
      font-size: 0.875rem;
    }

    .guest-email {
      font-size: 0.7rem;
      color: #8E6F2E;
      margin-top: 0.25rem;
    }

    .guest-type {
      margin-top: 0.375rem;
    }

    .type-badge {
      display: inline-block;
      padding: 0.1875rem 0.625rem;
      border-radius: 0.25rem;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .type-regular {
      background: #E2E8F0;
      color: #475569;
    }

    .type-vip {
      background: linear-gradient(135deg, #FFF8E1, #FEF3C7);
      color: #C5A048;
      border: 1px solid #FDE68A;
    }

    .type-corporate {
      background: #E0E7FF;
      color: #4338CA;
    }

    .document-cell {
      font-family: 'Courier New', monospace;
      font-size: 0.8125rem;
      color: #6B7280;
      letter-spacing: 0.5px;
    }

    .phone-cell {
      font-family: 'Courier New', monospace;
      font-size: 0.8125rem;
      color: #2D2926;
    }

    .stays-cell {
      text-align: center;
    }

    .stays-wrapper {
      display: inline-flex;
      align-items: baseline;
      gap: 0.25rem;
      background: #F9F5F0;
      padding: 0.25rem 0.5rem;
      border-radius: 2rem;
    }

    .stays-count {
      font-size: 1rem;
      font-weight: 700;
      color: #C5A048;
    }

    .stays-label {
      font-size: 0.65rem;
      color: #8E6F2E;
    }

    .date-cell {
      font-size: 0.8125rem;
      color: #6B7280;
      font-family: 'Courier New', monospace;
    }

    .status-cell {
      text-align: center;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 2rem;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .status-checked-in {
      background: #E8F5E9;
      color: #2E7D32;
    }

    .status-checked-out {
      background: #F5F5F5;
      color: #6B7280;
    }

    .status-reserved {
      background: #FFF8E1;
      color: #C5A048;
    }

    .status-no-show {
      background: #FFEBEE;
      color: #C62828;
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

    .view-btn:hover { 
      background: #E3F2FD; 
      color: #1565C0;
    }
    .edit-btn:hover { 
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

      .guest-table th,
      .guest-table td {
        padding: 0.75rem;
      }

      .action-buttons {
        flex-direction: column;
        gap: 0.25rem;
      }

      .action-btn {
        width: 32px;
        height: 32px;
      }

      .stays-wrapper {
        flex-direction: column;
        align-items: center;
        gap: 0;
      }
    }
  `
})
export class GuestTableComponent {
  guests = input.required<Guest[]>();
  onAddGuest = output<void>();
  onViewGuest = output<number>();
  onEditGuest = output<number>();
  onDeleteGuest = output<number>();

  formatDate(date: Date): string {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  getStatusClass(status: GuestStatus): string {
    return `status-${status}`;
  }

  getStatusLabel(status: GuestStatus): string {
    const labels = {
      'checked-in': 'Hospedado',
      'checked-out': 'Check-out',
      'reserved': 'Reservado',
      'no-show': 'No show'
    };
    return labels[status];
  }

  getTypeClass(type: GuestType): string {
    return `type-${type}`;
  }

  getTypeLabel(type: GuestType): string {
    const labels = {
      'regular': 'Regular',
      'vip': 'VIP',
      'corporate': 'Corporativo'
    };
    return labels[type];
  }
}