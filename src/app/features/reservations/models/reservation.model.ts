// features/reservations/models/reservation.model.ts
export type ReservationStatus = 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'pending';
export type PaymentStatus = 'paid' | 'pending' | 'partial';

export interface Reservation {
  id: number;
  roomNumber: string;
  roomType: string;
  guestName: string;
  guestDocument: string;
  guestPhone: string;
  checkIn: Date;
  checkOut: Date;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  paidAmount: number;
  adults: number;
  children: number;
  specialRequests?: string;
}

export interface ReservationStats {
  total: number;
  confirmed: number;
  checkedIn: number;
  checkedOut: number;
  cancelled: number;
  pending: number;
  todayCheckIns: number;
  todayCheckOuts: number;
}