// features/guests/models/guest.model.ts
export type GuestStatus = 'checked-in' | 'checked-out' | 'reserved' | 'no-show';
export type GuestType = 'regular' | 'vip' | 'corporate';

export interface Guest {
  id: number;
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  status: GuestStatus;
  type: GuestType;
  totalStays: number;
  lastVisit: Date;
  birthDate: Date;
  nationality: string;
  preferences: string[];
  notes: string;
}

export interface GuestStats {
  total: number;
  checkedIn: number;
  checkedOut: number;
  reserved: number;
  noShow: number;
  regular: number;
  vip: number;
  corporate: number;
  activeToday: number;
}