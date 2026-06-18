import { Component, output, input, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EstadoActivo } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-filters',
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
          placeholder="Buscar por nombre, documento, correo o teléfono..."
          class="search-input"
          aria-label="Buscar clientes">
      </div>

      <div class="status-filters">
        @for (f of filtros; track f.value) {
          <button
            class="filter-btn"
            [class.active]="selected === f.value"
            (click)="cambiarFiltro(f.value)">
            {{ f.label }}
            @if (f.value !== 'all') {
              <span class="filter-count">{{ getCount(f.value) }}</span>
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
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      border: 1px solid #EEE3D1;
    }

    .search-box { position: relative; margin-bottom: 1.25rem; }

    .search-icon {
      position: absolute; left: 1rem; top: 50%;
      transform: translateY(-50%);
      font-size: 1.125rem; color: #8E6F2E; pointer-events: none;
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
      box-shadow: 0 0 0 3px rgba(197,160,72,0.1);
      background: white;
    }

    .search-input::placeholder { color: #8E6F2E; opacity: 0.6; }

    .status-filters { display: flex; flex-wrap: wrap; gap: 0.75rem; }

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
      background: white; border-color: #C5A048;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(197,160,72,0.15);
    }

    .filter-btn.active {
      background: #C5A048; border-color: #C5A048;
      color: white;
      box-shadow: 0 2px 8px rgba(197,160,72,0.3);
    }

    .filter-count { margin-left: 0.375rem; font-size: 0.7rem; font-weight: 600; opacity: 0.8; }
    .filter-btn.active .filter-count { color: white; opacity: 0.95; }

    @media (max-width: 768px) {
      .filters-bar { padding: 1rem; }
      .status-filters { gap: 0.5rem; }
      .filter-btn { padding: 0.5rem 0.875rem; font-size: 0.75rem; }
    }
  `
})
export class ClienteFiltersComponent {
  onSearch       = output<string>();
  onEstadoFilter = output<EstadoActivo | 'all'>();

  activosCount   = input<number>(0);
  inactivosCount = input<number>(0);

  searchControl = new FormControl('');
  selected: EstadoActivo | 'all' = 'all';

  readonly filtros: { label: string; value: EstadoActivo | 'all' }[] = [
    { label: 'Todos',    value: 'all' },
    { label: 'Activos',  value: 'ACTIVO' },
    { label: 'Inactivos', value: 'INACTIVO' },
  ];

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(v => this.onSearch.emit(v ?? ''));
  }

  cambiarFiltro(v: EstadoActivo | 'all'): void {
    this.selected = v;
    this.onEstadoFilter.emit(v);
  }

  getCount(v: EstadoActivo): number {
    return v === 'ACTIVO' ? this.activosCount() : this.inactivosCount();
  }
}
