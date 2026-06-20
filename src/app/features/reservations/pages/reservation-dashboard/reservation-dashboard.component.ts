import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ReservationService } from '../../services/reservation.service';
import { NotificationService } from '../../../notifications/services/notifications.service';
import { ReservationStatsComponent } from '../../components/reservation-stats/reservation-stats.component';
import { ReservationTableComponent } from '../../components/reservation-table/reservation-table.component';
import { ReservationFiltersComponent } from '../../components/reservation-filters/reservation-filters.component';
import { ReservationDetailComponent } from '../../components/reservation-detail/reservation-detail.component';
import { ReservationFormComponent, ReservaFormSaveEvent } from '../../components/reservation-form/reservation-form.component';
import { CancelarModalComponent } from '../../components/cancelar-modal/cancelar-modal.component';
import { RoomSidebarComponent } from '../../../rooms/components/room-sidebar/room-sidebar.component';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { Reserva, CancelarReservaPayload, CreateReservaPayload, UpdateReservaPayload } from '../../models/reservation.model';

@Component({
  selector: 'app-reservations-dashboard',
  standalone: true,
  imports: [
    RoomSidebarComponent,
    ReservationStatsComponent,
    ReservationTableComponent,
    ReservationFiltersComponent,
    ReservationDetailComponent,
    ReservationFormComponent,
    CancelarModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-layout">
      <app-room-sidebar />

      <main class="main-content">
        <div class="header">
          <div>
            <h1>Gestión de Reservas</h1>
            <p class="subtitle">Administra las reservas y el estado de los huéspedes</p>
          </div>
          <button class="btn-nueva" (click)="abrirNuevaReserva()">
            ＋ Nueva reserva
          </button>
        </div>

        <app-reservation-stats [stats]="svc.stats()" />

        <app-reservation-filters
          [pendienteCount]="svc.pendienteCount()"
          [confirmadaCount]="svc.confirmadaCount()"
          [checkInCount]="svc.checkInCount()"
          [checkOutCount]="svc.checkOutCount()"
          [canceladaCount]="svc.canceladaCount()"
          [noShowCount]="svc.noShowCount()"
          (onSearch)="svc.setSearchTerm($event)"
          (onEstadoFilter)="svc.setEstadoFilter($event)" />

        <app-reservation-table
          [reservas]="svc.filteredReservas()"
          (onVerReserva)="abrirDetalle($event)"
          (onEditarReserva)="abrirEditar($event)"
          (onCheckIn)="handleCheckIn($event)"
          (onCheckOut)="handleCheckOut($event)"
          (onCancelarReserva)="iniciarCancelacion($event)" />
      </main>
    </div>

    <!-- Detail modal -->
    <app-reservation-detail
      [isOpen]="detailAbierto()"
      [reservaId]="reservaIdDetalle()"
      (onClose)="detailAbierto.set(false)"
      (onEditar)="abrirEditarDesdeDetalle($event)"
      (onCheckIn)="handleCheckInDesdeDetalle($event)"
      (onCheckOut)="handleCheckOutDesdeDetalle($event)"
      (onCancelar)="iniciarCancelacionDesdeDetalle($event)" />

    <!-- Form modal (create + edit) -->
    <app-reservation-form
      [isOpen]="formAbierto()"
      [reserva]="reservaAEditar()"
      (onClose)="formAbierto.set(false)"
      (onSave)="guardarReserva($event)" />

    <!-- Cancelar modal -->
    <app-cancelar-modal
      [isOpen]="cancelarAbierto()"
      [reserva]="reservaACancelar()"
      (onClose)="cancelarAbierto.set(false)"
      (onCancelar)="confirmarCancelacion($event)" />
  `,
  styles: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');
    * { font-family: 'Inter', sans-serif; }

    .dashboard-layout {
      display: flex;
      min-height: 100vh;
      background: #F9F5F0;
    }

    .main-content {
      flex: 1;
      margin-left: 260px;
      padding: 2rem;
      background: #F9F5F0;
      min-height: 100vh;
      animation: fadeIn 0.4s ease-out;
    }

    .header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #C5A048;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header h1 {
      margin: 0;
      font-size: 1.875rem;
      font-weight: 700;
      color: #2D2926;
      letter-spacing: -0.02em;
    }

    .header h1::before {
      content: '📅';
      font-size: 1.5rem;
      margin-right: 0.75rem;
      vertical-align: middle;
    }

    .subtitle { color: #8E6F2E; margin: 0.25rem 0 0; font-size: 1rem; }

    .btn-nueva {
      padding: 0.625rem 1.375rem;
      background: #C5A048; color: white;
      border: none; border-radius: 0.625rem;
      font-size: 0.9rem; font-weight: 700;
      cursor: pointer; transition: all 0.2s;
      white-space: nowrap;
    }
    .btn-nueva:hover {
      background: #8E6F2E;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(197,160,72,0.35);
    }

    app-reservation-stats   { display: block; margin-bottom: 1.5rem; }
    app-reservation-filters { display: block; margin-bottom: 1.5rem; }
    app-reservation-table   { display: block; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    :focus-visible { outline: 2px solid #C5A048; outline-offset: 2px; }

    @media (max-width: 1024px) {
      .main-content { margin-left: 72px; padding: 1.5rem; }
      .header h1 { font-size: 1.5rem; }
    }

    @media (max-width: 768px) {
      .main-content { margin-left: 0; padding: 1rem; padding-bottom: 80px; }
      .header { flex-direction: column; align-items: flex-start; }
      .header h1 { font-size: 1.25rem; }
      .btn-nueva { align-self: flex-start; }
    }

    @media (max-width: 480px) {
      .main-content { padding: 0.75rem; padding-bottom: 80px; }
    }
  `
})
export class ReservationsDashboardComponent {
  protected svc     = inject(ReservationService);
  private confirm   = inject(ConfirmDialogService);
  reservationService = inject(ReservationService);
  private readonly notificationService = inject(NotificationService);
  private readonly toastr = inject(ToastrService);

  // ── Detail modal ───────────────────────────────────────────────────────────
  readonly detailAbierto    = signal(false);
  readonly reservaIdDetalle = signal<number | null>(null);

  // ── Form modal ─────────────────────────────────────────────────────────────
  readonly formAbierto    = signal(false);
  readonly reservaAEditar = signal<Reserva | null>(null);

  // ── Cancelar modal ─────────────────────────────────────────────────────────
  readonly cancelarAbierto    = signal(false);
  readonly reservaACancelar   = signal<Reserva | null>(null);

  // ── Detail modal actions ───────────────────────────────────────────────────

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

  // ── Form actions ───────────────────────────────────────────────────────────

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
    obs$.subscribe(() => this.formAbierto.set(false));
  }

  // ── Check-in / Check-out ───────────────────────────────────────────────────

  async handleCheckIn(id: number): Promise<void> {
    const reserva = this.svc.findById(id);
    const nombre  = reserva?.huespedes.find(h => h.esPrincipal)?.nombreCompleto
                  ?? reserva?.huespedes[0]?.nombreCompleto ?? '';
    const ok = await this.confirm.ask({
      title:       'Confirmar Check-in',
      message:     `¿Registrar el ingreso de ${nombre}?`,
      confirmText: 'Sí, Check-in',
      cancelText:  'Cancelar',
    });
    if (ok) this.svc.cambiarEstado(id, { nuevoEstado: 'CHECK_IN' }).subscribe();
  }

  async handleCheckOut(id: number): Promise<void> {
    const reserva = this.svc.findById(id);
    const nombre  = reserva?.huespedes.find(h => h.esPrincipal)?.nombreCompleto
                  ?? reserva?.huespedes[0]?.nombreCompleto ?? '';
    const ok = await this.confirm.ask({
      title:       'Confirmar Check-out',
      message:     `¿Registrar la salida de ${nombre}?`,
      confirmText: 'Sí, Check-out',
      cancelText:  'Cancelar',
    });
    if (ok) this.svc.cambiarEstado(id, { nuevoEstado: 'CHECK_OUT' }).subscribe();
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
    this.svc.cancelar(r.reservaId, payload).subscribe(() => {
      this.cancelarAbierto.set(false);
      this.reservaACancelar.set(null);
    });
  }
}
