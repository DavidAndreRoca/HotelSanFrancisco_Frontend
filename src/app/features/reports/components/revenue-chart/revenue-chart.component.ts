// features/reports/components/revenue-chart/revenue-chart.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RevenuePoint } from '../../models/report.model';

@Component({
  selector: 'app-revenue-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe],
  template: `
    <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
            Ingresos totales
            <span
              class="cursor-help text-[var(--color-ink-muted)]/70"
              title="Cobros del período, por fecha de pago (base caja)."
              aria-label="Cobros del período, por fecha de pago (base caja).">ⓘ</span>
          </p>
          <p class="text-2xl font-bold tracking-tight text-[var(--color-ink)]">
            {{ total() | currency:'PEN':'symbol-narrow':'1.2-2' }}
          </p>
          <p class="text-[11px] font-normal normal-case text-[var(--color-ink-muted)]">
            Cobros del período, por fecha de pago.
          </p>
        </div>
        <div class="flex items-center gap-4 text-[12px] text-[var(--color-ink-muted)]">
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-[var(--color-primary-500)] inline-block"></span>
            Adelantos
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-[var(--color-success-500)] inline-block"></span>
            Saldos
          </span>
        </div>
      </div>

      @if (!serie().length) {
        <div class="h-48 flex items-center justify-center text-[13px] text-[var(--color-ink-muted)]">
          Sin datos para el período seleccionado.
        </div>
      } @else {
        <div class="overflow-x-auto">
          <svg
            [attr.viewBox]="'0 0 ' + svgWidth + ' ' + svgHeight"
            [attr.width]="svgWidth"
            [attr.height]="svgHeight"
            class="w-full"
            role="img"
            aria-label="Gráfico de ingresos por período">

            <!-- Grid lines -->
            @for (line of gridLines(); track line.y) {
              <line
                [attr.x1]="paddingLeft"
                [attr.y1]="line.y"
                [attr.x2]="svgWidth - paddingRight"
                [attr.y2]="line.y"
                stroke="var(--color-border-soft)"
                stroke-width="1" />
              <text
                [attr.x]="paddingLeft - 8"
                [attr.y]="line.y + 4"
                text-anchor="end"
                font-size="10"
                fill="var(--color-ink-muted)">
                {{ line.label }}
              </text>
            }

            <!-- Líneas: adelantos y saldos -->
            <polyline
              [attr.points]="lineaAdelantos()"
              fill="none"
              stroke="var(--color-primary-500)"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round" />
            <polyline
              [attr.points]="lineaSaldos()"
              fill="none"
              stroke="var(--color-success-500)"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round" />

            @for (pt of puntos(); track pt.fecha) {
              <circle [attr.cx]="pt.x" [attr.cy]="pt.yAdelantos" r="3" fill="var(--color-primary-500)">
                <title>Adelantos {{ pt.label }}</title>
              </circle>
              <circle [attr.cx]="pt.x" [attr.cy]="pt.ySaldos" r="3" fill="var(--color-success-500)">
                <title>Saldos {{ pt.label }}</title>
              </circle>
              <!-- Label fecha -->
              <text
                [attr.x]="pt.x"
                [attr.y]="svgHeight - paddingBottom + 14"
                text-anchor="middle"
                font-size="9"
                fill="var(--color-ink-muted)">
                {{ pt.label }}
              </text>
            }
          </svg>
        </div>
      }
    </div>
  `,
})
export class RevenueChartComponent {
  readonly serie = input.required<RevenuePoint[]>();
  readonly total = input<number>(0);

  readonly svgWidth = 640;
  readonly svgHeight = 220;
  readonly paddingLeft = 55;
  readonly paddingRight = 16;
  readonly paddingTop = 16;
  readonly paddingBottom = 28;

  private get chartW() {
    return this.svgWidth - this.paddingLeft - this.paddingRight;
  }
  private get chartH() {
    return this.svgHeight - this.paddingTop - this.paddingBottom;
  }

  readonly barW = computed(() => {
    const n = this.serie().length || 1;
    return this.chartW / n;
  });

  private readonly maxVal = computed(() =>
    Math.max(...this.serie().map((p) => p.ingresosAnticipos + p.ingresosSaldos), 1),
  );

  readonly gridLines = computed(() => {
    const max = this.maxVal();
    const step = Math.ceil(max / 4 / 100) * 100 || 1;
    return Array.from({ length: 5 }, (_, i) => {
      const val = step * i;
      const y = this.paddingTop + this.chartH - (val / max) * this.chartH;
      return { y, label: val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(val) };
    });
  });

  /** Puntos centrados en cada intervalo, para las dos series en línea. */
  readonly puntos = computed(() => {
    const max = this.maxVal();
    const bw = this.barW();
    return this.serie().map((p, i) => ({
      fecha: p.fecha,
      x: this.paddingLeft + i * bw + bw / 2,
      yAdelantos: this.paddingTop + this.chartH - (p.ingresosAnticipos / max) * this.chartH,
      ySaldos: this.paddingTop + this.chartH - (p.ingresosSaldos / max) * this.chartH,
      label: this.shortDate(p.fecha),
    }));
  });

  readonly lineaAdelantos = computed(() =>
    this.puntos().map((p) => `${p.x},${p.yAdelantos}`).join(' '),
  );

  readonly lineaSaldos = computed(() =>
    this.puntos().map((p) => `${p.x},${p.ySaldos}`).join(' '),
  );

  private shortDate(iso: string): string {
    try {
      const d = new Date(iso);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    } catch {
      return iso;
    }
  }
}
