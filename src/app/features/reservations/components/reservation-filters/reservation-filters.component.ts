import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { EstadoReserva } from '../../models/reservation.model';

@Component({
  selector: 'app-reservation-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4 space-y-3">

      <!-- Búsqueda -->
      <div class="relative">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#2D2926]/40"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7"/>
          <path stroke-linecap="round" d="m21 21-3.5-3.5"/>
        </svg>
        <input
          type="search"
          [formControl]="searchControl"
          placeholder="Buscar por código, huésped, documento o habitación..."
          aria-label="Buscar reservas"
          class="w-full h-10 pl-9 pr-3 rounded-lg border border-[#EEE3D1] bg-[#F9F5F0] text-sm
                 focus:outline-none focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20
                 focus:bg-white transition" />
      </div>

      <!-- Filtros de estado -->
      <div class="flex flex-wrap gap-2">
        @for (f of statusFilters; track f.value) {
          <button type="button"
            class="h-8 px-3 rounded-lg text-xs font-semibold border transition-colors"
            [class]="selectedEstado === f.value
              ? 'bg-[#C5A048] border-[#C5A048] text-white'
              : 'bg-[#F9F5F0] border-[#EEE3D1] text-[#2D2926] hover:border-[#C5A048] hover:bg-white'"
            (click)="setEstado(f.value)">
            {{ f.label }}
            @if (f.value !== 'all') {
              <span class="ml-1 opacity-75">{{ getCount(f.value) }}</span>
            }
          </button>
        }
      </div>

    </div>
  `,
})
export class ReservationFiltersComponent {
  onSearch       = output<string>();
  onEstadoFilter = output<EstadoReserva | 'all'>();

  pendienteCount  = input<number>(0);
  confirmadaCount = input<number>(0);
  checkInCount    = input<number>(0);
  checkOutCount   = input<number>(0);
  canceladaCount  = input<number>(0);
  noShowCount     = input<number>(0);

  readonly searchControl = new FormControl('');
  selectedEstado: EstadoReserva | 'all' = 'all';

  readonly statusFilters: { label: string; value: EstadoReserva | 'all' }[] = [
    { label: 'Todas',      value: 'all'       },
    { label: 'Confirmadas', value: 'CONFIRMADA' },
    { label: 'Check-in',   value: 'CHECK_IN'   },
    { label: 'Check-out',  value: 'CHECK_OUT'  },
    { label: 'Pendientes', value: 'PENDIENTE'  },
    { label: 'Canceladas', value: 'CANCELADA'  },
    { label: 'No show',    value: 'NO_SHOW'    },
  ];

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe(value => this.onSearch.emit(value ?? ''));
  }

  setEstado(estado: EstadoReserva | 'all'): void {
    this.selectedEstado = estado;
    this.onEstadoFilter.emit(estado);
  }

  getCount(estado: EstadoReserva): number {
    const map: Record<EstadoReserva, number> = {
      PENDIENTE:  this.pendienteCount(),
      CONFIRMADA: this.confirmadaCount(),
      CHECK_IN:   this.checkInCount(),
      CHECK_OUT:  this.checkOutCount(),
      CANCELADA:  this.canceladaCount(),
      NO_SHOW:    this.noShowCount(),
    };
    return map[estado];
  }
}
