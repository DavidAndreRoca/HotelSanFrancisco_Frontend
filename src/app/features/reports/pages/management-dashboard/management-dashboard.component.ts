// features/reports/pages/management-dashboard/management-dashboard.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ReportService } from '../../services/report.service';
import { RevenueChartComponent } from '../../components/revenue-chart/revenue-chart.component';
import { OccupancyChartComponent } from '../../components/occupancy-chart/occupancy-chart.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiSkeletonComponent } from '../../../../shared/ui/skeleton/ui-skeleton.component';
import { DEFAULT_REPORT_RANGE } from '../../models/report.model';

interface KpiCard {
  label: string;
  value: string;
  variacion: number | null;
  tone: 'success' | 'danger' | 'neutral';
}

@Component({
  selector: 'app-management-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    RevenueChartComponent,
    OccupancyChartComponent,
    UiButtonComponent,
    UiSkeletonComponent,
  ],
  template: `
    <div class="space-y-6">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--color-primary-700)] font-semibold mb-1">
            Dashboard gerencial
          </p>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">
            Resumen ejecutivo
          </h1>
          @if (dashboard()?.generadoEn) {
            <p class="text-[12px] text-[var(--color-ink-muted)] mt-1">
              Actualizado: {{ dashboard()!.generadoEn | date:'dd/MM/yyyy HH:mm' }}
            </p>
          }
        </div>

        <div class="flex gap-2">
          <ui-button variant="primary" [loading]="reportService.managementLoading()" (click)="refresh()">
            Actualizar
          </ui-button>
          <ui-button variant="outline" [loading]="exporting()" (click)="exportConsolidado('PDF')">
            ↓ PDF ejecutivo
          </ui-button>
          <ui-button variant="outline" [loading]="exporting()" (click)="exportConsolidado('EXCEL')">
            ↓ Excel
          </ui-button>
        </div>
      </header>

      <!-- KPIs -->
      @if (reportService.managementLoading()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4,5,6]; track i) { <ui-skeleton height="6rem" /> }
        </div>
      } @else {
        <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          @for (kpi of kpiCards(); track kpi.label) {
            <article
              class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] p-4">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)] leading-tight">
                {{ kpi.label }}
              </p>
              <p class="mt-2 text-xl font-bold leading-none" [class]="valueTone(kpi.tone)">
                {{ kpi.value }}
              </p>
              @if (kpi.variacion !== null) {
                <p class="mt-1.5 text-[11px] font-medium" [class]="kpi.variacion >= 0 ? 'text-[var(--color-success-500)]' : 'text-[var(--color-danger-500)]'">
                  {{ kpi.variacion >= 0 ? '▲' : '▼' }} {{ kpi.variacion | number:'1.1-1' }}% vs mes anterior
                </p>
              }
            </article>
          }
        </div>
      }

      <!-- Alertas de gestión -->
      @if (dashboard()?.kpis; as kpis) {
        @if (kpis.reservasPendientesPago > 0) {
          <div class="rounded-xl bg-[var(--color-warning-500)]/10 border border-[var(--color-warning-500)]/30 px-4 py-3 text-[13px] text-[var(--color-warning-700)] flex items-center gap-2">
            <span>⚠</span>
            <span>
              Hay <strong>{{ kpis.reservasPendientesPago }}</strong> reservas con pago pendiente que requieren atención.
            </span>
          </div>
        }
        @if (kpis.cancelacionesMes > 3) {
          <div class="rounded-xl bg-[var(--color-danger-500)]/10 border border-[var(--color-danger-500)]/20 px-4 py-3 text-[13px] text-[var(--color-danger-500)] flex items-center gap-2">
            <span>✖</span>
            <span>
              Se registraron <strong>{{ kpis.cancelacionesMes }}</strong> cancelaciones este mes. Considera revisar la política de cancelación.
            </span>
          </div>
        }
      }

      @if (reportService.managementError()) {
        <div class="rounded-xl bg-[var(--color-danger-500)]/10 border border-[var(--color-danger-500)]/20 px-4 py-3 text-[13px] text-[var(--color-danger-500)]">
          {{ reportService.managementError() }}
        </div>
      }

      <!-- Gráficos -->
      @if (!reportService.managementLoading() && dashboard()) {
        <div class="grid lg:grid-cols-2 gap-4">
          <div>
            <p class="text-[13px] font-semibold text-[var(--color-ink)] mb-3">Ingresos del mes</p>
            <app-revenue-chart
              [serie]="dashboard()!.ingresos.serie"
              [total]="dashboard()!.ingresos.totalIngresos" />
          </div>
          <div>
            <p class="text-[13px] font-semibold text-[var(--color-ink)] mb-3">Ocupación del mes</p>
            <app-occupancy-chart [serie]="dashboard()!.ocupacion.serie" />
          </div>
        </div>
      }
    </div>
  `,
})
export class ManagementDashboardComponent implements OnInit {
  readonly reportService = inject(ReportService);
  private readonly toastr = inject(ToastrService);
  private readonly currency = new CurrencyPipe('es-PE');
  private readonly decimal = new DecimalPipe('es-PE');

  readonly exporting = signal(false);
  readonly dashboard = this.reportService.management;

  readonly kpiCards = computed<KpiCard[]>(() => {
    const kpis = this.dashboard()?.kpis;
    if (!kpis) return [];
    return [
      {
        label: 'Ingresos mes actual',
        value: this.currency.transform(kpis.ingresosMesActual, 'PEN', 'symbol-narrow', '1.0-0') ?? '—',
        variacion: kpis.variacionIngresos,
        tone: kpis.variacionIngresos >= 0 ? 'success' : 'danger',
      },
      {
        label: 'Ocupación actual',
        value: `${this.decimal.transform(kpis.ocupacionActual, '1.1-1')}%`,
        variacion: kpis.variacionOcupacion,
        tone: kpis.variacionOcupacion >= 0 ? 'success' : 'danger',
      },
      {
        label: 'Reservas activas',
        value: String(kpis.reservasActivas),
        variacion: null,
        tone: 'neutral',
      },
      {
        label: 'Pago pendiente',
        value: String(kpis.reservasPendientesPago),
        variacion: null,
        tone: kpis.reservasPendientesPago > 0 ? 'danger' : 'success',
      },
      {
        label: 'ADR',
        value: this.currency.transform(kpis.adrActual, 'PEN', 'symbol-narrow', '1.2-2') ?? '—',
        variacion: null,
        tone: 'neutral',
      },
      {
        label: 'RevPAR',
        value: this.currency.transform(kpis.revparActual, 'PEN', 'symbol-narrow', '1.2-2') ?? '—',
        variacion: null,
        tone: 'neutral',
      },
    ];
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.reportService.loadManagementDashboard({ ...DEFAULT_REPORT_RANGE, period: 'MONTH' });
  }

  valueTone(tone: KpiCard['tone']): string {
    const map: Record<KpiCard['tone'], string> = {
      success: 'text-[var(--color-success-500)]',
      danger: 'text-[var(--color-danger-500)]',
      neutral: 'text-[var(--color-ink)]',
    };
    return map[tone];
  }

  exportConsolidado(formato: 'PDF' | 'EXCEL'): void {
    this.exporting.set(true);
    const ext = formato === 'PDF' ? 'pdf' : 'xlsx';
    this.reportService.downloadExport(
      {
        tipo: 'GERENCIAL',
        formato,
        rango: { ...DEFAULT_REPORT_RANGE, period: 'MONTH' },
      },
      `dashboard-gerencial-${new Date().toISOString().slice(0, 10)}.${ext}`,
    );
    this.exporting.set(false);
    this.toastr.success(`Dashboard gerencial exportado como ${formato}.`);
  }
}
