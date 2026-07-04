// features/rooms/pages/rooms-dashboard/rooms-dashboard.component.ts (actualizado)
import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { RoomService } from '../../services/room.service';
import { RoomCardComponent } from '../../components/room-card/room-card.component';
import { RoomFiltersComponent } from '../../components/room-filters/room-filter.component';
import { RoomSidebarComponent } from '../../components/room-sidebar/room-sidebar.component';
import { RoomModalComponent } from '../../components/room-modal/room-modal.component';
import { Room, RoomStatus } from '../../models/room.model';

@Component({
  selector: 'app-rooms-dashboard',
  standalone: true,
  imports: [RoomCardComponent, RoomFiltersComponent, RoomSidebarComponent, RoomModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-layout" (click)="closeModal()">
      <app-room-sidebar />
      
      <main class="main-content">
        <div class="header">
          <h1>Gestión de Habitaciones</h1>
          <p class="subtitle">Administra el estado y disponibilidad de las habitaciones</p>
        </div>

        <app-room-filters />

        <div class="rooms-grid">
          @for (room of roomService.filteredRooms(); track room.id) {
            <app-room-card
              [room]="room"
              (onStatusChange)="handleQuickStatusChange($event)"
              (onCardClick)="openModal(room)" />
          } @empty {
            <div class="empty-state">
              No hay habitaciones que coincidan con los filtros seleccionados.
            </div>
          }
        </div>
      </main>
    </div>

    <!-- Modal -->
    <app-room-modal
      [isOpen]="isModalOpen()"
      [room]="selectedRoom()"
      (onClose)="closeModal()"
      (onSave)="handleModalSave($event)" />
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
      background: #F9F5F0; /* Background (App): Blanco Hueso */
    }

    .main-content {
      flex: 1;
      margin-left: 250px;
      padding: 2rem;
      background: #F9F5F0; /* Background (App): Blanco Hueso */
    }

    .header {
      margin-bottom: 2rem;
    }

    .header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.875rem;
      font-weight: 700;
      color: #2D2926; /* Sidebar/Contrast: Gris Carbón para texto principal */
      letter-spacing: -0.02em;
    }

    .subtitle {
      color: #8E6F2E; /* Secondary: Ocre Oscuro para subtítulos */
      margin: 0;
      font-size: 1rem;
      font-weight: 400;
    }

    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 0.5rem;
      color: #8E6F2E; /* Secondary: Ocre Oscuro */
      border: 1px solid #EEE3D1; /* Details: Crema Suave */
      font-size: 0.875rem;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
        padding: 1rem;
      }

      .header h1 {
        font-size: 1.5rem;
      }

      .rooms-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
  `
})
export class RoomsDashboardComponent {
  roomService = inject(RoomService);
  
  isModalOpen = signal(false);
  selectedRoom = signal<Room | null>(null);

  openModal(room: Room) {
    this.selectedRoom.set(room);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedRoom.set(null);
  }

  handleQuickStatusChange(event: { roomId: number; status: RoomStatus }) {
    this.roomService.updateRoomStatus(event.roomId, event.status);
  }

  handleModalSave(event: { roomId: number; status: RoomStatus }) {
    this.roomService.updateRoomStatus(event.roomId, event.status);
    this.closeModal();
  }
}