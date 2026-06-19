import { Component, output, ChangeDetectionStrategy, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EstadoReserva } from '../../models/reservation.model';

@Component({
  selector: 'app-reservation-filters',
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
          placeholder="Buscar por código, huésped, documento o habitación..."
          class="search-input"
          aria-label="Buscar reservas">
      </div>

      <div class="status-filters">
        @for (filter of statusFilters; track filter.value) {
          <button
            class="filter-btn"
            [class.active]="selectedEstado === filter.value"
            (click)="onEstadoFilterChange(filter.value)">
            {{ filter.label }}
            @if (filter.value !== 'all') {
              <span class="filter-count">{{ getFilterCount(filter.value) }}</span>
            }
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');

    * { font-family: 'Inter', sans-serif; }

    .filters-bar {
      background: white;
      padding: 1.25rem;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      border: 1px solid #EEE3D1;
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
      color: #8E6F2E;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      border: 1.5px solid #EEE3D1;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      background: #F9F5F0;
      color: #2D2926;
    }

    .search-input:focus {
      outline: none;
      border-color: #C5A048;
      box-shadow: 0 0 0 3px rgba(197, 160, 72, 0.1);
      background: white;
    }

    .search-input::placeholder { color: #8E6F2E; opacity: 0.6; }

    .status-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .filter-btn {
      padding: 0.625rem 1.25rem;
      border: 1.5px solid #EEE3D1;
      background: #F9F5F0;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      font-weight: 500;
      color: #2D2926;
    }

    .filter-btn:hover {
      background: white;
      border-color: #C5A048;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(197, 160, 72, 0.15);
    }

    .filter-btn.active {
      background: #C5A048;
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

    .filter-btn.active .filter-count { color: white; opacity: 0.95; }

    @media (max-width: 768px) {
      .filters-bar { padding: 1rem; }
      .status-filters { gap: 0.5rem; }
      .filter-btn { padding: 0.5rem 0.875rem; font-size: 0.75rem; }
      .search-input { padding: 0.625rem 1rem 0.625rem 2.5rem; font-size: 0.8125rem; }
      .search-icon { font-size: 1rem; left: 0.875rem; }
    }

    @media (max-width: 480px) {
      .filters-bar { padding: 0.875rem; }
      .status-filters { gap: 0.375rem; }
      .filter-btn { padding: 0.375rem 0.75rem; font-size: 0.7rem; }
      .search-box { margin-bottom: 0.875rem; }
    }
  `
})
export class ReservationFiltersComponent {
  onSearch = output<string>();
  onEstadoFilter = output<EstadoReserva | 'all'>();

  pendienteCount  = input<number>(0);
  confirmadaCount = input<number>(0);
  checkInCount    = input<number>(0);
  checkOutCount   = input<number>(0);
  canceladaCount  = input<number>(0);
  noShowCount     = input<number>(0);

  searchControl = new FormControl('');
  selectedEstado: EstadoReserva | 'all' = 'all';

  readonly statusFilters: { label: string; value: EstadoReserva | 'all' }[] = [
    { label: 'Todas',      value: 'all' },
    { label: 'Confirmadas', value: 'CONFIRMADA' },
    { label: 'Check-in',   value: 'CHECK_IN' },
    { label: 'Check-out',  value: 'CHECK_OUT' },
    { label: 'Pendientes', value: 'PENDIENTE' },
    { label: 'Canceladas', value: 'CANCELADA' },
    { label: 'No show',    value: 'NO_SHOW' },
  ];

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(value => this.onSearch.emit(value ?? ''));
  }

  onEstadoFilterChange(estado: EstadoReserva | 'all'): void {
    this.selectedEstado = estado;
    this.onEstadoFilter.emit(estado);
  }

  getFilterCount(estado: EstadoReserva): number {
    switch (estado) {
      case 'PENDIENTE':  return this.pendienteCount();
      case 'CONFIRMADA': return this.confirmadaCount();
      case 'CHECK_IN':   return this.checkInCount();
      case 'CHECK_OUT':  return this.checkOutCount();
      case 'CANCELADA':  return this.canceladaCount();
      case 'NO_SHOW':    return this.noShowCount();
      default: return 0;
    }
  }
}
