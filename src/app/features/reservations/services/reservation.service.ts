// features/reservations/services/reservation.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { Reservation, ReservationStatus, ReservationStats } from '../models/reservation.model';
import { PaymentStatus } from '../models/reservation.model';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private reservations = signal<Reservation[]>([
    {
      id: 1,
      roomNumber: '101',
      roomType: 'Simple',
      guestName: 'María Estela García Pérez',
      guestDocument: '45678901',
      guestPhone: '956123456',
      checkIn: new Date(2026, 3, 1),
      checkOut: new Date(2026, 3, 5),
      status: 'checked-in',
      paymentStatus: 'paid',
      totalAmount: 480,
      paidAmount: 480,
      adults: 2,
      children: 1
    },
    {
      id: 2,
      roomNumber: '102',
      roomType: 'Simple',
      guestName: 'María Estela García Pérez',
      guestDocument: '45678901',
      guestPhone: '956123456',
      checkIn: new Date(2026, 3, 2),
      checkOut: new Date(2026, 3, 6),
      status: 'confirmed',
      paymentStatus: 'pending',
      totalAmount: 480,
      paidAmount: 0,
      adults: 2,
      children: 0
    },
    {
      id: 3,
      roomNumber: '103',
      roomType: 'Doble',
      guestName: 'Carlos López Mendoza',
      guestDocument: '78912345',
      guestPhone: '987654321',
      checkIn: new Date(2026, 3, 3),
      checkOut: new Date(2026, 3, 7),
      status: 'confirmed',
      paymentStatus: 'partial',
      totalAmount: 720,
      paidAmount: 360,
      adults: 2,
      children: 2
    },
    {
      id: 4,
      roomNumber: '104',
      roomType: 'Suite',
      guestName: 'Ana María Rodríguez',
      guestDocument: '12345678',
      guestPhone: '912345678',
      checkIn: new Date(2026, 3, 1),
      checkOut: new Date(2026, 3, 3),
      status: 'checked-out',
      paymentStatus: 'paid',
      totalAmount: 500,
      paidAmount: 500,
      adults: 2,
      children: 0
    },
    {
      id: 5,
      roomNumber: '105',
      roomType: 'Simple',
      guestName: 'Pedro Ruiz Fernández',
      guestDocument: '56789012',
      guestPhone: '945678901',
      checkIn: new Date(2026, 3, 4),
      checkOut: new Date(2026, 3, 8),
      status: 'pending',
      paymentStatus: 'pending',
      totalAmount: 480,
      paidAmount: 0,
      adults: 1,
      children: 0
    },
    {
      id: 6,
      roomNumber: '106',
      roomType: 'Doble',
      guestName: 'Elena Vargas Soto',
      guestDocument: '90123456',
      guestPhone: '923456789',
      checkIn: new Date(2026, 3, 5),
      checkOut: new Date(2026, 3, 9),
      status: 'confirmed',
      paymentStatus: 'paid',
      totalAmount: 720,
      paidAmount: 720,
      adults: 2,
      children: 1
    },
    {
      id: 7,
      roomNumber: '107',
      roomType: 'Simple',
      guestName: 'Jose Villegas',
      guestDocument: '34567890',
      guestPhone: '934567890',
      checkIn: new Date(2026, 3, 10),
      checkOut: new Date(2026, 3, 12),
      status: 'confirmed',
      paymentStatus: 'pending',
      totalAmount: 240,
      paidAmount: 0,
      adults: 1,
      children: 0
    }
  ]);

  private searchTerm = signal<string>('');
  private statusFilter = signal<ReservationStatus | 'all'>('all');

  // Signals individuales para los contadores
  confirmedCount = computed(() => this.reservations().filter(r => r.status === 'confirmed').length);
  checkedInCount = computed(() => this.reservations().filter(r => r.status === 'checked-in').length);
  checkedOutCount = computed(() => this.reservations().filter(r => r.status === 'checked-out').length);
  pendingCount = computed(() => this.reservations().filter(r => r.status === 'pending').length);
  cancelledCount = computed(() => this.reservations().filter(r => r.status === 'cancelled').length);

  filteredReservations = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    let filtered = this.reservations();

    if (term) {
      filtered = filtered.filter(res =>
        res.guestName.toLowerCase().includes(term) ||
        res.guestDocument.includes(term) ||
        res.roomNumber.includes(term)
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter(res => res.status === status);
    }

    return filtered;
  });

  stats = computed<ReservationStats>(() => {
    const reservations = this.reservations();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: reservations.length,
      confirmed: reservations.filter(r => r.status === 'confirmed').length,
      checkedIn: reservations.filter(r => r.status === 'checked-in').length,
      checkedOut: reservations.filter(r => r.status === 'checked-out').length,
      cancelled: reservations.filter(r => r.status === 'cancelled').length,
      pending: reservations.filter(r => r.status === 'pending').length,
      todayCheckIns: reservations.filter(r => {
        const checkIn = new Date(r.checkIn);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn.getTime() === today.getTime();
      }).length,
      todayCheckOuts: reservations.filter(r => {
        const checkOut = new Date(r.checkOut);
        checkOut.setHours(0, 0, 0, 0);
        return checkOut.getTime() === today.getTime();
      }).length
    };
  });

  setSearchTerm(term: string) {
    this.searchTerm.set(term);
  }

  setStatusFilter(status: ReservationStatus | 'all') {
    this.statusFilter.set(status);
  }

  updateReservationStatus(id: number, status: ReservationStatus) {
    this.reservations.update(reservations =>
      reservations.map(res =>
        res.id === id ? { ...res, status } : res
      )
    );
  }

  updatePaymentStatus(id: number, paymentStatus: PaymentStatus, paidAmount?: number) {
    this.reservations.update(reservations =>
      reservations.map(res =>
        res.id === id 
          ? { ...res, paymentStatus, paidAmount: paidAmount ?? res.paidAmount }
          : res
      )
    );
  }
} 