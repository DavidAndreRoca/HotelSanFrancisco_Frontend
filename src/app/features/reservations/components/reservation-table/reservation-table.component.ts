// features/reservations/components/reservation-table/reservation-table.component.ts
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Reservation, ReservationStatus } from '../../models/reservation.model';

@Component({
  selector: 'app-reservation-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-container">
      <table class="reservation-table">
        <thead>
          <tr>
            <th>Huésped</th>
            <th>Documento</th>
            <th>Habitación</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Estado</th>
            <th>Monto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (reservation of reservations(); track reservation.id) {
            <tr>
              <td class="guest-cell">
                <div class="guest-name">{{ reservation.guestName }}</div>
                <div class="guest-phone">{{ reservation.guestPhone }}</div>
              </td>
              <td>{{ reservation.guestDocument }}</td>
              <td>
                <div class="room-info">
                  <span class="room-number">{{ reservation.roomNumber }}</span>
                  <span class="room-type">{{ reservation.roomType }}</span>
                </div>
              </td>
              <td>{{ formatDate(reservation.checkIn) }}</td>
              <td>{{ formatDate(reservation.checkOut) }}</td>
              <td>
                <span class="status-badge" [class]="getStatusClass(reservation.status)">
                  {{ getStatusLabel(reservation.status) }}
                </span>
                <span class="payment-badge" [class]="getPaymentClass(reservation.paymentStatus)">
                  {{ getPaymentLabel(reservation.paymentStatus) }}
                </span>
              </td>
              <td>
                <div class="amount-info">
                  <span class="total-amount">S/ {{ reservation.totalAmount }}</span>
                  @if (reservation.paidAmount > 0 && reservation.paidAmount < reservation.totalAmount) {
                    <span class="paid-amount">Pagado: S/ {{ reservation.paidAmount }}</span>
                  }
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    class="action-btn view-btn"
                    (click)="onViewReservation.emit(reservation.id)"
                    title="Ver detalles">
                    👁️
                  </button>
                  <button 
                    class="action-btn edit-btn"
                    (click)="onEditReservation.emit(reservation.id)"
                    title="Editar reserva">
                    ✏️
                  </button>
                  @if (reservation.status === 'confirmed') {
                    <button 
                      class="action-btn checkin-btn"
                      (click)="onCheckIn.emit(reservation.id)"
                      title="Realizar check-in">
                      🏨
                    </button>
                  }
                  @if (reservation.status === 'checked-in') {
                    <button 
                      class="action-btn checkout-btn"
                      (click)="onCheckOut.emit(reservation.id)"
                      title="Realizar check-out">
                      🚪
                    </button>
                  }
                  <button 
                    class="action-btn cancel-btn"
                    (click)="onCancelReservation.emit(reservation.id)"
                    title="Cancelar reserva">
                    ❌
                  </button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="8" class="empty-table">
                No se encontraron reservas
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    /* Importar fuente Inter */
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');

    * {
      font-family: 'Inter', sans-serif;
    }

    .table-container {
      background: white;
      border-radius: 0.75rem;
      overflow-x: auto;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      border: 1px solid #EEE3D1; /* Details: Crema Suave */
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: #F9F5F0;
      border-bottom: 2px solid #C5A048; /* Primary: Dorado Principal */
    }

    .table-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .title-icon {
      font-size: 1.25rem;
    }

    .table-title h3 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #2D2926;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .table-info {
      font-size: 0.75rem;
      color: #8E6F2E;
      font-weight: 500;
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

    .reservation-table tr {
      transition: background 0.2s ease;
    }

    .reservation-table tr:hover {
      background: #F9F5F0;
    }

    /* Estilo para filas según estado */
    .reservation-table tr.row-confirmed:hover {
      background: #FFFDF5;
    }

    .reservation-table tr.row-checked-in:hover {
      background: #FEF9E7;
    }

    .reservation-table tr.row-checked-out:hover {
      background: #F5F3F0;
    }

    .guest-cell {
      min-width: 180px;
    }

    .guest-name {
      font-weight: 600;
      color: #2D2926;
      font-size: 0.875rem;
    }

    .guest-phone {
      font-size: 0.7rem;
      color: #8E6F2E;
      margin-top: 0.25rem;
    }

    .document-cell {
      font-family: monospace;
      font-size: 0.8125rem;
      color: #6B7280;
    }

    .room-info {
      display: flex;
      flex-direction: column;
    }

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

    .badges-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .status-badge, .payment-badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 0.375rem;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* Estados de reserva */
    .status-confirmed {
      background: #E8F5E9;
      color: #2E7D32;
    }

    .status-checked-in {
      background: #FFF8E1;
      color: #C5A048;
    }

    .status-checked-out {
      background: #F5F5F5;
      color: #6B7280;
    }

    .status-cancelled {
      background: #FFEBEE;
      color: #C62828;
    }

    .status-pending {
      background: #FFF3E0;
      color: #E6A017;
    }

    /* Estados de pago */
    .payment-paid {
      background: #E8F5E9;
      color: #2E7D32;
    }

    .payment-pending {
      background: #FFF3E0;
      color: #E6A017;
    }

    .payment-partial {
      background: #FFF8E1;
      color: #C5A048;
    }

    .amount-info {
      display: flex;
      flex-direction: column;
    }

    .total-amount {
      font-weight: 700;
      color: #2D2926;
      font-size: 0.875rem;
    }

    .paid-amount {
      font-size: 0.7rem;
      color: #2E7D32;
      margin-top: 0.125rem;
    }

    .paid-full {
      color: #059669;
      font-weight: 500;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

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

    .action-btn:hover {
      transform: scale(1.05);
    }

    .view-btn:hover { 
      background: #E3F2FD; 
      color: #1565C0;
    }
    .edit-btn:hover { 
      background: #FFF8E1; 
      color: #C5A048;
    }
    .checkin-btn:hover { 
      background: #E8F5E9; 
      color: #2E7D32;
    }
    .checkout-btn:hover { 
      background: #E0E7FF; 
      color: #4338CA;
    }
    .cancel-btn:hover { 
      background: #FFEBEE; 
      color: #C62828;
    }

    /* Estado vacío */
    .empty-table {
      text-align: center;
      padding: 3rem !important;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .empty-icon {
      font-size: 3rem;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      color: #2D2926;
      font-weight: 500;
    }

    .empty-hint {
      font-size: 0.75rem;
      color: #8E6F2E;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .table-header {
        padding: 0.75rem 1rem;
      }

      .reservation-table th,
      .reservation-table td {
        padding: 0.75rem;
      }

      .action-buttons {
        flex-direction: column;
        gap: 0.25rem;
      }

      .action-btn {
        width: 32px;
        height: 32px;
      }
    }
  `
})
export class ReservationTableComponent {
  reservations = input.required<Reservation[]>();
  onViewReservation = output<number>();
  onEditReservation = output<number>();
  onCheckIn = output<number>();
  onCheckOut = output<number>();
  onCancelReservation = output<number>();

  formatDate(date: Date): string {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  getStatusClass(status: ReservationStatus): string {
    return `status-${status}`;
  }

  getStatusLabel(status: ReservationStatus): string {
    const labels = {
      'confirmed': 'Confirmada',
      'checked-in': 'Check-in',
      'checked-out': 'Check-out',
      'cancelled': 'Cancelada',
      'pending': 'Pendiente'
    };
    return labels[status];
  }

  getPaymentClass(paymentStatus: string): string {
    return `payment-${paymentStatus}`;
  }

  getPaymentLabel(paymentStatus: string): string {
    const labels = {
      'paid': 'Pagado',
      'pending': 'Pendiente',
      'partial': 'Parcial'
    };
    return labels[paymentStatus as keyof typeof labels];
  }
}