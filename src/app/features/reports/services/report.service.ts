// features/reports/services/report.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import {
  ExportRequest,
  ManagementDashboard,
  OccupancyReport,
  ReportDateRange,
  ReservationsReport,
  RevenueReport,
} from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/reportes';

  // ---------------------------------------------------------------------
  // Punto 12: Reporte de ingresos
  // ---------------------------------------------------------------------

  private readonly _revenue = signal<RevenueReport | null>(null);
  private readonly _revenueLoading = signal(false);
  private readonly _revenueError = signal<string | null>(null);

  readonly revenue = this._revenue.asReadonly();
  readonly revenueLoading = this._revenueLoading.asReadonly();
  readonly revenueError = this._revenueError.asReadonly();

  loadRevenueReport(range: ReportDateRange): void {
    this._revenueLoading.set(true);
    this._revenueError.set(null);
    this.api
      .get<RevenueReport>(`${this.base}/ingresos`, { params: this.rangeParams(range) })
      .pipe(finalize(() => this._revenueLoading.set(false)))
      .subscribe({
        next: (res) => this._revenue.set(res),
        error: (err: { friendlyMessage?: string }) => {
          this._revenueError.set(err.friendlyMessage ?? 'No se pudo cargar el reporte de ingresos.');
        },
      });
  }

  // ---------------------------------------------------------------------
  // Punto 13: Reporte de reservas
  // ---------------------------------------------------------------------

  private readonly _reservations = signal<ReservationsReport | null>(null);
  private readonly _reservationsLoading = signal(false);
  private readonly _reservationsError = signal<string | null>(null);

  readonly reservationsReport = this._reservations.asReadonly();
  readonly reservationsLoading = this._reservationsLoading.asReadonly();
  readonly reservationsError = this._reservationsError.asReadonly();

  loadReservationsReport(range: ReportDateRange): void {
    this._reservationsLoading.set(true);
    this._reservationsError.set(null);
    this.api
      .get<ReservationsReport>(`${this.base}/reservas`, { params: this.rangeParams(range) })
      .pipe(finalize(() => this._reservationsLoading.set(false)))
      .subscribe({
        next: (res) => this._reservations.set(res),
        error: (err: { friendlyMessage?: string }) => {
          this._reservationsError.set(err.friendlyMessage ?? 'No se pudo cargar el reporte de reservas.');
        },
      });
  }

  // ---------------------------------------------------------------------
  // Punto 14: Reporte de ocupación
  // ---------------------------------------------------------------------

  private readonly _occupancy = signal<OccupancyReport | null>(null);
  private readonly _occupancyLoading = signal(false);
  private readonly _occupancyError = signal<string | null>(null);

  readonly occupancy = this._occupancy.asReadonly();
  readonly occupancyLoading = this._occupancyLoading.asReadonly();
  readonly occupancyError = this._occupancyError.asReadonly();

  loadOccupancyReport(range: ReportDateRange): void {
    this._occupancyLoading.set(true);
    this._occupancyError.set(null);
    this.api
      .get<OccupancyReport>(`${this.base}/ocupacion`, { params: this.rangeParams(range) })
      .pipe(finalize(() => this._occupancyLoading.set(false)))
      .subscribe({
        next: (res) => this._occupancy.set(res),
        error: (err: { friendlyMessage?: string }) => {
          this._occupancyError.set(err.friendlyMessage ?? 'No se pudo cargar el reporte de ocupación.');
        },
      });
  }

  // ---------------------------------------------------------------------
  // Punto 15: Dashboard gerencial
  // ---------------------------------------------------------------------

  private readonly _management = signal<ManagementDashboard | null>(null);
  private readonly _managementLoading = signal(false);
  private readonly _managementError = signal<string | null>(null);

  readonly management = this._management.asReadonly();
  readonly managementLoading = this._managementLoading.asReadonly();
  readonly managementError = this._managementError.asReadonly();

  loadManagementDashboard(range: ReportDateRange): void {
    this._managementLoading.set(true);
    this._managementError.set(null);
    this.api
      .get<ManagementDashboard>(`${this.base}/gerencial`, { params: this.rangeParams(range) })
      .pipe(finalize(() => this._managementLoading.set(false)))
      .subscribe({
        next: (res) => this._management.set(res),
        error: (err: { friendlyMessage?: string }) => {
          this._managementError.set(err.friendlyMessage ?? 'No se pudo cargar el dashboard gerencial.');
        },
      });
  }

  // ---------------------------------------------------------------------
  // Punto 17: Exportar a PDF / Excel
  // ---------------------------------------------------------------------

  export(request: ExportRequest): Observable<Blob> {
    return this.api.post<Blob, ExportRequest>(`${this.base}/exportar`, request);
  }

  downloadExport(request: ExportRequest, filename: string): void {
    this.export(request).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      },
    });
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  private rangeParams(range: ReportDateRange) {
    return {
      period: range.period,
      groupBy: range.groupBy,
      fechaInicio: range.fechaInicio ?? '',
      fechaFin: range.fechaFin ?? '',
    };
  }
}
