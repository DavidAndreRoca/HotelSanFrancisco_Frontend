import { Component, input, output, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, of, distinctUntilChanged } from 'rxjs';
import { ReservationService } from '../../services/reservation.service';
import { EstadoReserva, HistorialReserva } from '../../models/reservation.model';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'isOpen() && onClose.emit()',
    role: 'dialog',
    'aria-modal': 'true',
  },
  template: `
    @if (isOpen() && reserva()) {
      <div class="modal-overlay" (click)="onClose.emit()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="onClose.emit()" aria-label="Cerrar">✕</button>

          <!-- Header -->
          <div class="modal-header">
            <div class="header-info">
              <span class="cod-text">{{ reserva()!.codReserva }}</span>
              <span [className]="'estado-badge ' + estadoClass(reserva()!.estado)">
                {{ estadoLabel(reserva()!.estado) }}
              </span>
            </div>
            <div class="header-actions">
              @if (puedeCheckIn()) {
                <button class="action-chip chip-checkin" (click)="onCheckIn.emit(reserva()!.reservaId)">
                  🏨 Check-in
                </button>
              }
              @if (puedeCheckOut()) {
                <button class="action-chip chip-checkout" (click)="onCheckOut.emit(reserva()!.reservaId)">
                  🚪 Check-out
                </button>
              }
              @if (puedeCancelar()) {
                <button class="action-chip chip-cancelar" (click)="onCancelar.emit(reserva()!.reservaId)">
                  ❌ Cancelar
                </button>
              }
              <button class="action-chip chip-editar" (click)="onEditar.emit(reserva()!.reservaId)">
                ✏️ Editar
              </button>
            </div>
          </div>

          <div class="modal-body">
            <!-- Info general -->
            <div class="section">
              <div class="section-title">Información general</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Check-in</span>
                  <span class="info-value date">{{ formatFecha(reserva()!.fechaInicio) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Check-out</span>
                  <span class="info-value date">{{ formatFecha(reserva()!.fechaFin) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Adultos / Niños</span>
                  <span class="info-value">{{ reserva()!.nroAdultos }} / {{ reserva()!.nroNinos }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Canal</span>
                  <span class="info-value">{{ reserva()!.canalNombre ?? 'Sin canal' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Registrado por</span>
                  <span class="info-value">{{ reserva()!.usuarioNombre }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Creado</span>
                  <span class="info-value small">{{ reserva()!.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
              @if (reserva()!.observaciones) {
                <div class="observaciones">
                  <span class="info-label">Observaciones</span>
                  <p>{{ reserva()!.observaciones }}</p>
                </div>
              }
            </div>

            <!-- Habitaciones -->
            <div class="section">
              <div class="section-title">Habitaciones</div>
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>N°</th><th>Tipo</th><th>Tarifa/noche</th><th>Noches</th><th>Subtotal</th><th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (hab of reserva()!.habitaciones; track hab.reservaHabitacionId) {
                    <tr>
                      <td><strong>{{ hab.habitacionNumero }}</strong></td>
                      <td>{{ hab.tipoHabitacionNombre }}</td>
                      <td>S/ {{ hab.tarifaPactada | number:'1.2-2' }}</td>
                      <td>{{ hab.noches }}</td>
                      <td>S/ {{ hab.subtotal | number:'1.2-2' }}</td>
                      <td>
                        <span [className]="'mini-badge hab-' + hab.estado">{{ hab.estado }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Huéspedes -->
            <div class="section">
              <div class="section-title">Huéspedes</div>
              <div class="huesped-list">
                @for (h of reserva()!.huespedes; track h.huespedId) {
                  <div class="huesped-card" [class.principal]="h.esPrincipal">
                    <div class="huesped-avatar">{{ h.nombreCompleto[0] }}</div>
                    <div class="huesped-info">
                      <span class="huesped-nombre">
                        {{ h.nombreCompleto }}
                        @if (h.esPrincipal) { <span class="tag-principal">Principal</span> }
                      </span>
                      <span class="huesped-doc">{{ h.numeroDocumento }}</span>
                      @if (h.correo) { <span class="huesped-extra">{{ h.correo }}</span> }
                      @if (h.telefono) { <span class="huesped-extra">{{ h.telefono }}</span> }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Montos -->
            <div class="section">
              <div class="section-title">Resumen económico</div>
              <div class="montos-grid">
                <div class="monto-row">
                  <span>Subtotal</span>
                  <span>S/ {{ reserva()!.subtotal | number:'1.2-2' }}</span>
                </div>
                <div class="monto-row">
                  <span>Descuento</span>
                  <span class="negativo">- S/ {{ reserva()!.descuento | number:'1.2-2' }}</span>
                </div>
                <div class="monto-row">
                  <span>Impuesto</span>
                  <span>S/ {{ reserva()!.impuesto | number:'1.2-2' }}</span>
                </div>
                <div class="monto-row total">
                  <span>Total</span>
                  <span>S/ {{ reserva()!.montoTotal | number:'1.2-2' }}</span>
                </div>
                <div class="monto-row">
                  <span>Adelanto pagado</span>
                  <span class="positivo">S/ {{ reserva()!.adelanto | number:'1.2-2' }}</span>
                </div>
                <div class="monto-row saldo">
                  <span>Saldo pendiente</span>
                  <span>S/ {{ (reserva()!.montoTotal - reserva()!.adelanto) | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <!-- Historial -->
            @if (historial().length > 0) {
              <div class="section">
                <div class="section-title">Historial de cambios</div>
                <div class="timeline">
                  @for (h of historial(); track h.historialId) {
                    <div class="timeline-item">
                      <div class="timeline-dot"></div>
                      <div class="timeline-content">
                        <div class="timeline-estados">
                          <span [className]="'mini-badge estado-' + h.estadoAnterior">{{ estadoLabel(h.estadoAnterior) }}</span>
                          <span class="timeline-arrow">→</span>
                          <span [className]="'mini-badge estado-' + h.estadoNuevo">{{ estadoLabel(h.estadoNuevo) }}</span>
                        </div>
                        @if (h.motivo) {
                          <p class="timeline-motivo">{{ h.motivo }}</p>
                        }
                        <span class="timeline-fecha">{{ h.fechaCambio | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');
    * { font-family: 'Inter', sans-serif; }

    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(45,41,38,0.75);
      display: flex; align-items: center; justify-content: center;
      z-index: 1100; animation: overlayIn 0.2s ease;
    }
    @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-content {
      background: #F9F5F0; border-radius: 1rem;
      max-width: 800px; width: 95%; max-height: 92vh; overflow-y: auto;
      position: relative;
      animation: slideIn 0.25s ease;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
    }
    @keyframes slideIn {
      from { transform: translateY(-30px); opacity: 0; }
      to   { transform: translateY(0); opacity: 1; }
    }

    .modal-close {
      position: absolute; top: 1rem; right: 1rem;
      background: white; border: 1px solid #EEE3D1;
      font-size: 1.125rem; cursor: pointer; color: #8E6F2E;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%; transition: all 0.2s; z-index: 10;
    }
    .modal-close:hover { background: #C5A048; border-color: #C5A048; color: white; }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 2px solid #C5A048;
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 0.75rem;
      background: white; border-radius: 1rem 1rem 0 0;
    }

    .header-info { display: flex; align-items: center; gap: 0.75rem; }

    .cod-text {
      font-family: monospace; font-size: 1rem; font-weight: 700; color: #2D2926;
    }

    .estado-badge {
      display: inline-block; padding: 0.25rem 0.75rem;
      border-radius: 2rem; font-size: 0.7rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .estado-CONFIRMADA  { background: #E8F5E9; color: #2E7D32; }
    .estado-CHECK_IN    { background: #FFF8E1; color: #C5A048; }
    .estado-CHECK_OUT   { background: #F5F5F5; color: #6B7280; }
    .estado-CANCELADA   { background: #FFEBEE; color: #C62828; }
    .estado-PENDIENTE   { background: #FFF3E0; color: #E6A017; }
    .estado-NO_SHOW     { background: #F3E5F5; color: #6A1B9A; }

    .header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    .action-chip {
      padding: 0.375rem 0.875rem; border-radius: 2rem;
      font-size: 0.8rem; font-weight: 600; cursor: pointer;
      border: none; transition: all 0.2s; display: flex; align-items: center; gap: 0.375rem;
    }
    .chip-checkin  { background: #E8F5E9; color: #2E7D32; }
    .chip-checkin:hover  { background: #2E7D32; color: white; }
    .chip-checkout { background: #E0E7FF; color: #4338CA; }
    .chip-checkout:hover { background: #4338CA; color: white; }
    .chip-cancelar { background: #FFEBEE; color: #C62828; }
    .chip-cancelar:hover { background: #C62828; color: white; }
    .chip-editar   { background: #FFF8E1; color: #C5A048; }
    .chip-editar:hover   { background: #C5A048; color: white; }

    .modal-body { padding: 1.5rem; }

    .section { margin-bottom: 1.75rem; }

    .section-title {
      font-size: 0.7rem; font-weight: 700; color: #C5A048;
      text-transform: uppercase; letter-spacing: 1px;
      padding-bottom: 0.5rem; margin-bottom: 1rem;
      border-bottom: 1px solid #EEE3D1;
    }

    .info-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
    }

    .info-item { display: flex; flex-direction: column; gap: 0.25rem; }

    .info-label {
      font-size: 0.7rem; font-weight: 600; color: #8E6F2E;
      text-transform: uppercase; letter-spacing: 0.5px;
    }

    .info-value { font-size: 0.9rem; font-weight: 500; color: #2D2926; }
    .info-value.date { font-weight: 700; color: #C5A048; }
    .info-value.small { font-size: 0.8rem; }

    .observaciones {
      margin-top: 1rem;
      padding: 0.75rem; background: white;
      border-radius: 0.5rem; border: 1px solid #EEE3D1;
    }
    .observaciones p { margin: 0.375rem 0 0; font-size: 0.875rem; color: #2D2926; }

    .mini-table { width: 100%; border-collapse: collapse; }
    .mini-table th {
      text-align: left; padding: 0.625rem 0.75rem;
      font-size: 0.7rem; font-weight: 600; color: #8E6F2E;
      background: white; border-bottom: 1px solid #EEE3D1;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .mini-table td {
      padding: 0.625rem 0.75rem;
      font-size: 0.8375rem; color: #2D2926;
      border-bottom: 1px solid #EEE3D1;
      background: white;
    }

    .mini-badge {
      display: inline-block; padding: 0.125rem 0.5rem;
      border-radius: 0.25rem; font-size: 0.65rem; font-weight: 600;
      text-transform: uppercase;
    }
    .hab-ACTIVA    { background: #E8F5E9; color: #2E7D32; }
    .hab-CANCELADA { background: #FFEBEE; color: #C62828; }
    .hab-CHECK_OUT { background: #F5F5F5; color: #6B7280; }

    .huesped-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .huesped-card {
      display: flex; align-items: center; gap: 0.875rem;
      padding: 0.875rem; background: white;
      border-radius: 0.625rem; border: 1px solid #EEE3D1;
    }
    .huesped-card.principal { border-color: #C5A048; border-width: 1.5px; }

    .huesped-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: #C5A048; color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; font-weight: 700; flex-shrink: 0;
    }

    .huesped-info { display: flex; flex-direction: column; gap: 0.2rem; }

    .huesped-nombre {
      font-size: 0.875rem; font-weight: 600; color: #2D2926;
      display: flex; align-items: center; gap: 0.5rem;
    }

    .tag-principal {
      background: #FFF8E1; color: #C5A048;
      font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.4rem;
      border-radius: 2rem; border: 1px solid #FDE68A;
    }

    .huesped-doc { font-size: 0.75rem; color: #8E6F2E; }
    .huesped-extra { font-size: 0.75rem; color: #6B7280; }

    .montos-grid {
      background: white; border-radius: 0.625rem;
      border: 1px solid #EEE3D1; overflow: hidden;
    }

    .monto-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.625rem 1rem;
      font-size: 0.875rem; color: #2D2926;
      border-bottom: 1px solid #F9F5F0;
    }
    .monto-row:last-child { border-bottom: none; }
    .monto-row.total {
      font-weight: 700; font-size: 1rem;
      background: #F9F5F0; border-top: 2px solid #EEE3D1;
    }
    .monto-row.saldo { color: #C5A048; font-weight: 600; }
    .negativo { color: #2E7D32; }
    .positivo { color: #2E7D32; }

    .timeline { display: flex; flex-direction: column; gap: 0; }

    .timeline-item {
      display: flex; gap: 1rem;
      padding-bottom: 1.25rem; position: relative;
    }
    .timeline-item:last-child { padding-bottom: 0; }

    .timeline-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: #C5A048; flex-shrink: 0; margin-top: 0.35rem;
      position: relative; z-index: 1;
    }
    .timeline-item:not(:last-child) .timeline-dot::after {
      content: ''; position: absolute;
      top: 10px; left: 50%; transform: translateX(-50%);
      width: 2px; height: calc(100% + 1rem);
      background: #EEE3D1;
    }

    .timeline-content { flex: 1; }
    .timeline-estados { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .timeline-arrow { color: #8E6F2E; font-size: 0.875rem; }
    .timeline-motivo { margin: 0.375rem 0 0; font-size: 0.8125rem; color: #6B7280; font-style: italic; }
    .timeline-fecha { display: block; font-size: 0.7rem; color: #8E6F2E; margin-top: 0.25rem; }

    .modal-content::-webkit-scrollbar { width: 6px; }
    .modal-content::-webkit-scrollbar-track { background: #EEE3D1; }
    .modal-content::-webkit-scrollbar-thumb { background: #C5A048; border-radius: 3px; }

    @media (max-width: 640px) {
      .info-grid { grid-template-columns: repeat(2, 1fr); }
      .header-actions { width: 100%; }
      .modal-body { padding: 1rem; }
    }
  `
})
export class ReservationDetailComponent {
  private readonly svc = inject(ReservationService);

  isOpen    = input.required<boolean>();
  reservaId = input<number | null>(null);

  onClose   = output<void>();
  onEditar  = output<number>();
  onCheckIn  = output<number>();
  onCheckOut = output<number>();
  onCancelar = output<number>();

  readonly reserva = computed(() => {
    const id = this.reservaId();
    return id != null ? this.svc.findById(id) ?? null : null;
  });

  readonly historial = toSignal(
    toObservable(computed(() => (this.isOpen() ? this.reservaId() : null))).pipe(
      distinctUntilChanged(),
      switchMap(id => id != null ? this.svc.obtenerHistorial(id) : of([] as HistorialReserva[])),
    ),
    { initialValue: [] as HistorialReserva[] }
  );

  puedeCheckIn(): boolean {
    const e = this.reserva()?.estado;
    return e === 'CONFIRMADA' || e === 'PENDIENTE';
  }

  puedeCheckOut(): boolean {
    return this.reserva()?.estado === 'CHECK_IN';
  }

  puedeCancelar(): boolean {
    const e = this.reserva()?.estado;
    return e !== 'CANCELADA' && e !== 'CHECK_OUT' && e !== 'NO_SHOW';
  }

  formatFecha(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  estadoClass(estado: EstadoReserva): string {
    return `estado-${estado}`;
  }

  estadoLabel(estado: EstadoReserva): string {
    const labels: Record<EstadoReserva, string> = {
      PENDIENTE: 'Pendiente', CONFIRMADA: 'Confirmada',
      CHECK_IN: 'Check-in',  CHECK_OUT: 'Check-out',
      CANCELADA: 'Cancelada', NO_SHOW: 'No show',
    };
    return labels[estado];
  }
}
