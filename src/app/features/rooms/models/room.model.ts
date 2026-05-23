export type RoomStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';

export interface Room {
  id: number;
  number: string;
  type: 'simple' | 'double' | 'suite';
  status: RoomStatus;
  guestName?: string;
}

export interface DashboardStats {
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  cleaning: number;
  maintenance: number;
}