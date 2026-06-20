import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ReservationService } from '../../services/reservation.service';
import { ReservationStatsComponent } from '../../components/reservation-stats/reservation-stats.component';
import { ReservationTableComponent } from '../../components/reservation-table/reservation-table.component';
import { ReservationFiltersComponent } from '../../components/reservation-filters/reservation-filters.component';
import { ReservationDetailComponent } from '../../components/reservation-detail/reservation-detail.component';
import { ReservationFormComponent, ReservaFormSaveEvent } from '../../components/reservation-form/reservation-form.component';
import { CancelarModalComponent } from '../../components/cancelar-modal/cancelar-modal.component';
import {
  CancelarReservaPayload,
  CreateReservaPayload,
  Reserva,
  UpdateReservaPayload,
} from '../../models/reservation.model';

@Component({
  selector: 'app-reservations-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReservationStatsComponent,
    ReservationTableComponent,
    ReservationFiltersComponent,
    ReservationDetailComponent,
    ReservationFormComponent,
    CancelarModalComponent,
  ],
  template: `
    <div class="space-y-6">

      <!-- Cabecera -->
      <header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-[11px] uppercase tracking-[0.3em] text-[#C5A048] font-semibold mb-1">
            Recepción
          </p>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-[#2D2926]">
            Gestión de reservas
          </h1>
          <p class="text-[15px] text-[#2D2926]/55 mt-1">
            Administra las reservas y el estado de los huéspedes.
          </p>
        </div>
        <button type="button" (click)="abrirNuevaReserva()"
          class="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#C5A048] text-white
                 text-sm font-semibold hover:bg-[#8E6F2E] transition-colors shrink-0">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" aria-hidden="true">
            <path stroke-linecap="round" d="M12 5v14M5 12h14"/>
          </svg>
          Nueva reserva
        </button>
      </header>

      <!-- Stats -->
      <app-reservation-stats [stats]="svc.stats()" />

      <!-- Filtros -->
      <app-reservation-filters
        [pendienteCount]="svc.pendienteCount()"
        [confirmadaCount]="svc.confirmadaCount()"
        [checkInCount]="svc.checkInCount()"
        [checkOutCount]="svc.checkOutCount()"
        [canceladaCount]="svc.canceladaCount()"
        [noShowCount]="svc.noShowCount()"
        (onSearch)="svc.setSearchTerm($event)"
        (onEstadoFilter)="svc.setEstadoFilter($event)" />

      <!-- Tabla -->
      <app-reservation-table
        [reservas]="svc.filteredReservas()"
        (onVerReserva)="abrirDetalle($event)"
        (onEditarReserva)="abrirEditar($event)"
        (onCheckIn)="handleCheckIn($event)"
        (onCheckOut)="handleCheckOut($event)"
        (onCancelarReserva)="iniciarCancelacion($event)" />

    </div>

    <!-- Modales -->
    <app-reservation-detail
      [isOpen]="detailAbierto()"
      [reservaId]="reservaIdDetalle()"
      (onClose)="detailAbierto.set(false)"
      (onEditar)="abrirEditarDesdeDetalle($event)"
      (onCheckIn)="handleCheckInDesdeDetalle($event)"
      (onCheckOut)="handleCheckOutDesdeDetalle($event)"
      (onCancelar)="iniciarCancelacionDesdeDetalle($event)" />

    <app-reservation-form
      [isOpen]="formAbierto()"
      [reserva]="reservaAEditar()"
      (onClose)="formAbierto.set(false)"
      (onSave)="guardarReserva($event)" />

    <app-cancelar-modal
      [isOpen]="cancelarAbierto()"
      [reserva]="reservaACancelar()"
      (onClose)="cancelarAbierto.set(false)"
      (onCancelar)="confirmarCancelacion($event)" />
  `,
})
export class ReservationsDashboardComponent {
  protected readonly svc    = inject(ReservationService);
  private readonly confirm  = inject(ConfirmDialogService);
  private readonly toastr   = inject(ToastrService);

  readonly detailAbierto    = signal(false);
  readonly reservaIdDetalle = signal<number | null>(null);
  readonly formAbierto      = signal(false);
  readonly reservaAEditar   = signal<Reserva | null>(null);
  readonly cancelarAbierto  = signal(false);
  readonly reservaACancelar = signal<Reserva | null>(null);

  // ── Detail ─────────────────────────────────────────────────────────────────

  abrirDetalle(id: number): void {
    this.reservaIdDetalle.set(id);
    this.detailAbierto.set(true);
  }

  abrirEditarDesdeDetalle(id: number): void {
    this.detailAbierto.set(false);
    this.abrirEditar(id);
  }

  async handleCheckInDesdeDetalle(id: number): Promise<void> {
    this.detailAbierto.set(false);
    await this.handleCheckIn(id);
  }

  async handleCheckOutDesdeDetalle(id: number): Promise<void> {
    this.detailAbierto.set(false);
    await this.handleCheckOut(id);
  }

  iniciarCancelacionDesdeDetalle(id: number): void {
    this.detailAbierto.set(false);
    this.iniciarCancelacion(id);
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  abrirNuevaReserva(): void {
    this.reservaAEditar.set(null);
    this.formAbierto.set(true);
  }

  abrirEditar(id: number): void {
    const r = this.svc.findById(id);
    if (!r) return;
    this.reservaAEditar.set(r);
    this.formAbierto.set(true);
  }

  guardarReserva(event: ReservaFormSaveEvent): void {
    const obs$ = event.id != null
      ? this.svc.update(event.id, event.payload as UpdateReservaPayload)
      : this.svc.create(event.payload as CreateReservaPayload);
    obs$.subscribe({
      next: () => {
        this.formAbierto.set(false);
        this.toastr.success(event.id ? 'Reserva actualizada.' : 'Reserva creada.');
      },
      error: (err: { friendlyMessage?: string }) =>
        this.toastr.error(err.friendlyMessage ?? 'No se pudo guardar.', 'Error'),
    });
  }

  // ── Check-in / Check-out ───────────────────────────────────────────────────

  async handleCheckIn(id: number): Promise<void> {
    const r      = this.svc.findById(id);
    const nombre = r?.huespedes.find(h => h.esPrincipal)?.nombreCompleto
                ?? r?.huespedes.at(0)?.nombreCompleto ?? '';
    const ok = await this.confirm.ask({
      title: 'Confirmar Check-in',
      message: `¿Registrar el ingreso de ${nombre}?`,
      confirmText: 'Sí, Check-in',
      cancelText: 'Cancelar',
    });
    if (ok) {
      this.svc.cambiarEstado(id, { nuevoEstado: 'CHECK_IN' }).subscribe({
        next: () => this.toastr.success('Check-in registrado.'),
        error: (err: { friendlyMessage?: string }) =>
          this.toastr.error(err.friendlyMessage ?? 'No se pudo registrar el check-in.', 'Error'),
      });
    }
  }

  async handleCheckOut(id: number): Promise<void> {
    const r      = this.svc.findById(id);
    const nombre = r?.huespedes.find(h => h.esPrincipal)?.nombreCompleto
                ?? r?.huespedes.at(0)?.nombreCompleto ?? '';
    const ok = await this.confirm.ask({
      title: 'Confirmar Check-out',
      message: `¿Registrar la salida de ${nombre}?`,
      confirmText: 'Sí, Check-out',
      cancelText: 'Cancelar',
    });
    if (ok) {
      this.svc.cambiarEstado(id, { nuevoEstado: 'CHECK_OUT' }).subscribe({
        next: () => this.toastr.success('Check-out registrado.'),
        error: (err: { friendlyMessage?: string }) =>
          this.toastr.error(err.friendlyMessage ?? 'No se pudo registrar el check-out.', 'Error'),
      });
    }
  }

  // ── Cancelar ───────────────────────────────────────────────────────────────

  iniciarCancelacion(id: number): void {
    const r = this.svc.findById(id);
    if (!r) return;
    this.reservaACancelar.set(r);
    this.cancelarAbierto.set(true);
  }

  confirmarCancelacion(payload: CancelarReservaPayload): void {
    const r = this.reservaACancelar();
    if (!r) return;
    this.svc.cancelar(r.reservaId, payload).subscribe({
      next: () => {
        this.toastr.success('Reserva cancelada.');
        this.cancelarAbierto.set(false);
        this.reservaACancelar.set(null);
      },
      error: (err: { friendlyMessage?: string }) =>
        this.toastr.error(err.friendlyMessage ?? 'No se pudo cancelar.', 'Error'),
    });
  }
}
