import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Reserva, EstadoReserva } from '../../models/reservation.model';

@Component({
  selector: 'app-reservation-table',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-container">
      <table class="reservation-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Huésped principal</th>
            <th>Habitación</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Estado</th>
            <th>Monto total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (reserva of reservas(); track reserva.reservaId) {
            <tr>
              <td>
                <span class="cod-reserva">{{ reserva.codReserva }}</span>
              </td>
              <td class="guest-cell">
                <div class="guest-name">{{ huesped(reserva).nombreCompleto }}</div>
                <div class="guest-doc">{{ huesped(reserva).numeroDocumento }}</div>
              </td>
              <td>
                <div class="room-info">
                  <span class="room-number">{{ habitacion(reserva).habitacionNumero }}</span>
                  <span class="room-type">{{ habitacion(reserva).tipoHabitacionNombre }}</span>
                </div>
              </td>
              <td>{{ formatFecha(reserva.fechaInicio) }}</td>
              <td>{{ formatFecha(reserva.fechaFin) }}</td>
              <td>
                <span [className]="getEstadoClass(reserva.estado)">
                  {{ getEstadoLabel(reserva.estado) }}
                </span>
              </td>
              <td>
                <div class="amount-info">
                  <span class="total-amount">S/ {{ reserva.montoTotal | number:'1.2-2' }}</span>
                  @if (reserva.adelanto > 0) {
                    <span class="adelanto-amount">Adelanto: S/ {{ reserva.adelanto | number:'1.2-2' }}</span>
                  }
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    class="action-btn view-btn"
                    (click)="onVerReserva.emit(reserva.reservaId)"
                    title="Ver detalles">
                    👁️
                  </button>
                  <button
                    class="action-btn edit-btn"
                    (click)="onEditarReserva.emit(reserva.reservaId)"
                    title="Editar reserva">
                    ✏️
                  </button>
                  @if (reserva.estado === 'CONFIRMADA' || reserva.estado === 'PENDIENTE') {
                    <button
                      class="action-btn checkin-btn"
                      (click)="onCheckIn.emit(reserva.reservaId)"
                      title="Realizar check-in">
                      🏨
                    </button>
                  }
                  @if (reserva.estado === 'CHECK_IN') {
                    <button
                      class="action-btn checkout-btn"
                      (click)="onCheckOut.emit(reserva.reservaId)"
                      title="Realizar check-out">
                      🚪
                    </button>
                  }
                  @if (reserva.estado !== 'CANCELADA' && reserva.estado !== 'CHECK_OUT') {
                    <button
                      class="action-btn cancel-btn"
                      (click)="onCancelarReserva.emit(reserva.reservaId)"
                      title="Cancelar reserva">
                      ❌
                    </button>
                  }
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="8" class="empty-table">No se encontraron reservas</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');

    * { font-family: 'Inter', sans-serif; }

    .table-container {
      background: white;
      border-radius: 0.75rem;
      overflow-x: auto;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      border: 1px solid #EEE3D1;
    }

    .reservation-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 900px;
    }

    .reservation-table th {
      text-align: left;
      padding: 0.875rem 1rem;
      background: #F9F5F0;
      font-weight: 600;
      font-size: 0.75rem;
      color: #8E6F2E;
      border-bottom: 1px solid #EEE3D1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .reservation-table td {
      padding: 1rem;
      border-bottom: 1px solid #EEE3D1;
      vertical-align: middle;
      font-size: 0.875rem;
      color: #2D2926;
    }

    .reservation-table tr { transition: background 0.2s ease; }
    .reservation-table tr:hover { background: #F9F5F0; }

    .cod-reserva {
      font-family: monospace;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #8E6F2E;
    }

    .guest-cell { min-width: 180px; }

    .guest-name {
      font-weight: 600;
      color: #2D2926;
      font-size: 0.875rem;
    }

    .guest-doc {
      font-size: 0.7rem;
      color: #8E6F2E;
      margin-top: 0.125rem;
    }

    .room-info { display: flex; flex-direction: column; }

    .room-number {
      font-weight: 700;
      color: #C5A048;
      font-size: 0.875rem;
    }

    .room-type {
      font-size: 0.7rem;
      color: #8E6F2E;
      margin-top: 0.125rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 0.375rem;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .estado-CONFIRMADA  { background: #E8F5E9; color: #2E7D32; }
    .estado-CHECK_IN    { background: #FFF8E1; color: #C5A048; }
    .estado-CHECK_OUT   { background: #F5F5F5; color: #6B7280; }
    .estado-CANCELADA   { background: #FFEBEE; color: #C62828; }
    .estado-PENDIENTE   { background: #FFF3E0; color: #E6A017; }
    .estado-NO_SHOW     { background: #F3E5F5; color: #6A1B9A; }

    .amount-info { display: flex; flex-direction: column; }

    .total-amount {
      font-weight: 700;
      color: #2D2926;
      font-size: 0.875rem;
    }

    .adelanto-amount {
      font-size: 0.7rem;
      color: #2E7D32;
      margin-top: 0.125rem;
    }

    .action-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    .action-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.375rem;
      transition: all 0.2s ease;
      border-radius: 0.375rem;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-btn:hover { transform: scale(1.05); }
    .view-btn:hover     { background: #E3F2FD; }
    .edit-btn:hover     { background: #FFF8E1; }
    .checkin-btn:hover  { background: #E8F5E9; }
    .checkout-btn:hover { background: #E0E7FF; }
    .cancel-btn:hover   { background: #FFEBEE; }

    .empty-table {
      text-align: center;
      padding: 3rem !important;
      color: #8E6F2E;
    }

    @media (max-width: 768px) {
      .reservation-table th,
      .reservation-table td { padding: 0.75rem; }
      .action-buttons { flex-direction: column; gap: 0.25rem; }
      .action-btn { width: 32px; height: 32px; }
    }
  `
})
export class ReservationTableComponent {
  reservas = input.required<Reserva[]>();

  onVerReserva      = output<number>();
  onEditarReserva   = output<number>();
  onCheckIn         = output<number>();
  onCheckOut        = output<number>();
  onCancelarReserva = output<number>();

  huesped(reserva: Reserva) {
    return reserva.huespedes.find(h => h.esPrincipal) ?? reserva.huespedes[0] ?? {
      nombreCompleto: '—', numeroDocumento: '—', correo: null, telefono: null, esPrincipal: true, huespedId: 0
    };
  }

  habitacion(reserva: Reserva) {
    return reserva.habitaciones[0] ?? {
      habitacionNumero: '—', tipoHabitacionNombre: '—'
    };
  }

  formatFecha(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  getEstadoClass(estado: EstadoReserva): string {
    return `status-badge estado-${estado}`;
  }

  getEstadoLabel(estado: EstadoReserva): string {
    const labels: Record<EstadoReserva, string> = {
      PENDIENTE:  'Pendiente',
      CONFIRMADA: 'Confirmada',
      CHECK_IN:   'Check-in',
      CHECK_OUT:  'Check-out',
      CANCELADA:  'Cancelada',
      NO_SHOW:    'No show',
    };
    return labels[estado];
  }
}
