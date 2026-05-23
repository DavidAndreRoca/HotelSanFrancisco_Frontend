// features/guests/pages/guests-dashboard/guests-dashboard.component.ts
import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { GuestService } from '../../services/guest.service';
import { GuestStatsComponent } from '../../components/guest-stats/guest-stats.component';
import { GuestTableComponent } from '../../components/guest-table/guest-table.component';
import { GuestFiltersComponent } from '../../components/guest-filters/guest-filters.component';
import { GuestModalComponent } from '../../components/guest-modal/guest-modal.component';
import { RoomSidebarComponent } from '../../../rooms/components/room-sidebar/room-sidebar.component';
import { GuestStatus, GuestType, Guest } from '../../models/guest.model';

@Component({
  selector: 'app-guests-dashboard',
  standalone: true,
  imports: [
    RoomSidebarComponent,
    GuestStatsComponent,
    GuestTableComponent,
    GuestFiltersComponent,
    GuestModalComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-layout">
      <app-room-sidebar />
      
      <main class="main-content">
        <div class="header">
          <h1>Gestión de Huéspedes</h1>
          <p class="subtitle">Registro y administración de clientes</p>
        </div>

        <app-guest-stats [stats]="guestService.stats()" />

        <app-guest-filters
          [checkedInCount]="guestService.checkedInCount()"
          [checkedOutCount]="guestService.checkedOutCount()"
          [reservedCount]="guestService.reservedCount()"
          [noShowCount]="guestService.noShowCount()"
          [regularCount]="guestService.typeCounts().regular"
          [vipCount]="guestService.typeCounts().vip"
          [corporateCount]="guestService.typeCounts().corporate"
          (onSearch)="handleSearch($event)"
          (onStatusFilter)="handleStatusFilter($event)"
          (onTypeFilter)="handleTypeFilter($event)" />

        <app-guest-table
          [guests]="guestService.filteredGuests()"
          (onAddGuest)="openAddModal()"
          (onViewGuest)="viewGuest($event)"
          (onEditGuest)="editGuest($event)"
          (onDeleteGuest)="deleteGuest($event)" />
      </main>
    </div>

    <!-- Modal de huésped -->
    <app-guest-modal
      [isOpen]="isModalOpen()"
      [guest]="selectedGuest()"
      [mode]="modalMode()"
      (onClose)="closeModal()"
      (onSave)="saveGuest($event)" />
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
      content: '👥';
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
      background: linear-gradient(135deg, #C5A048 0%, #8E6F2E 100%);
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      text-align: center;
      box-shadow: 0 4px 12px rgba(197, 160, 72, 0.25);
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
      color: white;
      line-height: 1;
    }

    .quick-stat-label {
      font-size: 0.7rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Contenedores de componentes */
    app-guest-stats {
      display: block;
      margin-bottom: 1.5rem;
    }

    app-guest-filters {
      display: block;
      margin-bottom: 1.5rem;
    }

    app-guest-table {
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
      }

      .quick-stat-value {
        font-size: 1.25rem;
      }

      .quick-stat-label {
        font-size: 0.65rem;
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
export class GuestsDashboardComponent {
  guestService = inject(GuestService);
  
  isModalOpen = signal(false);
  selectedGuest = signal<Guest | null>(null);
  modalMode = signal<'view' | 'edit' | 'create'>('create');

  handleSearch(term: string) {
    this.guestService.setSearchTerm(term);
  }

  handleStatusFilter(status: GuestStatus | 'all') {
    this.guestService.setStatusFilter(status);
  }

  handleTypeFilter(type: GuestType | 'all') {
    this.guestService.setTypeFilter(type);
  }

  openAddModal() {
    this.selectedGuest.set(null);
    this.modalMode.set('create');
    this.isModalOpen.set(true);
  }

  viewGuest(id: number) {
    const guest = this.guestService.filteredGuests().find(g => g.id === id);
    if (guest) {
      this.selectedGuest.set(guest);
      this.modalMode.set('view');
      this.isModalOpen.set(true);
    }
  }

  editGuest(id: number) {
    const guest = this.guestService.filteredGuests().find(g => g.id === id);
    if (guest) {
      this.selectedGuest.set(guest);
      this.modalMode.set('edit');
      this.isModalOpen.set(true);
    }
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedGuest.set(null);
  }

  saveGuest(guestData: any) {
    if (this.modalMode() === 'edit' && this.selectedGuest()) {
      this.guestService.updateGuest(this.selectedGuest()!.id, guestData);
    } else if (this.modalMode() === 'create') {
      this.guestService.addGuest(guestData);
    }
    this.closeModal();
  }

  deleteGuest(id: number) {
    this.guestService.deleteGuest(id);
  }
}