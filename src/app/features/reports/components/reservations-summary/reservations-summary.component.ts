// features/reports/components/reservations-summary/reservations-summary.component.ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CurrencyPipe, PercentPipe } from '@angular/common';
import { UiEmptyStateComponent } from '../../../../shared/ui/empty-state/ui-empty-state.component';
import { ReservationsByRoomType, ReservationsByStatus } from '../../models/report.model';

@Component({
  selector: 'app-reservations-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, PercentPipe, UiEmptyStateComponent],
  template: `
    <div class="grid lg:grid-cols-2 gap-4">
      <!-- Por estado -->
      <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] p-5">
        <p class="text-[13px] font-semibold text-[var(--color-ink)]">Reservas por estado</p>
        @if (!porEstado().length) {
          <ui-empty-state icon="☷" title="Sin datos" description="No hay reservas en el período." />
        } @else {
          <div class="mt-3 space-y-2">
            @for (item of porEstado(); track item.estado) {
              <div class="flex items-center gap-3">
                <span class="w-28 text-[12px] text-[var(--color-ink-soft)] truncate">{{ item.estado }}</span>
                <div class="flex-1 h-2 bg-[var(--color-border-soft)] rounded-full overflow-hidden">
                  <div
                    class="h-full bg-[var(--color-primary-500)] rounded-full transition-all"
                    [style.width.%]="item.porcentaje">
                  </div>
                </div>
                <span class="text-[12px] font-medium w-8 text-right">{{ item.cantidad }}</span>
                <span class="text-[11px] text-[var(--color-ink-muted)] w-10 text-right">
                  {{ item.porcentaje / 100 | percent:'1.0-1' }}
                </span>
              </div>
            }
          </div>
        }
      </div>

      <!-- Por tipo de habitación -->
      <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] p-5">
        <p class="text-[13px] font-semibold text-[var(--color-ink)]">Por tipo de habitación</p>
        @if (!porTipoHabitacion().length) {
          <ui-empty-state icon="◇" title="Sin datos" description="No hay reservas en el período." />
        } @else {
          <div class="overflow-x-auto mt-3">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-[11px] text-[var(--color-ink-muted)] uppercase tracking-wide">
                  <th class="text-left pb-2 font-medium">Tipo</th>
                  <th class="text-right pb-2 font-medium">Reservas</th>
                  <th class="text-right pb-2 font-medium">Ingresos</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--color-border-soft)]">
                @for (row of porTipoHabitacion(); track row.tipoHabitacion) {
                  <tr>
                    <td class="py-2">{{ row.tipoHabitacion }}</td>
                    <td class="py-2 text-right">{{ row.cantidad }}</td>
                    <td class="py-2 text-right font-medium">
                      {{ row.ingresos | currency:'PEN':'symbol-narrow':'1.2-2' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class ReservationsSummaryComponent {
  readonly porEstado = input.required<ReservationsByStatus[]>();
  readonly porTipoHabitacion = input.required<ReservationsByRoomType[]>();
}
