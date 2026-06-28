import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { EstadoActivo, ProductoFilters } from '../../models/product.model';
import { CategoriaProductoService } from '../../services/categoria-producto.service';

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
            placeholder="Nombre del producto"
            class="w-full h-11 pl-9 pr-3 rounded-lg border border-[var(--color-border-soft)] bg-white text-[14px] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 transition" />
        </span>
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">
          Categoría
        </span>
        <select
          formControlName="categoriaProductoId"
          class="h-11 px-3 rounded-lg border border-[var(--color-border-soft)] bg-white text-[14px] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 transition">
          <option value="">Todas</option>
          @for (cat of categorias.items(); track cat.categoriaProductoId) {
            <option [value]="cat.categoriaProductoId">{{ cat.nombre }}</option>
          }
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

      <label
        for="soloBajoStock"
        class="flex items-center gap-2 self-end h-11 px-3 rounded-lg border border-[var(--color-border-soft)] bg-white cursor-pointer hover:border-[var(--color-primary-500)] transition"
        title="Mostrar solo productos en o por debajo del stock mínimo">
        <input
          type="checkbox"
          formControlName="soloBajoStock"
          id="soloBajoStock"
          class="w-4 h-4 rounded border-[var(--color-border-soft)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]/25" />
        <span class="text-[13px] text-[var(--color-ink-soft)] whitespace-nowrap">
          Bajo stock
        </span>
      </label>
    </form>
  `,
})
export class ProductFiltersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly categorias = inject(CategoriaProductoService);

  readonly initial = input<ProductoFilters | null>(null);
  readonly changed = output<Partial<ProductoFilters>>();

  readonly form = this.fb.nonNullable.group({
    search: '',
    categoriaProductoId: '' as string,
    estado: '' as EstadoActivo | '',
    soloBajoStock: false,
  });

  ngOnInit(): void {
    if (!this.categorias.items().length) {
      this.categorias.load();
    }

    const init = this.initial();
    if (init) {
      this.form.patchValue(
        {
          search: init.search,
          categoriaProductoId: init.categoriaProductoId === '' ? '' : String(init.categoriaProductoId),
          estado: init.estado,
          soloBajoStock: init.soloBajoStock,
        },
        { emitEvent: false },
      );
    }

    this.form.controls.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => this.changed.emit({ search }));

    this.form.controls.categoriaProductoId.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.changed.emit({ categoriaProductoId: v === '' ? '' : Number(v) }));

    this.form.controls.estado.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((estado) => this.changed.emit({ estado }));

    this.form.controls.soloBajoStock.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((soloBajoStock) => this.changed.emit({ soloBajoStock }));
  }
}
