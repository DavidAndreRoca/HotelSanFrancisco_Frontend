// features/rooms/components/room-card/room-card.component.ts (actualizado)
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Room, RoomStatus } from '../../models/room.model';

@Component({
  selector: 'app-room-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    'aria-label': 'Room card'
  },
  template: `
    <div class="room-card" [class]="getStatusClass()" (click)="onCardClick.emit()">
      <div class="room-number">{{ room().number }}</div>
      <div class="room-type">{{ getRoomTypeLabel() }}</div>
      
      @if (room().guestName) {
        <div class="guest-name" aria-label="Guest name">
          👤 {{ room().guestName }}
        </div>
      }
      
      <div class="status-badge" [attr.aria-label]="'Status: ' + getStatusLabel()">
        {{ getStatusLabel() }}
      </div>
      
      <div class="room-actions" (click)="$event.stopPropagation()">
        <button
          class="action-btn"
          (click)="onStatusChange.emit({ roomId: room().id, status: 'available' })"
          [attr.aria-label]="'Mark room ' + room().number + ' as available'"
          title="Marcar como disponible">
          🟢
        </button>
        <button
          class="action-btn"
          (click)="onStatusChange.emit({ roomId: room().id, status: 'occupied' })"
          [attr.aria-label]="'Mark room ' + room().number + ' as occupied'"
          title="Marcar como ocupado">
          🔴
        </button>
        <button
          class="action-btn"
          (click)="onStatusChange.emit({ roomId: room().id, status: 'reserved' })"
          [attr.aria-label]="'Mark room ' + room().number + ' as reserved'"
          title="Marcar como reservado">
          🟡
        </button>
      </div>
    </div>
 `,
  styles: `
    /* Importar fuente Inter */
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');

    * {
      font-family: 'Inter', sans-serif;
    }

    .room-card {
      padding: 1.25rem;
      border-radius: 0.75rem;
      border: 1px solid #EEE3D1; /* Details: Crema Suave */
      transition: all 0.3s ease;
      background: white;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .room-card:hover {
      box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
      transform: translateY(-3px);
      border-color: #C5A048; /* Primary: Dorado Principal al hover */
    }

    .room-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2D2926; /* Sidebar/Contrast: Gris Carbón */
      letter-spacing: -0.02em;
    }

    .room-type {
      font-size: 0.875rem;
      color: #8E6F2E; /* Secondary: Ocre Oscuro */
      margin-top: 0.25rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .guest-name {
      font-size: 0.875rem;
      color: #2D2926; /* Sidebar/Contrast: Gris Carbón */
      margin-top: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
      border-top: 1px solid #EEE3D1; /* Details: Crema Suave */
      font-weight: 500;
    }

    .status-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      margin-top: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* Estados de habitación */
    .status-available .status-badge {
      background: #E8F5E9;
      color: #2E7D32;
    }

    .status-occupied .status-badge {
      background: #FFEBEE;
      color: #C62828;
    }

    .status-reserved .status-badge {
      background: #FFF8E1;
      color: #C5A048; /* Primary: Dorado Principal */
    }

    .status-cleaning .status-badge {
      background: #E3F2FD;
      color: #1565C0;
    }

    .status-maintenance .status-badge {
      background: #F3E5F5;
      color: #6A1B9A;
    }

    /* Fondo de tarjeta por estado */
    .status-available {
      background: linear-gradient(135deg, #FFFFFF 0%, #F9F5F0 100%);
    }

    .status-occupied {
      background: linear-gradient(135deg, #FFFFFF 0%, #FEF9E7 100%);
    }

    .status-reserved {
      background: linear-gradient(135deg, #FFFFFF 0%, #FFFDF5 100%);
    }

    .room-actions {
      margin-top: 1rem;
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      padding-top: 0.75rem;
      border-top: 1px solid #EEE3D1; /* Details: Crema Suave */
    }

    .action-btn {
      border: none;
      background: #F9F5F0; /* Background: Blanco Hueso */
      cursor: pointer;
      font-size: 1.25rem;
      padding: 0.5rem;
      transition: all 0.2s ease;
      border-radius: 0.5rem;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-btn:hover {
      transform: scale(1.1);
      background: #C5A048; /* Primary: Dorado Principal */
      box-shadow: 0 2px 8px rgba(197, 160, 72, 0.3);
    }

    /* Responsive */
    @media (max-width: 640px) {
      .room-card {
        padding: 1rem;
      }

      .room-number {
        font-size: 1.25rem;
      }

      .action-btn {
        width: 32px;
        height: 32px;
        font-size: 1rem;
      }
    }
  `
})
export class RoomCardComponent {
  room = input.required<Room>();
  onStatusChange = output<{ roomId: number; status: RoomStatus }>();
  onCardClick = output<void>();
  
  getRoomTypeLabel(): string {
    const types: Record<string, string> = {
      simple: 'Simple',
      double: 'Doble',
      suite: 'Suite'
    };
    return types[this.room().type] || this.room().type;
  }

  getStatusClass() {
    const status = this.room().status;
    const classes: Record<string, string> = {
      available: 'status-available',
      occupied: 'status-occupied',
      reserved: 'status-reserved',
      cleaning: 'status-cleaning',
      maintenance: 'status-maintenance'
    };
    return classes[status];
  }

  getStatusLabel() {
    const labels: Record<string, string> = {
      available: 'Disponible',
      occupied: 'Ocupado',
      reserved: 'Reservado',
      cleaning: 'Limpieza',
      maintenance: 'Mantenimiento'
    };
    return labels[this.room().status];
  }
}