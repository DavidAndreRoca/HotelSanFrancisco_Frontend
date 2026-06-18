import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MetodoPago, PaymentFilters, TipoPago } from '../../models/payment.model';

@Component({
  selector: 'app-payment-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label class="text-[12px] font-medium text-[var(--color-ink-soft)]">Tipo de pago</label>
          <select
            [(ngModel)]="tipoPago"
            (ngModelChange)="emit()"
            class="mt-1 w-full h-10 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
            <option value="">Todos</option>
            <option value="ANTICIPO">Anticipo (50%)</option>
            <option value="SALDO">Saldo</option>
            <option value="TOTAL">Pago total</option>
            <option value="REEMBOLSO">Reembolso</option>
          </select>
        </div>

        <div>
          <label class="text-[12px] font-medium text-[var(--color-ink-soft)]">Método de pago</label>
          <select
            [(ngModel)]="metodoPagoId"
            (ngModelChange)="emit()"
            class="mt-1 w-full h-10 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
            <option [ngValue]="null">Todos</option>
            @for (m of metodos(); track m.metodoPagoId) {
              <option [ngValue]="m.metodoPagoId">{{ m.nombre }}</option>
            }
          </select>
        </div>

        <div>
          <label class="text-[12px] font-medium text-[var(--color-ink-soft)]">Desde</label>
          <input type="date" [(ngModel)]="fechaDesde" (ngModelChange)="emit()"
            class="mt-1 w-full h-10 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
        </div>
        <div>
          <label class="text-[12px] font-medium text-[var(--color-ink-soft)]">Hasta</label>
          <input type="date" [(ngModel)]="fechaHasta" (ngModelChange)="emit()"
            class="mt-1 w-full h-10 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        <div>
          <label class="text-[12px] font-medium text-[var(--color-ink-soft)]">Monto mínimo</label>
          <input type="number" min="0" step="0.01" [(ngModel)]="montoMin" (ngModelChange)="emit()"
            class="mt-1 w-full h-10 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
        </div>
        <div>
          <label class="text-[12px] font-medium text-[var(--color-ink-soft)]">Monto máximo</label>
          <input type="number" min="0" step="0.01" [(ngModel)]="montoMax" (ngModelChange)="emit()"
            class="mt-1 w-full h-10 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
        </div>
        <div>
          <label class="text-[12px] font-medium text-[var(--color-ink-soft)]">N° de reserva</label>
          <input type="number" min="1" [(ngModel)]="reservaId" (ngModelChange)="emit()"
            placeholder="ID de reserva"
            class="mt-1 w-full h-10 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
        </div>
        <div class="flex items-end">
          <button
            type="button"
            (click)="reset()"
            class="h-10 px-4 text-[13px] font-medium rounded-lg border border-[var(--color-border-soft)] hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-700)] transition">
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PaymentFiltersComponent {
  readonly metodos = input<MetodoPago[]>([]);
  readonly filtersChange = output<Partial<PaymentFilters>>();

  tipoPago: TipoPago | '' = '';
  metodoPagoId: number | null = null;
  reservaId: number | null = null;
  fechaDesde: string | null = null;
  fechaHasta: string | null = null;
  montoMin: number | null = null;
  montoMax: number | null = null;

  emit(): void {
    this.filtersChange.emit({
      tipoPago: this.tipoPago,
      metodoPagoId: this.metodoPagoId,
      reservaId: this.reservaId,
      fechaDesde: this.fechaDesde,
      fechaHasta: this.fechaHasta,
      montoMin: this.montoMin,
      montoMax: this.montoMax,
      page: 0,
    });
  }

  reset(): void {
    this.tipoPago = '';
    this.metodoPagoId = null;
    this.reservaId = null;
    this.fechaDesde = null;
    this.fechaHasta = null;
    this.montoMin = null;
    this.montoMax = null;
    this.emit();
  }
}
