import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { UiBadgeComponent, BadgeTone } from '../../../../shared/ui/badge/ui-badge.component';
import { UiEmptyStateComponent } from '../../../../shared/ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../../../../shared/ui/skeleton/ui-skeleton.component';
import { Payment, TipoPago } from '../../models/payment.model';

const TIPO_TONE: Record<TipoPago, BadgeTone> = {
  ANTICIPO: 'primary',
  SALDO: 'success',
  TOTAL: 'success',
  REEMBOLSO: 'danger',
};

const TIPO_LABEL: Record<TipoPago, string> = {
  ANTICIPO: 'Anticipo (50%)',
  SALDO: 'Saldo',
  TOTAL: 'Pago total',
  REEMBOLSO: 'Reembolso',
};

@Component({
  selector: 'app-payment-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, UiBadgeComponent, UiEmptyStateComponent, UiSkeletonComponent],
  template: `
    <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] overflow-hidden">
      @if (loading()) {
        <div class="p-5 space-y-3">
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <ui-skeleton height="2.5rem" />
          }
        </div>
      } @else if (!items().length) {
        <div class="p-2">
          <ui-empty-state icon="✦" title="Sin pagos registrados" description="No se encontraron pagos con los filtros aplicados." />
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-[var(--color-surface)] text-[12px] text-[var(--color-ink-muted)] uppercase tracking-wide">
              <tr>
                <th class="text-left px-4 py-3 font-medium">Reserva / Venta</th>
                <th class="text-left px-4 py-3 font-medium">Tipo</th>
                <th class="text-left px-4 py-3 font-medium">Método</th>
                <th class="text-right px-4 py-3 font-medium">Monto</th>
                <th class="text-left px-4 py-3 font-medium">Comprobante</th>
                <th class="text-left px-4 py-3 font-medium">Fecha</th>
                <th class="text-right px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-border-soft)]">
              @for (pago of items(); track pago.pagoId) {
                <tr class="hover:bg-[var(--color-surface)]/60 transition-colors">
                  <td class="px-4 py-3 font-medium">
                    @if (pago.reservaId) {
                      Reserva #{{ pago.reservaId }}
                    } @else if (pago.ventaId) {
                      Venta #{{ pago.ventaId }}
                    } @else {
                      —
                    }
                  </td>
                  <td class="px-4 py-3">
                    <ui-badge [tone]="TIPO_TONE[pago.tipoPago]">{{ TIPO_LABEL[pago.tipoPago] }}</ui-badge>
                  </td>
                  <td class="px-4 py-3">{{ pago.metodoPagoNombre }}</td>
                  <td class="px-4 py-3 text-right font-semibold">
                    {{ pago.monto | currency:'PEN':'symbol-narrow':'1.2-2' }}
                  </td>
                  <td class="px-4 py-3 text-[var(--color-ink-soft)]">
                    {{ pago.comprobante ?? '—' }}
                  </td>
                  <td class="px-4 py-3 text-[var(--color-ink-soft)]">
                    {{ pago.fecha | date:'dd/MM/yyyy HH:mm' }}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      @if (canEditar()) {
                        <button
                          type="button"
                          class="p-2 rounded-lg text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary-700)] transition"
                          (click)="edit.emit(pago)"
                          [attr.aria-label]="'Editar pago ' + pago.pagoId">
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"/>
                          </svg>
                        </button>
                      }
                      @if (canEliminar()) {
                        <button
                          type="button"
                          class="p-2 rounded-lg text-[var(--color-ink-soft)] hover:bg-[var(--color-danger-500)]/10 hover:text-[var(--color-danger-500)] transition"
                          (click)="remove.emit(pago)"
                          [attr.aria-label]="'Eliminar pago ' + pago.pagoId">
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/>
                          </svg>
                        </button>
                      }
                      @if (!canEditar() && !canEliminar()) {
                        <span class="text-[12px] text-[var(--color-ink-muted)]">—</span>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class PaymentTableComponent {
  readonly items = input.required<Payment[]>();
  readonly loading = input<boolean>(false);
  readonly canEditar = input<boolean>(true);
  readonly canEliminar = input<boolean>(true);

  readonly edit = output<Payment>();
  readonly remove = output<Payment>();

  readonly TIPO_TONE = TIPO_TONE;
  readonly TIPO_LABEL = TIPO_LABEL;
}
