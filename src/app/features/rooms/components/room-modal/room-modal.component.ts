// features/rooms/components/room-modal/room-modal.component.ts
import { Component, input, output, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { Room, RoomStatus } from '../../models/room.model';
import { RoomService } from '../../services/room.service';

@Component({
  selector: 'app-room-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.open]': 'isOpen()',
    '(document:keydown.escape)': 'onClose.emit()',
    'role': 'dialog',
    'aria-modal': 'true',
    '[attr.aria-label]': "'Detalles de la habitación ' + (room()?.number || '')"
  },
  template: `
    @if (isOpen() && room()) {
      <div class="modal-overlay" (click)="onClose.emit()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="onClose.emit()" aria-label="Cerrar modal">
            ✕
          </button>

          <div class="modal-header">
            <h2>Habitación {{ room()!.number }}</h2>
          </div>

          <div class="modal-body">
            <div class="room-details">
              <div class="detail-item">
                <span class="detail-label">Tipo:</span>
                <span class="detail-value">{{ getRoomTypeLabel() }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Precio:</span>
                <span class="detail-value">{{ getRoomPrice() }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Piso:</span>
                <span class="detail-value">{{ getRoomFloor() }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Estado actual:</span>
                <span class="detail-value status-badge" [class]="getStatusClass()">
                  {{ getStatusLabel() }}
                </span>
              </div>

              @if (room()!.guestName) {
                <div class="detail-item">
                  <span class="detail-label">Huésped:</span>
                  <span class="detail-value">👤 {{ room()!.guestName }}</span>
                </div>
              }
            </div>

            <div class="status-section">
              <h3>Cambiar estado:</h3>
              <div class="status-options">
                @for (statusOption of statusOptions; track statusOption.value) {
                  <label class="status-option">
                    <input
                      type="radio"
                      name="roomStatus"
                      [value]="statusOption.value"
                      [checked]="room()!.status === statusOption.value"
                      (change)="onStatusChange(statusOption.value)"
                      [attr.aria-label]="'Marcar como ' + statusOption.label">
                    <span class="status-label" [class]="getStatusClassForOption(statusOption.value)">
                      {{ statusOption.label }}
                    </span>
                  </label>
                }
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn btn-primary" (click)="saveChanges()" [disabled]="!hasChanges()">
                Guardar cambios
              </button>
              <button class="btn btn-secondary" (click)="onClose.emit()">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    /* Importar fuente Inter */
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');

    * {
      font-family: 'Inter', sans-serif;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(45, 41, 38, 0.85); /* Sidebar/Contrast con opacidad */
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .modal-overlay.open {
      opacity: 1;
      visibility: visible;
    }

    .modal-content {
      background: #F9F5F0; /* Background: Blanco Hueso */
      border-radius: 1rem;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      animation: modalSlideIn 0.3s ease;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    @keyframes modalSlideIn {
      from {
        transform: translateY(-50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-close {
      position: absolute;
      top: 16px;
      right: 16px;
      background: #F9F5F0;
      border: 1px solid #EEE3D1;
      font-size: 20px;
      cursor: pointer;
      color: #8E6F2E;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
      z-index: 10;
    }

    .modal-close:hover {
      background: #C5A048;
      border-color: #C5A048;
      color: white;
      transform: scale(1.05);
    }

    .modal-header {
      padding: 24px 24px 16px;
      border-bottom: 2px solid #C5A048; /* Primary: Dorado Principal */
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #2D2926; /* Sidebar/Contrast: Gris Carbón */
      letter-spacing: -0.02em;
    }

    .modal-body {
      padding: 24px;
    }

    .room-details {
      margin-bottom: 24px;
      background: white;
      border-radius: 0.75rem;
      padding: 0.5rem;
      border: 1px solid #EEE3D1;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #EEE3D1;
    }

    .detail-item:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-weight: 600;
      color: #8E6F2E; /* Secondary: Ocre Oscuro */
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      color: #2D2926; /* Sidebar/Contrast: Gris Carbón */
      font-size: 1rem;
      font-weight: 500;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

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
      color: #C5A048;
    }

    .status-cleaning .status-badge {
      background: #E3F2FD;
      color: #1565C0;
    }

    .status-maintenance .status-badge {
      background: #F3E5F5;
      color: #6A1B9A;
    }

    .status-section {
      margin: 24px 0;
    }

    .status-section h3 {
      margin: 0 0 16px 0;
      font-size: 1rem;
      font-weight: 600;
      color: #2D2926;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .status-option {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 10px 12px;
      border-radius: 0.5rem;
      transition: all 0.2s;
      border: 1px solid #EEE3D1;
      background: white;
    }

    .status-option:hover {
      background: #F9F5F0;
      border-color: #C5A048;
    }

    .status-option input[type="radio"] {
      cursor: pointer;
      width: 18px;
      height: 18px;
      accent-color: #C5A048; /* Dorado Principal */
    }

    .status-label {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #EEE3D1;
    }

    .btn {
      padding: 10px 24px;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      font-family: 'Inter', sans-serif;
    }

    .btn-primary {
      background: #C5A048; /* Primary: Dorado Principal */
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #8E6F2E; /* Secondary: Ocre Oscuro */
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(197, 160, 72, 0.3);
    }

    .btn-primary:disabled {
      background: #EEE3D1;
      cursor: not-allowed;
      color: #8E6F2E;
    }

    .btn-secondary {
      background: #F9F5F0;
      color: #2D2926;
      border: 1px solid #EEE3D1;
    }

    .btn-secondary:hover {
      background: #EEE3D1;
      border-color: #C5A048;
    }

    /* Scrollbar personalizada */
    .modal-content::-webkit-scrollbar {
      width: 8px;
    }

    .modal-content::-webkit-scrollbar-track {
      background: #EEE3D1;
      border-radius: 4px;
    }

    .modal-content::-webkit-scrollbar-thumb {
      background: #C5A048;
      border-radius: 4px;
    }

    .modal-content::-webkit-scrollbar-thumb:hover {
      background: #8E6F2E;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .modal-content {
        width: 95%;
        max-height: 85vh;
      }

      .modal-header h2 {
        font-size: 1.25rem;
      }

      .detail-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .detail-value {
        width: 100%;
      }

      .modal-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `
})
export class RoomModalComponent {
  private roomService = inject(RoomService);
  
  isOpen = input.required<boolean>();
  room = input<Room | null>(null);
  onClose = output();
  onSave = output<{ roomId: number; status: RoomStatus }>();

  private selectedStatus: RoomStatus | null = null;

  statusOptions = [
    { label: 'Disponible', value: 'available' as const },
    { label: 'Ocupado', value: 'occupied' as const },
    { label: 'Reservado', value: 'reserved' as const },
    { label: 'Limpieza', value: 'cleaning' as const },
    { label: 'Mantenimiento', value: 'maintenance' as const }
  ];

  getRoomTypeLabel(): string {
    const types: Record<string, string> = {
      simple: 'Simple',
      double: 'Doble',
      suite: 'Suite'
    };
    return types[this.room()?.type || 'simple'];
  }

  getRoomPrice(): string {
    const prices: Record<string, number> = {
      simple: 120,
      double: 180,
      suite: 250
    };
    const price = prices[this.room()?.type || 'simple'];
    return `S/. ${price}`;
  }

  getRoomFloor(): string {
    const roomNumber = this.room()?.number || '000';
    const floor = Math.floor(parseInt(roomNumber) / 100);
    return floor.toString();
  }

  getStatusLabel(): string {
    const labels: Record<string, string> = {
      available: 'Disponible',
      occupied: 'Ocupado',
      reserved: 'Reservado',
      cleaning: 'Limpieza',
      maintenance: 'Mantenimiento'
    };
    return labels[this.room()?.status || 'available'];
  }

  getStatusClass(): string {
    return `status-${this.room()?.status}`;
  }

  getStatusClassForOption(status: RoomStatus): string {
    return `status-${status}`;
  }

  onStatusChange(status: RoomStatus) {
    this.selectedStatus = status;
  }

  hasChanges(): boolean {
    return this.selectedStatus !== null && this.selectedStatus !== this.room()?.status;
  }

  saveChanges() {
    if (this.hasChanges() && this.room() && this.selectedStatus) {
      this.onSave.emit({
        roomId: this.room()!.id,
        status: this.selectedStatus
      });
      this.selectedStatus = null;
    }
  }
}