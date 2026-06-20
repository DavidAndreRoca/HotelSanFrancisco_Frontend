import { ChangeDetectionStrategy, Component, OnInit, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CompraFilters, EstadoCompra } from '../../models/purchase.model';

@Component({
  selector: 'app-purchase-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form
      [formGroup]="form"
      class="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3 bg-white rounded-2xl p-4 border border-[var(--color-border-soft)] shadow-[var(--shadow-card)]"
      role="search"
      aria-label="Filtros de compras">
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
            placeholder="N° de orden o proveedor"
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
          <option value="PENDIENTE">Pendientes</option>
          <option value="RECIBIDA">Recibidas</option>
          <option value="CANCELADA">Canceladas</option>
        </select>
      </label>
    </form>
  `,
})
export class PurchaseFiltersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly initial = input<CompraFilters | null>(null);
  readonly changed = output<Partial<CompraFilters>>();

  readonly form = this.fb.nonNullable.group({
    search: '',
    estado: '' as EstadoCompra | '',
  });

  ngOnInit(): void {
    const init = this.initial();
    if (init) {
      this.form.patchValue({ search: init.search, estado: init.estado }, { emitEvent: false });
    }

    this.form.controls.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((search) => this.changed.emit({ search }));

    this.form.controls.estado.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((estado) => this.changed.emit({ estado }));
  }
}
