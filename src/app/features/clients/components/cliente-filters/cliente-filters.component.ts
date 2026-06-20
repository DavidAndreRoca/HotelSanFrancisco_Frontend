import { Component, output, input, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EstadoActivo } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-filters',
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
          placeholder="Buscar por nombre, documento, correo o teléfono..."
          aria-label="Buscar clientes"
          class="w-full h-10 pl-9 pr-3 rounded-lg border border-[#EEE3D1] bg-[#F9F5F0] text-sm
                 focus:outline-none focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20
                 focus:bg-white transition" />
      </div>

      <!-- Filtros de estado -->
      <div class="flex flex-wrap gap-2">
        @for (f of filtros; track f.value) {
          <button type="button"
            class="h-8 px-3 rounded-lg text-xs font-semibold border transition-colors"
            [class]="selected === f.value
              ? 'bg-[#C5A048] border-[#C5A048] text-white'
              : 'bg-[#F9F5F0] border-[#EEE3D1] text-[#2D2926] hover:border-[#C5A048] hover:bg-white'"
            (click)="cambiarFiltro(f.value)">
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
export class ClienteFiltersComponent {
  onSearch       = output<string>();
  onEstadoFilter = output<EstadoActivo | 'all'>();

  activosCount   = input<number>(0);
  inactivosCount = input<number>(0);

  searchControl = new FormControl('');
  selected: EstadoActivo | 'all' = 'all';

  readonly filtros: { label: string; value: EstadoActivo | 'all' }[] = [
    { label: 'Todos',     value: 'all'      },
    { label: 'Activos',   value: 'ACTIVO'   },
    { label: 'Inactivos', value: 'INACTIVO' },
  ];

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(),
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
