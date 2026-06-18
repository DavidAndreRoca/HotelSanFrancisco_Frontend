import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Payment } from '../../models/payment.model';

interface StatCard {
  label: string;
  value: string;
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

@Component({
  selector: 'app-payment-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      @for (card of cards(); track card.label) {
        <article
          class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] p-5">
          <p class="text-[12px] font-medium text-[var(--color-ink-muted)] uppercase tracking-wide">
            {{ card.label }}
          </p>
          <p [class]="valueClasses(card.tone)">{{ card.value }}</p>
        </article>
      }
    </div>
  `,
})
export class PaymentStatsComponent {
  /** Pagos de la página actual (las stats reflejan solo lo cargado, no hay endpoint agregado en el backend). */
  readonly items = input<Payment[]>([]);

  private readonly currencyFmt = (value: number): string =>
    `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  readonly cards = computed<StatCard[]>(() => {
    const items = this.items();
    const totalRecaudado = items.reduce((acc, p) => acc + p.monto, 0);
    const totalAnticipos = items
      .filter((p) => p.tipoPago === 'ANTICIPO')
      .reduce((acc, p) => acc + p.monto, 0);
    const totalReembolsos = items
      .filter((p) => p.tipoPago === 'REEMBOLSO')
      .reduce((acc, p) => acc + p.monto, 0);
    const hoy = new Date().toDateString();
    const pagosHoy = items.filter((p) => new Date(p.fecha).toDateString() === hoy).length;

    return [
      {
        label: 'Total recaudado',
        value: this.currencyFmt(totalRecaudado),
        tone: 'success',
      },
      {
        label: 'Anticipos (50%)',
        value: this.currencyFmt(totalAnticipos),
        tone: 'primary',
      },
      {
        label: 'Reembolsos',
        value: this.currencyFmt(totalReembolsos),
        tone: 'danger',
      },
      {
        label: 'Pagos hoy',
        value: String(pagosHoy),
        tone: 'neutral',
      },
    ];
  });

  valueClasses(tone: StatCard['tone']): string {
    const base = 'mt-2 text-2xl font-bold tracking-tight';
    const tones: Record<StatCard['tone'], string> = {
      primary: 'text-[var(--color-primary-700)]',
      success: 'text-[var(--color-success-500)]',
      warning: 'text-[var(--color-warning-500)]',
      danger: 'text-[var(--color-danger-500)]',
      neutral: 'text-[var(--color-ink)]',
    };
    return `${base} ${tones[tone]}`;
  }
}
