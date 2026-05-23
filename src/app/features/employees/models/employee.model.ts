// features/employees/models/employee.model.ts
export type EmployeeRole = 'reception' | 'cleaning' | 'maintenance' | 'security' | 'management';
export type EmployeeStatus = 'active' | 'inactive' | 'on-vacation' | 'sick-leave';

export interface Employee {
  id: number;
  name: string;
  document: string;
  phone: string;
  email: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  hireDate: Date;
  lastShift: Date;
  salary: number;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  onVacation: number;
  sickLeave: number;
  reception: number;
  cleaning: number;
  maintenance: number;
  security: number;
  management: number;
}