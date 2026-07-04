// features/rooms/components/room-filters/room-filters.component.ts
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RoomService } from '../../services/room.service';
import { RoomStatus } from '../../models/room.model';

@Component({
  selector: 'app-room-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    role: 'region',
    'aria-label': 'Room filters'
  },
  template: `
    <div class="filters">
      <h3>Filtrar:</h3>
      <div class="filter-buttons">
        @for (filter of filters; track filter.value) {
          <button
            class="filter-btn"
            [class.active]="activeFilter() === filter.value"
            (click)="onFilterChange(filter.value)"
            [attr.aria-pressed]="activeFilter() === filter.value">
            {{ filter.label }}
            @if (filter.value !== 'all') {
              <span class="count">({{ getCountForFilter(filter.value) }})</span>
            }
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    /* Importar fuente Inter */
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');

    * {
      font-family: 'Inter', sans-serif;
    }

    .filters {
      background: white;
      padding: 1.25rem;
      border-radius: 0.75rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      border: 1px solid #EEE3D1; /* Details: Crema Suave */
      transition: all 0.2s ease;
    }

    .filters h3 {
      margin: 0 0 1rem 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #2D2926; /* Sidebar/Contrast: Gris Carbón */
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .filter-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .filter-btn {
      padding: 0.625rem 1.25rem;
      border: 1.5px solid #EEE3D1; /* Details: Crema Suave */
      background: #F9F5F0; /* Background: Blanco Hueso */
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      font-weight: 500;
      color: #2D2926; /* Sidebar/Contrast: Gris Carbón */
    }

    .filter-btn:hover {
      background: #FFF;
      border-color: #C5A048; /* Primary: Dorado Principal */
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(197, 160, 72, 0.15);
    }

    .filter-btn.active {
      background: #C5A048; /* Primary: Dorado Principal */
      border-color: #C5A048;
      color: white;
      box-shadow: 0 2px 8px rgba(197, 160, 72, 0.3);
    }

    .count {
      margin-left: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      opacity: 0.8;
    }

    .filter-btn.active .count {
      color: white;
      opacity: 0.95;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .filters {
        padding: 1rem;
      }

      .filter-buttons {
        gap: 0.5rem;
      }

      .filter-btn {
        padding: 0.5rem 0.875rem;
        font-size: 0.75rem;
      }
    }
  `
})
export class RoomFiltersComponent {
  private roomService = inject(RoomService);
  
  activeFilter = this.roomService['selectedFilter'].asReadonly();
  
  filters = [
    { label: 'Todos', value: 'all' as const },
    { label: 'Disponible', value: 'available' as const },
    { label: 'Ocupado', value: 'occupied' as const },
    { label: 'Reservado', value: 'reserved' as const },
    { label: 'Limpieza', value: 'cleaning' as const },
    { label: 'Mantenimiento', value: 'maintenance' as const }
  ];

  onFilterChange(filter: 'all' | RoomStatus) {
    this.roomService.setFilter(filter);
  }

  getCountForFilter(filterValue: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance'): number {
    const stats = this.roomService.stats();
    switch(filterValue) {
      case 'available': return stats.available;
      case 'occupied': return stats.occupied;
      case 'reserved': return stats.reserved;
      case 'cleaning': return stats.cleaning;
      case 'maintenance': return stats.maintenance;
      default: return 0;
    }
  }
}