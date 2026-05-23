// features/guests/services/guest.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { Guest, GuestStatus, GuestType, GuestStats } from '../models/guest.model';

@Injectable({ providedIn: 'root' })
export class GuestService {
  private guests = signal<Guest[]>([
    {
      id: 1,
      name: 'María Estela García Pérez',
      document: '45678901',
      phone: '956123456',
      email: 'maria.garcia@email.com',
      address: 'Av. Principal 123, Lima',
      status: 'checked-in',
      type: 'vip',
      totalStays: 5,
      lastVisit: new Date(2026, 3, 2),
      birthDate: new Date(1985, 5, 15),
      nationality: 'Peruana',
      preferences: ['Habitación tranquila', 'Desayuno vegetariano'],
      notes: 'Cliente frecuente, prefiere habitaciones con vista'
    },
    {
      id: 2,
      name: 'Carlos López Mendoza',
      document: '78912345',
      phone: '987654321',
      email: 'carlos.lopez@email.com',
      address: 'Calle Los Pinos 456, Lima',
      status: 'checked-out',
      type: 'regular',
      totalStays: 3,
      lastVisit: new Date(2026, 3, 1),
      birthDate: new Date(1990, 8, 20),
      nationality: 'Peruana',
      preferences: ['WiFi rápido'],
      notes: ''
    },
    {
      id: 3,
      name: 'Ana María Rodríguez',
      document: '12345678',
      phone: '912345678',
      email: 'ana.rodriguez@email.com',
      address: 'Jr. Las Flores 789, Lima',
      status: 'reserved',
      type: 'corporate',
      totalStays: 2,
      lastVisit: new Date(2026, 2, 28),
      birthDate: new Date(1988, 3, 10),
      nationality: 'Peruana',
      preferences: ['Estacionamiento', 'Habitación cerca del ascensor'],
      notes: 'Empresa: TechSolutions S.A.'
    },
    {
      id: 4,
      name: 'Pedro Ruiz Fernández',
      document: '56789012',
      phone: '945678901',
      email: 'pedro.ruiz@email.com',
      address: 'Av. Los Álamos 321, Lima',
      status: 'checked-in',
      type: 'regular',
      totalStays: 1,
      lastVisit: new Date(2026, 3, 2),
      birthDate: new Date(1995, 11, 5),
      nationality: 'Peruana',
      preferences: [],
      notes: 'Primera vez en el hotel'
    },
    {
      id: 5,
      name: 'Elena Vargas Soto',
      document: '90123456',
      phone: '923456789',
      email: 'elena.vargas@email.com',
      address: 'Calle Los Olivos 654, Lima',
      status: 'reserved',
      type: 'vip',
      totalStays: 8,
      lastVisit: new Date(2026, 2, 25),
      birthDate: new Date(1982, 7, 30),
      nationality: 'Peruana',
      preferences: ['Toallas extras', 'Agua sin gas'],
      notes: 'Cliente VIP, requiere atención preferencial'
    },
    {
      id: 6,
      name: 'Jose Villegas Torres',
      document: '34567890',
      phone: '934567890',
      email: 'jose.villegas@email.com',
      address: 'Av. Los Incas 987, Lima',
      status: 'checked-in',
      type: 'corporate',
      totalStays: 4,
      lastVisit: new Date(2026, 3, 2),
      birthDate: new Date(1978, 4, 12),
      nationality: 'Peruana',
      preferences: ['Habitación ejecutiva', 'Servicio de planchado'],
      notes: 'Viaja por negocios regularmente'
    },
    {
      id: 7,
      name: 'Lucía Fernández Mendoza',
      document: '67890123',
      phone: '967890123',
      email: 'lucia.fernandez@email.com',
      address: 'Av. La Marina 456, Lima',
      status: 'checked-out',
      type: 'regular',
      totalStays: 2,
      lastVisit: new Date(2026, 2, 30),
      birthDate: new Date(1992, 9, 18),
      nationality: 'Peruana',
      preferences: ['Habitación silenciosa'],
      notes: ''
    },
    {
      id: 8,
      name: 'Roberto Sánchez Díaz',
      document: '45678901',
      phone: '956123456',
      email: 'roberto.sanchez@email.com',
      address: 'Calle Los Nogales 123, Lima',
      status: 'no-show',
      type: 'regular',
      totalStays: 0,
      lastVisit: new Date(2026, 3, 2),
      birthDate: new Date(1998, 1, 25),
      nationality: 'Peruana',
      preferences: [],
      notes: 'No se presentó a la reserva'
    }
  ]);

  private searchTerm = signal<string>('');
  private statusFilter = signal<GuestStatus | 'all'>('all');
  private typeFilter = signal<GuestType | 'all'>('all');

  filteredGuests = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    const type = this.typeFilter();
    let filtered = this.guests();

    if (term) {
      filtered = filtered.filter(guest =>
        guest.name.toLowerCase().includes(term) ||
        guest.document.includes(term) ||
        guest.phone.includes(term) ||
        guest.email.toLowerCase().includes(term)
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter(guest => guest.status === status);
    }

    if (type !== 'all') {
      filtered = filtered.filter(guest => guest.type === type);
    }

    return filtered;
  });

  stats = computed<GuestStats>(() => {
    const guests = this.guests();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: guests.length,
      checkedIn: guests.filter(g => g.status === 'checked-in').length,
      checkedOut: guests.filter(g => g.status === 'checked-out').length,
      reserved: guests.filter(g => g.status === 'reserved').length,
      noShow: guests.filter(g => g.status === 'no-show').length,
      regular: guests.filter(g => g.type === 'regular').length,
      vip: guests.filter(g => g.type === 'vip').length,
      corporate: guests.filter(g => g.type === 'corporate').length,
      activeToday: guests.filter(g => {
        const lastVisit = new Date(g.lastVisit);
        lastVisit.setHours(0, 0, 0, 0);
        return lastVisit.getTime() === today.getTime();
      }).length
    };
  });

  // Contadores individuales para filtros
  checkedInCount = computed(() => this.guests().filter(g => g.status === 'checked-in').length);
  checkedOutCount = computed(() => this.guests().filter(g => g.status === 'checked-out').length);
  reservedCount = computed(() => this.guests().filter(g => g.status === 'reserved').length);
  noShowCount = computed(() => this.guests().filter(g => g.status === 'no-show').length);

  typeCounts = computed(() => ({
    regular: this.guests().filter(g => g.type === 'regular').length,
    vip: this.guests().filter(g => g.type === 'vip').length,
    corporate: this.guests().filter(g => g.type === 'corporate').length
  }));

  setSearchTerm(term: string) {
    this.searchTerm.set(term);
  }

  setStatusFilter(status: GuestStatus | 'all') {
    this.statusFilter.set(status);
  }

  setTypeFilter(type: GuestType | 'all') {
    this.typeFilter.set(type);
  }

  updateGuestStatus(id: number, status: GuestStatus) {
    this.guests.update(guests =>
      guests.map(guest =>
        guest.id === id ? { ...guest, status, lastVisit: new Date() } : guest
      )
    );
  }

  updateGuestType(id: number, type: GuestType) {
    this.guests.update(guests =>
      guests.map(guest =>
        guest.id === id ? { ...guest, type } : guest
      )
    );
  }

  addGuest(guest: Omit<Guest, 'id'>) {
    const newId = Math.max(...this.guests().map(g => g.id), 0) + 1;
    this.guests.update(guests => [...guests, { ...guest, id: newId }]);
  }

  updateGuest(id: number, updatedGuest: Partial<Guest>) {
    this.guests.update(guests =>
      guests.map(guest =>
        guest.id === id ? { ...guest, ...updatedGuest } : guest
      )
    );
  }

  deleteGuest(id: number) {
    if (confirm('¿Estás seguro de eliminar este huésped?')) {
      this.guests.update(guests => guests.filter(guest => guest.id !== id));
    }
  }
}