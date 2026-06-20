import { ChangeDetectionStrategy, Component, OnInit, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CategoriaProducto, EstadoActivo, ProductoFilters } from '../../models/product.model';

@Component({
  selector: 'app-product-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form
      [formGroup]="form"
      class="grid grid-cols-1 sm:grid-cols-[1fr_170px_150px_auto] gap-3 bg-white rounded-2xl p-4 border border-[var(--color-border-soft)] shadow-[var(--shadow-card)]"
      role="search"
      aria-label="Filtros de productos">
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
            placeholder="Nombre, SKU o proveedor"
            class="w-full h-11 pl-9 pr-3 rounded-lg border border-[var(--color-border-soft)] bg-white text-[14px] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 transition" />
        </span>
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">
          Categoría
        </span>
        <select
          formControlName="categoria"
          class="h-11 px-3 rounded-lg border border-[var(--color-border-soft)] bg-white text-[14px] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 transition">
          <option value="">Todas</option>
          <option value="MINIBAR">Minibar</option>
          <option value="AMENITIES">Amenities</option>
          <option value="LIMPIEZA">Limpieza</option>
          <option value="ALIMENTOS">Alimentos</option>
          <option value="BEBIDAS">Bebidas</option>
          <option value="LENCERIA">Lencería</option>
          <option value="MANTENIMIENTO">Mantenimiento</option>
          <option value="OTROS">Otros</option>
        </select>
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

      <label class="flex items-end gap-2 pb-0.5">
        <input
          type="checkbox"
          formControlName="soloBajoStock"
          id="soloBajoStock"
          class="w-4 h-4 rounded border-[var(--color-border-soft)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]/25" />
        <span for="soloBajoStock" class="text-[13px] text-[var(--color-ink-soft)] whitespace-nowrap">
          Bajo stock
        </span>
      </label>
    </form>
  `,
})
export class ProductFiltersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly initial = input<ProductoFilters | null>(null);
  readonly changed = output<Partial<ProductoFilters>>();

  readonly form = this.fb.nonNullable.group({
    search: '',
    categoria: '' as CategoriaProducto | '',
    estado: '' as EstadoActivo | '',
    soloBajoStock: false,
  });

  ngOnInit(): void {
    const init = this.initial();
    if (init) {
      this.form.patchValue(
        {
          search: init.search,
          categoria: init.categoria,
          estado: init.estado,
          soloBajoStock: init.soloBajoStock,
        },
        { emitEvent: false },
      );
    }

    this.form.controls.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((search) => this.changed.emit({ search }));

    this.form.controls.categoria.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((categoria) => this.changed.emit({ categoria }));

    this.form.controls.estado.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((estado) => this.changed.emit({ estado }));

    this.form.controls.soloBajoStock.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((soloBajoStock) => this.changed.emit({ soloBajoStock }));
  }
}
