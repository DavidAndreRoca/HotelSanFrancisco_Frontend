import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { EstadoActivo, RoomTypeFilters } from '../../models/room-type.model';

@Component({
  selector: 'app-room-type-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form
      [formGroup]="form"
      class="grid grid-cols-1 sm:grid-cols-[1fr_180px_160px] gap-3 bg-white rounded-2xl p-4 border border-[var(--color-border-soft)] shadow-[var(--shadow-card)]"
      role="search"
      aria-label="Filtros de tipos de habitación">
      <label class="flex flex-col gap-1">
        <span class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">
          Buscar
        </span>
        <span class="relative">
          <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <path stroke-linecap="round" d="m21 21-3.5-3.5"/>
          </svg>
          <input
            type="search"
            formControlName="search"
            placeholder="Nombre o descripción"
            class="w-full h-11 pl-9 pr-3 rounded-lg border border-[var(--color-border-soft)] bg-white text-[14px] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 transition" />
        </span>
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">
          Estado
        </span>
        <select
          formControlName="estado"
          class="h-11 px-3 rounded-lg border border-[var(--color-border-soft)] bg-white text-[14px] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 transition">
          <option value="">Todos</option>
          <option value="ACTIVO">Activos</option>
          <option value="INACTIVO">Inactivos</option>
        </select>
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">
          Ordenar
        </span>
        <select
          formControlName="sort"
          class="h-11 px-3 rounded-lg border border-[var(--color-border-soft)] bg-white text-[14px] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 transition">
          <option value="nombre,asc">Nombre (A–Z)</option>
          <option value="nombre,desc">Nombre (Z–A)</option>
          <option value="precioBase,asc">Precio (menor)</option>
          <option value="precioBase,desc">Precio (mayor)</option>
          <option value="capacidadMaxima,desc">Capacidad (mayor)</option>
        </select>
      </label>
    </form>
  `,
})
export class RoomTypeFiltersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly initial = input<RoomTypeFilters | null>(null);
  readonly changed = output<Partial<RoomTypeFilters>>();

  readonly form = this.fb.nonNullable.group({
    search: '',
    estado: '' as EstadoActivo | '',
    sort: 'nombre,asc',
  });

  ngOnInit(): void {
    const init = this.initial();
    if (init) {
      this.form.patchValue(
        { search: init.search, estado: init.estado, sort: init.sort },
        { emitEvent: false },
      );
    }

    this.form.controls.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => this.changed.emit({ search, page: 0 }));

    this.form.controls.estado.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((estado) => this.changed.emit({ estado, page: 0 }));

    this.form.controls.sort.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((sort) => this.changed.emit({ sort, page: 0 }));
  }
}
