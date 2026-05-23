// features/rooms/services/room.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { Room, RoomStatus, DashboardStats } from '../models/room.model';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private rooms = signal<Room[]>([
    { id: 1, number: '101', type: 'simple', status: 'available' },
    { id: 2, number: '102', type: 'simple', status: 'occupied', guestName: 'Juan Perez' },
    { id: 3, number: '103', type: 'simple', status: 'available' },
    { id: 4, number: '104', type: 'simple', status: 'occupied', guestName: 'Juan Perez' },
    { id: 5, number: '105', type: 'simple', status: 'available' },
    { id: 6, number: '106', type: 'simple', status: 'reserved', guestName: 'Pedro Ruiz' },
    { id: 7, number: '107', type: 'simple', status: 'available' },
    { id: 8, number: '108', type: 'simple', status: 'occupied', guestName: 'Juan Diaz' },
    { id: 9, number: '109', type: 'simple', status: 'occupied', guestName: 'Carlos Lopez' },
    { id: 10, number: '110', type: 'simple', status: 'reserved' },
    { id: 11, number: '111', type: 'simple', status: 'occupied', guestName: 'Elena Vargas' },
    { id: 12, number: '112', type: 'simple', status: 'reserved' },
    { id: 13, number: '113', type: 'simple', status: 'available' },
    { id: 14, number: '114', type: 'simple', status: 'available' },
    { id: 15, number: '115', type: 'simple', status: 'available' },
    { id: 16, number: '116', type: 'simple', status: 'reserved', guestName: 'Luis Torres' },
    { id: 17, number: '117', type: 'simple', status: 'available' },
    { id: 18, number: '118', type: 'simple', status: 'available' },
    { id: 19, number: '119', type: 'simple', status: 'available' },
    { id: 20, number: '120', type: 'simple', status: 'available' }
  ]);

  private selectedFilter = signal<RoomStatus | 'all'>('all');

  filteredRooms = computed(() => {
    const filter = this.selectedFilter();
    const allRooms = this.rooms();

    if (filter === 'all') {
      return allRooms;
    }

    return allRooms.filter(room => room.status === filter);
  });

  stats = computed<DashboardStats>(() => {
    const rooms = this.rooms();
    return {
      total: rooms.length,
      available: rooms.filter(r => r.status === 'available').length,
      occupied: rooms.filter(r => r.status === 'occupied').length,
      reserved: rooms.filter(r => r.status === 'reserved').length,
      cleaning: rooms.filter(r => r.status === 'cleaning').length,
      maintenance: rooms.filter(r => r.status === 'maintenance').length
    };
  });

  setFilter(filter: RoomStatus | 'all') {
    this.selectedFilter.set(filter);
  }

  updateRoomStatus(roomId: number, status: RoomStatus, guestName?: string) {
    this.rooms.update(rooms =>
      rooms.map(room =>
        room.id === roomId
          ? { ...room, status, guestName: guestName || room.guestName }
          : room
      )
    );
  }
}