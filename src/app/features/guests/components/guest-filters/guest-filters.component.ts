// features/guests/components/guest-filters/guest-filters.component.ts
import { Component, output, ChangeDetectionStrategy, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GuestStatus, GuestType } from '../../models/guest.model';

@Component({
  selector: 'app-guest-filters',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          [formControl]="searchControl"
          placeholder="Buscar por nombre, documento, teléfono o email..."
          class="search-input"
          aria-label="Buscar huéspedes">
      </div>

      <div class="filter-groups">
        <div class="filter-group">
          <label class="filter-label">Estado:</label>
          <div class="filter-buttons">
            @for (filter of statusFilters; track filter.value) {
              <button
                class="filter-btn"
                [class.active]="selectedStatus === filter.value"
                (click)="onStatusFilterChange(filter.value)">
                {{ filter.label }}
                @if (filter.value !== 'all') {
                  <span class="filter-count">{{ getStatusCount(filter.value) }}</span>
                }
              </button>
            }
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">Tipo:</label>
          <div class="filter-buttons">
            @for (filter of typeFilters; track filter.value) {
              <button
                class="filter-btn"
                [class.active]="selectedType === filter.value"
                (click)="onTypeFilterChange(filter.value)">
                {{ filter.label }}
                @if (filter.value !== 'all') {
                  <span class="filter-count">{{ getTypeCount(filter.value) }}</span>
                }
              </button>
            }
          </div>
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

    .filters-bar {
      background: white;
      padding: 1.25rem;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      border: 1px solid #EEE3D1; /* Details: Crema Suave */
      transition: all 0.2s ease;
    }

    .search-box {
      position: relative;
      margin-bottom: 1.25rem;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.125rem;
      color: #8E6F2E; /* Secondary: Ocre Oscuro */
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      border: 1.5px solid #EEE3D1; /* Details: Crema Suave */
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      background: #F9F5F0; /* Background: Blanco Hueso */
      color: #2D2926; /* Sidebar/Contrast: Gris Carbón */
    }

    .search-input:focus {
      outline: none;
      border-color: #C5A048; /* Primary: Dorado Principal */
      box-shadow: 0 0 0 3px rgba(197, 160, 72, 0.1);
      background: white;
    }

    .search-input::placeholder {
      color: #8E6F2E;
      opacity: 0.6;
    }

    .filter-groups {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }

    .filter-group {
      flex: 1;
      min-width: 200px;
    }

    .filter-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #8E6F2E; /* Secondary: Ocre Oscuro */
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .label-icon {
      font-size: 0.875rem;
    }

    .filter-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.625rem;
    }

    .filter-btn {
      padding: 0.5rem 1rem;
      border: 1.5px solid #EEE3D1; /* Details: Crema Suave */
      background: #F9F5F0; /* Background: Blanco Hueso */
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #2D2926; /* Sidebar/Contrast: Gris Carbón */
    }

    .filter-btn:hover {
      background: white;
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

    .filter-count {
      margin-left: 0.375rem;
      font-size: 0.7rem;
      font-weight: 600;
      opacity: 0.8;
    }

    .filter-btn.active .filter-count {
      color: white;
      opacity: 0.95;
    }

    /* Colores específicos para badges de tipo cuando están activos */
    .filter-btn.active[data-type="vip"] {
      background: linear-gradient(135deg, #C5A048, #E6A017);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .filters-bar {
        padding: 1rem;
      }

      .filter-groups {
        gap: 1rem;
        flex-direction: column;
      }

      .filter-group {
        min-width: auto;
      }

      .filter-buttons {
        gap: 0.5rem;
      }

      .filter-btn {
        padding: 0.4rem 0.875rem;
        font-size: 0.75rem;
      }

      .search-input {
        padding: 0.625rem 1rem 0.625rem 2.5rem;
        font-size: 0.8125rem;
      }

      .search-icon {
        font-size: 1rem;
        left: 0.875rem;
      }

      .filter-label {
        margin-bottom: 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .filters-bar {
        padding: 0.875rem;
      }

      .filter-buttons {
        gap: 0.375rem;
      }

      .filter-btn {
        padding: 0.375rem 0.75rem;
        font-size: 0.7rem;
      }

      .search-box {
        margin-bottom: 0.875rem;
      }
    }
  `
})
export class GuestFiltersComponent {
  onSearch = output<string>();
  onStatusFilter = output<GuestStatus | 'all'>();
  onTypeFilter = output<GuestType | 'all'>();

  // Contadores de estados
  checkedInCount = input<number>(0);
  checkedOutCount = input<number>(0);
  reservedCount = input<number>(0);
  noShowCount = input<number>(0);

  // Contadores de tipos
  regularCount = input<number>(0);
  vipCount = input<number>(0);
  corporateCount = input<number>(0);

  searchControl = new FormControl('');
  selectedStatus: GuestStatus | 'all' = 'all';
  selectedType: GuestType | 'all' = 'all';

  statusFilters = [
    { label: 'Todos', value: 'all' as const },
    { label: 'Hospedado', value: 'checked-in' as const },
    { label: 'Check-out', value: 'checked-out' as const },
    { label: 'Reservado', value: 'reserved' as const },
    { label: 'No show', value: 'no-show' as const }
  ];

  typeFilters = [
    { label: 'Todos', value: 'all' as const },
    { label: 'Regular', value: 'regular' as const },
    { label: 'VIP', value: 'vip' as const },
    { label: 'Corporativo', value: 'corporate' as const }
  ];

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(value => {
      this.onSearch.emit(value || '');
    });
  }

  onStatusFilterChange(status: GuestStatus | 'all') {
    this.selectedStatus = status;
    this.onStatusFilter.emit(status);
  }

  onTypeFilterChange(type: GuestType | 'all') {
    this.selectedType = type;
    this.onTypeFilter.emit(type);
  }

  getStatusCount(status: GuestStatus): number {
    switch(status) {
      case 'checked-in': return this.checkedInCount();
      case 'checked-out': return this.checkedOutCount();
      case 'reserved': return this.reservedCount();
      case 'no-show': return this.noShowCount();
      default: return 0;
    }
  }

  getTypeCount(type: GuestType): number {
    switch(type) {
      case 'regular': return this.regularCount();
      case 'vip': return this.vipCount();
      case 'corporate': return this.corporateCount();
      default: return 0;
    }
  }
}