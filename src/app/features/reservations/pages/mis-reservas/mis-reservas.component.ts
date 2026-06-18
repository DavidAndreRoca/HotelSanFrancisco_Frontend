import {
  Component, inject, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AuthStore } from '../../../../core/auth/auth.store';
import { ReservationService } from '../../services/reservation.service';
import { ReservationDetailComponent } from '../../components/reservation-detail/reservation-detail.component';
import { CancelarModalComponent } from '../../components/cancelar-modal/cancelar-modal.component';
import { RoomSidebarComponent } from '../../../rooms/components/room-sidebar/room-sidebar.component';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { Reserva, EstadoReserva, CancelarReservaPayload } from '../../models/reservation.model';

type FiltroMisReservas = EstadoReserva | 'todas' | 'activas';

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [RouterLink, DecimalPipe, RoomSidebarComponent, ReservationDetailComponent, CancelarModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-layout">
      <app-room-sidebar />

      <main class="main-content">

        <!-- Header -->
        <div class="header">
          <div class="header-left">
            <div class="greeting">
              <span class="greeting-icon">👋</span>
              <div>
                <h1>Mis Reservas</h1>
                <p class="greeting-sub">
                  @if (auth.user()) {
                    Hola, <strong>{{ auth.user()!.nombreCompleto }}</strong> · {{ auth.user()!.rol }}
                  } @else {
                    Mis reservas asignadas
                  }
                </p>
              </div>
            </div>
          </div>
          <a routerLink="/reservations" class="btn-panel">
            ⚙️ Panel completo
          </a>
        </div>

        <!-- Stat chips -->
        <div class="stat-chips">
          <div class="chip chip-total">
            <span class="chip-num">{{ misReservas().length }}</span>
            <span class="chip-label">Total</span>
          </div>
          <div class="chip chip-activa">
            <span class="chip-num">{{ activasCount() }}</span>
            <span class="chip-label">Activas</span>
          </div>
          <div class="chip chip-checkin">
            <span class="chip-num">{{ todayCheckIns() }}</span>
            <span class="chip-label">Hoy check-in</span>
          </div>
          <div class="chip chip-checkout">
            <span class="chip-num">{{ todayCheckOuts() }}</span>
            <span class="chip-label">Hoy check-out</span>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filter-bar">
          @for (f of filtros; track f.value) {
            <button
              class="filter-btn"
              [class.active]="filtroActivo() === f.value"
              (click)="filtroActivo.set(f.value)">
              {{ f.label }}
              @if (f.count() > 0) {
                <span class="filter-count">{{ f.count() }}</span>
              }
            </button>
          }
        </div>

        <!-- Lista de reservas -->
        @if (reservasFiltradas().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📋</span>
            <p>No hay reservas con el filtro seleccionado.</p>
          </div>
        } @else {
          <div class="cards-grid">
            @for (r of reservasFiltradas(); track r.reservaId) {
              <div class="reserva-card" [class]="'card-' + r.estado">
                <!-- Card header -->
                <div class="card-header">
                  <span [className]="'estado-badge ' + r.estado">{{ estadoLabel(r.estado) }}</span>
                  <span class="cod">{{ r.codReserva }}</span>
                  @if (r.canalNombre) {
                    <span class="canal-tag">{{ r.canalNombre }}</span>
                  }
                </div>

                <!-- Card body -->
                <div class="card-body">
                  <!-- Huesped principal -->
                  <div class="huesped-row">
                    <span class="avatar">{{ huespedPrincipal(r)[0] }}</span>
                    <div>
                      <span class="huesped-nombre">{{ huespedPrincipal(r) }}</span>
                      <span class="huesped-doc">{{ huespedDoc(r) }}</span>
                    </div>
                  </div>

                  <!-- Fechas -->
                  <div class="fechas-row">
                    <div class="fecha-block">
                      <span class="fecha-label">Check-in</span>
                      <span class="fecha-val">{{ formatFecha(r.fechaInicio) }}</span>
                    </div>
                    <div class="noches-sep">
                      <span class="noches-line">──</span>
                      <span class="noches-num">{{ calcNoches(r) }}n</span>
                      <span class="noches-line">──</span>
                    </div>
                    <div class="fecha-block right">
                      <span class="fecha-label">Check-out</span>
                      <span class="fecha-val">{{ formatFecha(r.fechaFin) }}</span>
                    </div>
                  </div>

                  <!-- Habitaciones -->
                  <div class="habs-row">
                    @for (h of r.habitaciones; track h.reservaHabitacionId) {
                      <span class="hab-chip">🛏️ Hab. {{ h.habitacionNumero }} · {{ h.tipoHabitacionNombre }}</span>
                    }
                    <span class="pax-chip">👥 {{ r.nroAdultos }}A{{ r.nroNinos > 0 ? ' + ' + r.nroNinos + 'N' : '' }}</span>
                  </div>
                </div>

                <!-- Card footer -->
                <div class="card-footer">
                  <div class="monto-col">
                    <span class="monto-total">S/ {{ r.montoTotal | number:'1.2-2' }}</span>
                    @if (r.adelanto > 0) {
                      <span class="monto-saldo">
                        Saldo: S/ {{ (r.montoTotal - r.adelanto) | number:'1.2-2' }}
                      </span>
                    }
                  </div>
                  <div class="actions-col">
                    <button class="btn-action btn-ver" (click)="abrirDetalle(r.reservaId)">
                      Ver detalle
                    </button>
                    @if (puedeCancelar(r.estado)) {
                      <button class="btn-action btn-cancelar" (click)="iniciarCancelacion(r)">
                        Cancelar
                      </button>
                    }
                    @if (r.estado === 'CONFIRMADA' || r.estado === 'PENDIENTE') {
                      <button class="btn-action btn-checkin" (click)="handleCheckIn(r.reservaId)">
                        Check-in
                      </button>
                    }
                    @if (r.estado === 'CHECK_IN') {
                      <button class="btn-action btn-checkout" (click)="handleCheckOut(r.reservaId)">
                        Check-out
                      </button>
                    }
                  </div>
                </div>

                <!-- Today indicator -->
                @if (esHoy(r.fechaInicio)) {
                  <div class="hoy-banner entrada">🔔 Check-in hoy</div>
                }
                @if (esHoy(r.fechaFin) && r.estado === 'CHECK_IN') {
                  <div class="hoy-banner salida">🔔 Check-out hoy</div>
                }
              </div>
            }
          </div>
        }

      </main>
    </div>

    <!-- Modales reutilizados -->
    <app-reservation-detail
      [isOpen]="detailAbierto()"
      [reservaId]="reservaIdDetalle()"
      (onClose)="detailAbierto.set(false)"
      (onEditar)="detailAbierto.set(false)"
      (onCheckIn)="handleCheckIn($event)"
      (onCheckOut)="handleCheckOut($event)"
      (onCancelar)="iniciarCancelacionById($event)" />

    <app-cancelar-modal
      [isOpen]="cancelarAbierto()"
      [reserva]="reservaACancelar()"
      (onClose)="cancelarAbierto.set(false)"
      (onCancelar)="confirmarCancelacion($event)" />
  `,
  styles: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');
    * { font-family: 'Inter', sans-serif; }

    .dashboard-layout { display: flex; min-height: 100vh; background: #F9F5F0; }

    .main-content {
      flex: 1; margin-left: 260px; padding: 2rem;
      background: #F9F5F0; min-height: 100vh;
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Header */
    .header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 1.75rem; flex-wrap: wrap; gap: 1rem;
    }
    .header-left { display: flex; align-items: center; }
    .greeting { display: flex; align-items: center; gap: 1rem; }
    .greeting-icon { font-size: 2.5rem; }
    .greeting h1 { margin: 0; font-size: 1.75rem; font-weight: 800; color: #2D2926; letter-spacing: -0.03em; }
    .greeting-sub { margin: 0.125rem 0 0; color: #8E6F2E; font-size: 0.9rem; }
    .greeting-sub strong { color: #C5A048; }

    .btn-panel {
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.5rem 1.125rem; background: white;
      border: 1.5px solid #EEE3D1; border-radius: 0.5rem;
      color: #8E6F2E; font-size: 0.875rem; font-weight: 600;
      text-decoration: none; transition: all 0.2s;
    }
    .btn-panel:hover { border-color: #C5A048; color: #C5A048; background: #FFFDF5; }

    /* Stat chips */
    .stat-chips {
      display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap;
    }
    .chip {
      display: flex; flex-direction: column; align-items: center;
      padding: 0.75rem 1.25rem; border-radius: 0.75rem;
      background: white; border: 1.5px solid #EEE3D1;
      min-width: 90px;
    }
    .chip-num { font-size: 1.625rem; font-weight: 800; line-height: 1; }
    .chip-label { font-size: 0.7rem; color: #8E6F2E; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0.25rem; }
    .chip-total .chip-num    { color: #2D2926; }
    .chip-activa .chip-num   { color: #C5A048; }
    .chip-checkin .chip-num  { color: #2E7D32; }
    .chip-checkout .chip-num { color: #4338CA; }

    /* Filter bar */
    .filter-bar {
      display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;
    }
    .filter-btn {
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.4375rem 1rem; border-radius: 2rem;
      background: white; border: 1.5px solid #EEE3D1;
      font-size: 0.8125rem; font-weight: 500; color: #8E6F2E;
      cursor: pointer; transition: all 0.2s;
    }
    .filter-btn:hover { border-color: #C5A048; color: #C5A048; }
    .filter-btn.active { background: #C5A048; border-color: #C5A048; color: white; font-weight: 700; }
    .filter-count {
      background: rgba(255,255,255,0.35); border-radius: 2rem;
      padding: 0 0.4rem; font-size: 0.7rem; font-weight: 700;
    }
    .filter-btn:not(.active) .filter-count { background: #EEE3D1; color: #8E6F2E; }

    /* Empty state */
    .empty-state {
      text-align: center; padding: 4rem 2rem;
      color: #8E6F2E;
    }
    .empty-icon { display: block; font-size: 3rem; margin-bottom: 1rem; }
    .empty-state p { font-size: 0.9375rem; margin: 0; }

    /* Cards grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 1.25rem;
    }

    /* Reserva card */
    .reserva-card {
      background: white; border-radius: 1rem;
      border: 1.5px solid #EEE3D1;
      overflow: hidden; transition: all 0.25s;
      position: relative;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    .reserva-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }

    /* Left border accent by estado */
    .reserva-card::before {
      content: ''; position: absolute;
      top: 0; left: 0; bottom: 0; width: 4px;
    }
    .reserva-card.card-CONFIRMADA::before  { background: #2E7D32; }
    .reserva-card.card-CHECK_IN::before    { background: #C5A048; }
    .reserva-card.card-CHECK_OUT::before   { background: #6B7280; }
    .reserva-card.card-CANCELADA::before   { background: #DC2626; }
    .reserva-card.card-PENDIENTE::before   { background: #E6A017; }
    .reserva-card.card-NO_SHOW::before     { background: #6A1B9A; }

    /* Card header */
    .card-header {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.875rem 1rem 0.625rem 1.25rem;
      border-bottom: 1px solid #F9F5F0;
    }
    .estado-badge {
      display: inline-block; padding: 0.175rem 0.625rem;
      border-radius: 2rem; font-size: 0.65rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .CONFIRMADA  { background: #E8F5E9; color: #2E7D32; }
    .CHECK_IN    { background: #FFF8E1; color: #C5A048; }
    .CHECK_OUT   { background: #F5F5F5; color: #6B7280; }
    .CANCELADA   { background: #FFEBEE; color: #C62828; }
    .PENDIENTE   { background: #FFF3E0; color: #E6A017; }
    .NO_SHOW     { background: #F3E5F5; color: #6A1B9A; }

    .cod { font-family: monospace; font-size: 0.8125rem; font-weight: 700; color: #2D2926; flex: 1; }
    .canal-tag { font-size: 0.65rem; color: #8E6F2E; background: #EEE3D1; padding: 0.1rem 0.4rem; border-radius: 0.25rem; }

    /* Card body */
    .card-body { padding: 0.875rem 1rem 0.875rem 1.25rem; }

    .huesped-row { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 0.875rem; }
    .avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: #C5A048; color: white; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.875rem; font-weight: 700;
    }
    .huesped-nombre { display: block; font-size: 0.875rem; font-weight: 600; color: #2D2926; }
    .huesped-doc { font-size: 0.75rem; color: #8E6F2E; }

    .fechas-row {
      display: flex; align-items: center;
      background: #F9F5F0; border-radius: 0.5rem;
      padding: 0.5rem 0.75rem; margin-bottom: 0.75rem;
      gap: 0.5rem;
    }
    .fecha-block { display: flex; flex-direction: column; }
    .fecha-block.right { text-align: right; }
    .fecha-label { font-size: 0.6rem; font-weight: 600; color: #8E6F2E; text-transform: uppercase; letter-spacing: 0.5px; }
    .fecha-val { font-size: 0.875rem; font-weight: 700; color: #2D2926; }
    .noches-sep { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.25rem; }
    .noches-line { color: #EEE3D1; flex: 1; border-top: 1px dashed #EEE3D1; }
    .noches-num { font-size: 0.75rem; color: #C5A048; font-weight: 700; white-space: nowrap; }

    .habs-row { display: flex; flex-wrap: wrap; gap: 0.375rem; }
    .hab-chip, .pax-chip {
      font-size: 0.72rem; color: #8E6F2E;
      background: #EEE3D1; padding: 0.2rem 0.5rem;
      border-radius: 0.375rem; font-weight: 500;
    }

    /* Card footer */
    .card-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.75rem 1rem 0.875rem 1.25rem;
      border-top: 1px solid #F9F5F0; flex-wrap: wrap; gap: 0.5rem;
    }
    .monto-col { display: flex; flex-direction: column; }
    .monto-total { font-size: 1.0625rem; font-weight: 800; color: #2D2926; }
    .monto-saldo { font-size: 0.72rem; color: #C5A048; font-weight: 600; }

    .actions-col { display: flex; gap: 0.375rem; flex-wrap: wrap; }

    .btn-action {
      padding: 0.35rem 0.75rem; border-radius: 0.375rem;
      font-size: 0.78rem; font-weight: 600; cursor: pointer;
      border: 1px solid transparent; transition: all 0.2s;
    }
    .btn-ver     { background: #F9F5F0; color: #8E6F2E; border-color: #EEE3D1; }
    .btn-ver:hover     { background: #C5A048; color: white; border-color: #C5A048; }
    .btn-cancelar  { background: #FFF5F5; color: #DC2626; border-color: #FECACA; }
    .btn-cancelar:hover { background: #DC2626; color: white; border-color: #DC2626; }
    .btn-checkin   { background: #E8F5E9; color: #2E7D32; border-color: #A5D6A7; }
    .btn-checkin:hover { background: #2E7D32; color: white; border-color: #2E7D32; }
    .btn-checkout  { background: #E0E7FF; color: #4338CA; border-color: #C7D2FE; }
    .btn-checkout:hover { background: #4338CA; color: white; border-color: #4338CA; }

    /* Today indicator */
    .hoy-banner {
      font-size: 0.75rem; font-weight: 700;
      padding: 0.3rem 1.25rem;
      text-align: center;
    }
    .hoy-banner.entrada { background: #E8F5E9; color: #2E7D32; }
    .hoy-banner.salida  { background: #FFF8E1; color: #C5A048; }

    :focus-visible { outline: 2px solid #C5A048; outline-offset: 2px; }

    @media (max-width: 1024px) {
      .main-content { margin-left: 72px; padding: 1.5rem; }
    }
    @media (max-width: 768px) {
      .main-content { margin-left: 0; padding: 1rem; padding-bottom: 80px; }
      .cards-grid { grid-template-columns: 1fr; }
      .greeting h1 { font-size: 1.375rem; }
    }
    @media (max-width: 480px) {
      .main-content { padding: 0.75rem; padding-bottom: 80px; }
      .greeting-icon { font-size: 1.75rem; }
    }
  `
})
export class MisReservasComponent {
  protected readonly auth    = inject(AuthStore);
  private  readonly svc      = inject(ReservationService);
  private  readonly confirm  = inject(ConfirmDialogService);

  readonly filtroActivo = signal<FiltroMisReservas>('todas');

  // Detail modal
  readonly detailAbierto    = signal(false);
  readonly reservaIdDetalle = signal<number | null>(null);

  // Cancelar modal
  readonly cancelarAbierto  = signal(false);
  readonly reservaACancelar = signal<Reserva | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────

  readonly misReservas = computed(() => {
    const uid = this.auth.user()?.usuarioId;
    // Fase 5: replace with ApiClient call filtered by logged-in user
    return uid != null ? this.svc.findByUsuario(uid) : [];
  });

  readonly activasCount = computed(() =>
    this.misReservas().filter(r =>
      r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA' || r.estado === 'CHECK_IN'
    ).length
  );

  private readonly hoy = new Date().toISOString().slice(0, 10);

  readonly todayCheckIns  = computed(() => this.misReservas().filter(r => r.fechaInicio === this.hoy).length);
  readonly todayCheckOuts = computed(() => this.misReservas().filter(r => r.fechaFin === this.hoy && r.estado === 'CHECK_IN').length);

  readonly reservasFiltradas = computed(() => {
    const filtro = this.filtroActivo();
    const lista  = this.misReservas();
    if (filtro === 'todas')   return lista;
    if (filtro === 'activas') return lista.filter(r => r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA' || r.estado === 'CHECK_IN');
    return lista.filter(r => r.estado === filtro);
  });

  readonly filtros: Array<{ value: FiltroMisReservas; label: string; count: () => number }> = [
    { value: 'todas',      label: 'Todas',      count: () => this.misReservas().length },
    { value: 'activas',    label: 'Activas',    count: () => this.activasCount() },
    { value: 'PENDIENTE',  label: 'Pendiente',  count: () => this.misReservas().filter(r => r.estado === 'PENDIENTE').length },
    { value: 'CONFIRMADA', label: 'Confirmada', count: () => this.misReservas().filter(r => r.estado === 'CONFIRMADA').length },
    { value: 'CHECK_IN',   label: 'Check-in',   count: () => this.misReservas().filter(r => r.estado === 'CHECK_IN').length },
    { value: 'CANCELADA',  label: 'Cancelada',  count: () => this.misReservas().filter(r => r.estado === 'CANCELADA').length },
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────

  huespedPrincipal(r: Reserva): string {
    return r.huespedes.find(h => h.esPrincipal)?.nombreCompleto
        ?? r.huespedes[0]?.nombreCompleto
        ?? '—';
  }

  huespedDoc(r: Reserva): string {
    return r.huespedes.find(h => h.esPrincipal)?.numeroDocumento
        ?? r.huespedes[0]?.numeroDocumento
        ?? '';
  }

  calcNoches(r: Reserva): number {
    const ms = new Date(r.fechaFin).getTime() - new Date(r.fechaInicio).getTime();
    return Math.max(0, Math.round(ms / 86_400_000));
  }

  formatFecha(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  esHoy(fecha: string): boolean {
    return fecha === this.hoy;
  }

  puedeCancelar(estado: EstadoReserva): boolean {
    return estado !== 'CANCELADA' && estado !== 'CHECK_OUT' && estado !== 'NO_SHOW';
  }

  estadoLabel(estado: EstadoReserva): string {
    const labels: Record<EstadoReserva, string> = {
      PENDIENTE: 'Pendiente', CONFIRMADA: 'Confirmada',
      CHECK_IN:  'Check-in',  CHECK_OUT:  'Check-out',
      CANCELADA: 'Cancelada', NO_SHOW:    'No show',
    };
    return labels[estado];
  }

  // ── Acciones ───────────────────────────────────────────────────────────────

  abrirDetalle(id: number): void {
    this.reservaIdDetalle.set(id);
    this.detailAbierto.set(true);
  }

  iniciarCancelacion(r: Reserva): void {
    this.reservaACancelar.set(r);
    this.cancelarAbierto.set(true);
  }

  iniciarCancelacionById(id: number): void {
    this.detailAbierto.set(false);
    const r = this.svc.findById(id);
    if (r) this.iniciarCancelacion(r);
  }

  confirmarCancelacion(payload: CancelarReservaPayload): void {
    const r = this.reservaACancelar();
    if (!r) return;
    this.svc.cancelar(r.reservaId, payload).subscribe(() => {
      this.cancelarAbierto.set(false);
      this.reservaACancelar.set(null);
    });
  }

  async handleCheckIn(id: number): Promise<void> {
    const r = this.svc.findById(id);
    const nombre = r ? this.huespedPrincipal(r) : '';
    const ok = await this.confirm.ask({
      title:       'Confirmar Check-in',
      message:     `¿Registrar el ingreso de ${nombre}?`,
      confirmText: 'Sí, Check-in',
      cancelText:  'Cancelar',
    });
    if (ok) {
      this.svc.cambiarEstado(id, { nuevoEstado: 'CHECK_IN' }).subscribe();
      this.detailAbierto.set(false);
    }
  }

  async handleCheckOut(id: number): Promise<void> {
    const r = this.svc.findById(id);
    const nombre = r ? this.huespedPrincipal(r) : '';
    const ok = await this.confirm.ask({
      title:       'Confirmar Check-out',
      message:     `¿Registrar la salida de ${nombre}?`,
      confirmText: 'Sí, Check-out',
      cancelText:  'Cancelar',
    });
    if (ok) {
      this.svc.cambiarEstado(id, { nuevoEstado: 'CHECK_OUT' }).subscribe();
      this.detailAbierto.set(false);
    }
  }
}
