// features/reports/components/occupancy-chart/occupancy-chart.component.ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { OccupancyPoint } from '../../models/report.model';

@Component({
  selector: 'app-occupancy-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
            Ocupación
          </p>
          <p class="text-2xl font-bold tracking-tight">
            {{ avgOccupancy() | number:'1.1-1' }}%
          </p>
        </div>
        <span class="text-[12px] text-[var(--color-ink-muted)]">Promedio del período</span>
      </div>

      @if (!serie().length) {
        <div class="h-40 flex items-center justify-center text-[13px] text-[var(--color-ink-muted)]">
          Sin datos para el período seleccionado.
        </div>
      } @else {
        <svg
          [attr.viewBox]="'0 0 ' + W + ' ' + H"
          [attr.width]="W"
          [attr.height]="H"
          class="w-full"
          role="img"
          aria-label="Gráfico de ocupación">

          <!-- Grid lines at 25, 50, 75, 100% -->
          @for (pct of [25, 50, 75, 100]; track pct) {
            <line
              [attr.x1]="PL"
              [attr.y1]="yOf(pct)"
              [attr.x2]="W - PR"
              [attr.y2]="yOf(pct)"
              stroke="var(--color-border-soft)"
              stroke-width="1"
              stroke-dasharray="4 3" />
            <text
              [attr.x]="PL - 6"
              [attr.y]="yOf(pct) + 4"
              text-anchor="end"
              font-size="10"
              fill="var(--color-ink-muted)">
              {{ pct }}%
            </text>
          }

          <!-- Area fill -->
          <path
            [attr.d]="areaPath()"
            fill="var(--color-primary-500)"
            opacity="0.08" />

          <!-- Line -->
          <polyline
            [attr.points]="linePath()"
            fill="none"
            stroke="var(--color-primary-500)"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round" />

          <!-- Dots -->
          @for (pt of points(); track pt.fecha) {
            <circle
              [attr.cx]="pt.cx"
              [attr.cy]="pt.cy"
              r="3.5"
              fill="white"
              stroke="var(--color-primary-500)"
              stroke-width="2" />
          }
        </svg>
      }
    </div>
  `,
})
export class OccupancyChartComponent {
  readonly serie = input.required<OccupancyPoint[]>();

  readonly W = 640;
  readonly H = 180;
  readonly PL = 40;
  readonly PR = 12;
  readonly PT = 16;
  readonly PB = 8;

  private get chartW() { return this.W - this.PL - this.PR; }
  private get chartH() { return this.H - this.PT - this.PB; }

  readonly avgOccupancy = computed(() => {
    const s = this.serie();
    if (!s.length) return 0;
    return s.reduce((acc, p) => acc + p.porcentajeOcupacion, 0) / s.length;
  });

  yOf(pct: number): number {
    return this.PT + this.chartH - (pct / 100) * this.chartH;
  }

  readonly points = computed(() => {
    const s = this.serie();
    const n = s.length || 1;
    return s.map((p, i) => ({
      fecha: p.fecha,
      cx: this.PL + (i / (n - 1 || 1)) * this.chartW,
      cy: this.yOf(p.porcentajeOcupacion),
    }));
  });

  readonly linePath = computed(() =>
    this.points().map((p) => `${p.cx},${p.cy}`).join(' '),
  );

  readonly areaPath = computed(() => {
    const pts = this.points();
    if (!pts.length) return '';
    const bottom = this.PT + this.chartH;
    const first = pts[0];
    const last = pts[pts.length - 1];
    const line = pts.map((p) => `${p.cx},${p.cy}`).join(' L ');
    return `M ${first.cx},${bottom} L ${line} L ${last.cx},${bottom} Z`;
  });
}
