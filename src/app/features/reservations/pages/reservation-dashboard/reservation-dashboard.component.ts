// features/reservations/pages/reservations-dashboard/reservations-dashboard.component.ts
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ReservationService } from '../../services/reservation.service';
import { ReservationStatsComponent } from '../../components/reservation-stats/reservation-stats.component';
import { ReservationTableComponent } from '../../components/reservation-table/reservation-table.component';
import { ReservationFiltersComponent } from '../../components/reservation-filters/reservation-filters.component';
import { RoomSidebarComponent } from '../../../rooms/components/room-sidebar/room-sidebar.component';
import { ReservationStatus } from '../../models/reservation.model';

@Component({
  selector: 'app-reservations-dashboard',
  standalone: true,
  imports: [
    RoomSidebarComponent,
    ReservationStatsComponent,
    ReservationTableComponent,
    ReservationFiltersComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-layout">
      <app-room-sidebar />
      
      <main class="main-content">
        <div class="header">
          <h1>Gestión de Reservas</h1>
          <p class="subtitle">Administra las reservas y el estado de los huéspedes</p>
        </div>

        <app-reservation-stats [stats]="reservationService.stats()" />

        <app-reservation-filters
          [confirmedCount]="reservationService.confirmedCount()"
          [checkedInCount]="reservationService.checkedInCount()"
          [checkedOutCount]="reservationService.checkedOutCount()"
          [pendingCount]="reservationService.pendingCount()"
          [cancelledCount]="reservationService.cancelledCount()"
          (onSearch)="handleSearch($event)"
          (onStatusFilter)="handleStatusFilter($event)" />

        <app-reservation-table
          [reservations]="reservationService.filteredReservations()"
          (onViewReservation)="viewReservation($event)"
          (onEditReservation)="editReservation($event)"
          (onCheckIn)="handleCheckIn($event)"
          (onCheckOut)="handleCheckOut($event)"
          (onCancelReservation)="handleCancelReservation($event)" />
      </main>
    </div>
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

    .header h1 {
      margin: 0;
      font-size: 1.875rem;
      font-weight: 700;
      color: #2D2926; /* Sidebar/Contrast: Gris Carbón */
      letter-spacing: -0.02em;
      position: relative;
      display: inline-block;
    }

    .header h1::before {
      content: '📅';
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

    /* Contenedor de estadísticas con espaciado */
    app-reservation-stats {
      display: block;
      margin-bottom: 1.5rem;
    }

    /* Contenedor de filtros con espaciado */
    app-reservation-filters {
      display: block;
      margin-bottom: 1.5rem;
    }

    /* Contenedor de tabla */
    app-reservation-table {
      display: block;
    }

    /* Animación de entrada para el contenido */
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

      .header h1 {
        font-size: 1.5rem;
      }

      .header h1::before {
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

      .header h1 {
        font-size: 1.25rem;
      }

      .header h1::before {
        font-size: 1rem;
        margin-right: 0.5rem;
      }

      .subtitle {
        font-size: 0.875rem;
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

    /* Scroll suave para toda la aplicación */
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
export class ReservationsDashboardComponent {
  reservationService = inject(ReservationService);

  handleSearch(term: string) {
    this.reservationService.setSearchTerm(term);
  }

  handleStatusFilter(status: 'all' | ReservationStatus) {
    this.reservationService.setStatusFilter(status);
  }

  viewReservation(id: number) {
    console.log('Ver reserva:', id);
  }

  editReservation(id: number) {
    console.log('Editar reserva:', id);
  }

  handleCheckIn(id: number) {
    this.reservationService.updateReservationStatus(id, 'checked-in');
  }

  handleCheckOut(id: number) {
    this.reservationService.updateReservationStatus(id, 'checked-out');
  }

  handleCancelReservation(id: number) {
    if (confirm('¿Estás seguro de cancelar esta reserva?')) {
      this.reservationService.updateReservationStatus(id, 'cancelled');
    }
  }
}