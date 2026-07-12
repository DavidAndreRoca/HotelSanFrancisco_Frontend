// features/reports/pages/reports-dashboard/reports-dashboard.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { finalize, forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ReportService } from '../../services/report.service';
import { RevenueChartComponent } from '../../components/revenue-chart/revenue-chart.component';
import { OccupancyChartComponent } from '../../components/occupancy-chart/occupancy-chart.component';
import { ReservationsSummaryComponent } from '../../components/reservations-summary/reservations-summary.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiSkeletonComponent } from '../../../../shared/ui/skeleton/ui-skeleton.component';
import {
  DEFAULT_REPORT_RANGE,
  EXPORT_EXTENSION,
  ExportFormat,
  ExportTipo,
  ReportDateRange,
  ReportGroupBy,
  ReportPeriod,
} from '../../models/report.model';

@Component({
  selector: 'app-reports-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CurrencyPipe,
    DecimalPipe,
    RevenueChartComponent,
    OccupancyChartComponent,
    ReservationsSummaryComponent,
    UiButtonComponent,
    UiSkeletonComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header + controles -->
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Reportes</h1>
          <p class="text-[13px] text-[var(--color-ink-muted)] mt-1">
            Ingresos, reservas y ocupación del hotel.
          </p>
        </div>

        <div class="flex flex-wrap items-end gap-3">
          <!-- Selector período -->
          <div>
            <label class="text-[12px] font-medium text-[var(--color-ink-soft)]">Período</label>
            <select
              [(ngModel)]="range.period"
              (ngModelChange)="onPeriodChange()"
              class="mt-1 h-10 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
              <option value="TODAY">Hoy</option>
              <option value="WEEK">Esta semana</option>
              <option value="MONTH">Este mes</option>
              <option value="QUARTER">Trimestre</option>
              <option value="YEAR">Este año</option>
              <option value="CUSTOM">Personalizado</option>
            </select>
          </div>

          @if (range.period === 'CUSTOM') {
            <div>
              <label class="text-[12px] font-medium text-[var(--color-ink-soft)]">Desde</label>
              <input type="date" [(ngModel)]="range.fechaInicio"
                class="mt-1 h-10 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
            </div>
            <div>
              <label class="text-[12px] font-medium text-[var(--color-ink-soft)]">Hasta</label>
              <input type="date" [(ngModel)]="range.fechaFin"
                class="mt-1 h-10 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
            </div>
          }

          <div>
            <label class="text-[12px] font-medium text-[var(--color-ink-soft)]">Agrupar por</label>
            <select
              [(ngModel)]="range.groupBy"
              class="mt-1 h-10 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
              <option value="DAY">Día</option>
              <option value="WEEK">Semana</option>
              <option value="MONTH">Mes</option>
            </select>
          </div>

          <ui-button variant="primary" (click)="refresh()">
            Aplicar
          </ui-button>

          <!-- Exportar -->
          <div class="flex gap-2">
            <ui-button variant="outline" [loading]="exporting()" (click)="exportReport('PDF')">
              ↓ PDF
            </ui-button>
            <ui-button variant="outline" [loading]="exporting()" (click)="exportReport('EXCEL')">
              ↓ Excel
            </ui-button>
            <ui-button variant="outline" [loading]="exporting()" (click)="exportReport('CSV')">
              ↓ CSV
            </ui-button>
          </div>
        </div>
      </header>

      <!-- KPI Cards de ingresos -->
      @if (reportService.revenueLoading()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) { <ui-skeleton height="5rem" /> }
        </div>
      } @else if (reportService.revenue(); as rev) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <article class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] p-5">
            <p class="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
              Cobros del período
              <span
                class="cursor-help text-[var(--color-ink-muted)]/70"
                title="Pagos efectivamente recibidos en el período (base caja), por fecha de pago."
                aria-label="Pagos efectivamente recibidos en el período (base caja), por fecha de pago.">ⓘ</span>
            </p>
            <p class="mt-1.5 text-2xl font-bold text-[var(--color-success-500)]">
              {{ rev.totalIngresos | currency:'PEN':'symbol-narrow':'1.2-2' }}
            </p>
          </article>
          <article class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] p-5">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">Anticipos (50%)</p>
            <p class="mt-1.5 text-2xl font-bold text-[var(--color-primary-700)]">
              {{ rev.totalAnticipos | currency:'PEN':'symbol-narrow':'1.2-2' }}
            </p>
          </article>
          <article class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] p-5">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">Saldos</p>
            <p class="mt-1.5 text-2xl font-bold text-[var(--color-ink)]">
              {{ rev.totalSaldos | currency:'PEN':'symbol-narrow':'1.2-2' }}
            </p>
          </article>
          <article class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] p-5">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">Ingreso promedio/día</p>
            <p class="mt-1.5 text-2xl font-bold text-[var(--color-ink)]">
              {{ rev.ingresoPromedioDiario | currency:'PEN':'symbol-narrow':'1.2-2' }}
            </p>
          </article>
        </div>
      }

      <!-- Punto 12: Gráfico de ingresos -->
      @if (reportService.revenueLoading()) {
        <ui-skeleton height="17rem" />
      } @else if (reportService.revenue(); as rev) {
        <app-revenue-chart [serie]="rev.serie" [total]="rev.totalIngresos" />
      }

      <!-- Punto 14: Gráfico de ocupación -->
      @if (reportService.occupancyLoading()) {
        <ui-skeleton height="13rem" />
      } @else if (reportService.occupancy(); as occ) {
        <app-occupancy-chart [serie]="occ.serie" />

        <!-- Tabla ocupación por tipo -->
        <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] overflow-hidden">
          <div class="px-5 py-4 border-b border-[var(--color-border-soft)]">
            <p class="text-[13px] font-semibold">Ocupación por tipo de habitación</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-[var(--color-surface)] text-[11px] text-[var(--color-ink-muted)] uppercase tracking-wide">
                <tr>
                  <th class="text-left px-4 py-3 font-medium">Tipo</th>
                  <th class="text-right px-4 py-3 font-medium">Habitaciones</th>
                  <th class="text-right px-4 py-3 font-medium">Noches ocupadas</th>
                  <th class="text-right px-4 py-3 font-medium">% Ocupación</th>
                  <th class="text-right px-4 py-3 font-medium">
                    <span
                      class="cursor-help border-b border-dotted border-[var(--color-ink-muted)]/50"
                      title="Ingreso de habitación devengado, prorrateado por noche de estancia. No comparable 1:1 con los cobros del período.">ADR</span>
                  </th>
                  <th class="text-right px-4 py-3 font-medium">
                    <span
                      class="cursor-help border-b border-dotted border-[var(--color-ink-muted)]/50"
                      title="Ingreso de habitación devengado, prorrateado por noche de estancia. No comparable 1:1 con los cobros del período.">RevPAR</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--color-border-soft)]">
                @for (row of occ.porTipoHabitacion; track row.tipoHabitacion) {
                  <tr class="hover:bg-[var(--color-surface)]/60">
                    <td class="px-4 py-3 font-medium">{{ row.tipoHabitacion }}</td>
                    <td class="px-4 py-3 text-right">{{ row.habitacionesTotal }}</td>
                    <td class="px-4 py-3 text-right">{{ row.nochesOcupadas }}</td>
                    <td class="px-4 py-3 text-right font-semibold">
                      {{ row.porcentajeOcupacion | number:'1.1-1' }}%
                    </td>
                    <td class="px-4 py-3 text-right">
                      {{ row.adr | currency:'PEN':'symbol-narrow':'1.2-2' }}
                    </td>
                    <td class="px-4 py-3 text-right">
                      {{ row.revpar | currency:'PEN':'symbol-narrow':'1.2-2' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="px-5 py-3 border-t border-[var(--color-border-soft)] text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
            <span class="mr-1">ⓘ</span>
            <strong>Base caja</strong> (cobros del período): pagos recibidos por fecha de pago.
            <strong>Base devengado</strong> (ADR / RevPAR): ingreso de habitación prorrateado por noche de estancia.
            Un día puede tener ocupación con cobros en cero: el huésped está hospedado pero pagó otro día. No es un error; son bases contables distintas.
          </div>
        </div>
      }

      <!-- Punto 13: Resumen de reservas -->
      @if (reportService.reservationsLoading()) {
        <ui-skeleton height="10rem" />
      } @else if (reportService.reservationsReport(); as res) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <article class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] p-5">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">Total reservas</p>
            <p class="mt-1.5 text-2xl font-bold">{{ res.totalReservas }}</p>
          </article>
          <article class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] p-5">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">Canceladas</p>
            <p class="mt-1.5 text-2xl font-bold text-[var(--color-danger-500)]">{{ res.totalCanceladas }}</p>
          </article>
          <article class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] p-5">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">Tasa cancelación</p>
            <p class="mt-1.5 text-2xl font-bold">{{ res.tasaCancelacion | number:'1.1-1' }}%</p>
          </article>
          <article class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] p-5">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">Estancia promedio</p>
            <p class="mt-1.5 text-2xl font-bold">{{ res.estanciaPromedioNoches | number:'1.1-1' }} noches</p>
          </article>
        </div>

        <app-reservations-summary
          [porEstado]="res.porEstado"
          [porTipoHabitacion]="res.porTipoHabitacion" />
      }

      @if (reportService.revenueError() || reportService.occupancyError() || reportService.reservationsError()) {
        <div class="rounded-xl bg-[var(--color-danger-500)]/10 border border-[var(--color-danger-500)]/20 px-4 py-3 text-[13px] text-[var(--color-danger-500)]">
          No se pudieron cargar algunos reportes. Verifica la conexión e intenta de nuevo.
        </div>
      }
    </div>
  `,
})
export class ReportsDashboardComponent implements OnInit {
  readonly reportService = inject(ReportService);
  private readonly toastr = inject(ToastrService);

  range: ReportDateRange = { ...DEFAULT_REPORT_RANGE };
  readonly exporting = signal(false);

  ngOnInit(): void {
    this.refresh();
  }

  onPeriodChange(): void {
    if (this.range.period !== 'CUSTOM') this.refresh();
  }

  refresh(): void {
    this.reportService.loadRevenueReport(this.range);
    this.reportService.loadReservationsReport(this.range);
    this.reportService.loadOccupancyReport(this.range);
  }

  exportReport(formato: ExportFormat): void {
    this.exporting.set(true);
    const tipos: ExportTipo[] = ['ingresos', 'reservas', 'ocupacion'];
    const fecha = new Date().toISOString().slice(0, 10);

    // Exporta los 3 reportes en el formato pedido. El nombre real del archivo
    // sale del Content-Disposition; el fallback solo cubre su ausencia.
    // forkJoin espera a que las 3 descargas terminen; el toast refleja el
    // resultado real (no antes de tiempo).
    const descargas = tipos.map((tipo) =>
      this.reportService.downloadExport(
        {
          tipo,
          formato,
          period: this.range.period,
          groupBy: this.range.groupBy,
          fechaInicio: this.range.fechaInicio,
          fechaFin: this.range.fechaFin,
        },
        `reporte-${tipo}-${fecha}.${EXPORT_EXTENSION[formato]}`,
      ),
    );

    forkJoin(descargas)
      .pipe(finalize(() => this.exporting.set(false)))
      .subscribe({
        next: () => this.toastr.success(`Reportes exportados como ${formato} correctamente.`),
        error: () => this.toastr.error('No se pudieron exportar los reportes.'),
      });
  }
}
