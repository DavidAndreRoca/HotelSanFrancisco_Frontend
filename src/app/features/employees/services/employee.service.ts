// features/employees/services/employee.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { Employee, EmployeeRole, EmployeeStatus, EmployeeStats } from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private employees = signal<Employee[]>([
    {
      id: 1,
      name: 'María Estela García Pérez',
      document: '45678901',
      phone: '956123456',
      email: 'maria.garcia@hotel.com',
      role: 'reception',
      status: 'active',
      hireDate: new Date(2024, 0, 15),
      lastShift: new Date(2026, 3, 2),
      salary: 2500,
      address: 'Av. Principal 123, Lima',
      emergencyContact: 'Juan García',
      emergencyPhone: '987654321'
    },
    {
      id: 2,
      name: 'Carlos López Mendoza',
      document: '78912345',
      phone: '987654321',
      email: 'carlos.lopez@hotel.com',
      role: 'cleaning',
      status: 'inactive',
      hireDate: new Date(2024, 2, 10),
      lastShift: new Date(2026, 3, 2),
      salary: 1800,
      address: 'Calle Los Pinos 456, Lima',
      emergencyContact: 'Ana López',
      emergencyPhone: '976543210'
    },
    {
      id: 3,
      name: 'Ana María Rodríguez',
      document: '12345678',
      phone: '912345678',
      email: 'ana.rodriguez@hotel.com',
      role: 'maintenance',
      status: 'inactive',
      hireDate: new Date(2024, 5, 20),
      lastShift: new Date(2026, 3, 2),
      salary: 2000,
      address: 'Jr. Las Flores 789, Lima',
      emergencyContact: 'Pedro Rodríguez',
      emergencyPhone: '965432109'
    },
    {
      id: 4,
      name: 'Pedro Ruiz Fernández',
      document: '56789012',
      phone: '945678901',
      email: 'pedro.ruiz@hotel.com',
      role: 'security',
      status: 'inactive',
      hireDate: new Date(2024, 8, 5),
      lastShift: new Date(2026, 3, 2),
      salary: 2200,
      address: 'Av. Los Álamos 321, Lima',
      emergencyContact: 'Luisa Ruiz',
      emergencyPhone: '954321876'
    },
    {
      id: 5,
      name: 'Elena Vargas Soto',
      document: '90123456',
      phone: '923456789',
      email: 'elena.vargas@hotel.com',
      role: 'cleaning',
      status: 'active',
      hireDate: new Date(2024, 11, 1),
      lastShift: new Date(2026, 3, 2),
      salary: 1800,
      address: 'Calle Los Olivos 654, Lima',
      emergencyContact: 'Roberto Vargas',
      emergencyPhone: '943218765'
    },
    {
      id: 6,
      name: 'Jose Villegas Torres',
      document: '34567890',
      phone: '934567890',
      email: 'jose.villegas@hotel.com',
      role: 'maintenance',
      status: 'active',
      hireDate: new Date(2025, 1, 10),
      lastShift: new Date(2026, 3, 2),
      salary: 2000,
      address: 'Av. Los Incas 987, Lima',
      emergencyContact: 'Sofia Villegas',
      emergencyPhone: '932187654'
    },
    {
      id: 7,
      name: 'Lucía Fernández Mendoza',
      document: '67890123',
      phone: '967890123',
      email: 'lucia.fernandez@hotel.com',
      role: 'management',
      status: 'active',
      hireDate: new Date(2023, 6, 15),
      lastShift: new Date(2026, 3, 2),
      salary: 4000,
      address: 'Av. La Marina 456, Lima',
      emergencyContact: 'Andrés Fernández',
      emergencyPhone: '978654321'
    },
    {
      id: 8,
      name: 'Roberto Sánchez Díaz',
      document: '45678901',
      phone: '956123456',
      email: 'roberto.sanchez@hotel.com',
      role: 'reception',
      status: 'on-vacation',
      hireDate: new Date(2024, 4, 20),
      lastShift: new Date(2026, 2, 28),
      salary: 2500,
      address: 'Calle Los Nogales 123, Lima',
      emergencyContact: 'Marta Sánchez',
      emergencyPhone: '965432109'
    }
  ]);

  private searchTerm = signal<string>('');
  private roleFilter = signal<EmployeeRole | 'all'>('all');
  private statusFilter = signal<EmployeeStatus | 'all'>('all');

  filteredEmployees = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const role = this.roleFilter();
    const status = this.statusFilter();
    let filtered = this.employees();

    if (term) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(term) ||
        emp.document.includes(term) ||
        emp.phone.includes(term)
      );
    }

    if (role !== 'all') {
      filtered = filtered.filter(emp => emp.role === role);
    }

    if (status !== 'all') {
      filtered = filtered.filter(emp => emp.status === status);
    }

    return filtered;
  });

  stats = computed<EmployeeStats>(() => {
    const employees = this.employees();
    return {
      total: employees.length,
      active: employees.filter(e => e.status === 'active').length,
      inactive: employees.filter(e => e.status === 'inactive').length,
      onVacation: employees.filter(e => e.status === 'on-vacation').length,
      sickLeave: employees.filter(e => e.status === 'sick-leave').length,
      reception: employees.filter(e => e.role === 'reception').length,
      cleaning: employees.filter(e => e.role === 'cleaning').length,
      maintenance: employees.filter(e => e.role === 'maintenance').length,
      security: employees.filter(e => e.role === 'security').length,
      management: employees.filter(e => e.role === 'management').length
    };
  });

  // Contadores individuales para filtros
  activeCount = computed(() => this.employees().filter(e => e.status === 'active').length);
  inactiveCount = computed(() => this.employees().filter(e => e.status === 'inactive').length);
  onVacationCount = computed(() => this.employees().filter(e => e.status === 'on-vacation').length);
  sickLeaveCount = computed(() => this.employees().filter(e => e.status === 'sick-leave').length);

  roleCounts = computed(() => ({
    reception: this.employees().filter(e => e.role === 'reception').length,
    cleaning: this.employees().filter(e => e.role === 'cleaning').length,
    maintenance: this.employees().filter(e => e.role === 'maintenance').length,
    security: this.employees().filter(e => e.role === 'security').length,
    management: this.employees().filter(e => e.role === 'management').length
  }));

  setSearchTerm(term: string) {
    this.searchTerm.set(term);
  }

  setRoleFilter(role: EmployeeRole | 'all') {
    this.roleFilter.set(role);
  }

  setStatusFilter(status: EmployeeStatus | 'all') {
    this.statusFilter.set(status);
  }

  updateEmployeeStatus(id: number, status: EmployeeStatus) {
    this.employees.update(employees =>
      employees.map(emp =>
        emp.id === id ? { ...emp, status, lastShift: new Date() } : emp
      )
    );
  }

  updateEmployeeRole(id: number, role: EmployeeRole) {
    this.employees.update(employees =>
      employees.map(emp =>
        emp.id === id ? { ...emp, role } : emp
      )
    );
  }

  addEmployee(employee: Omit<Employee, 'id'>) {
    const newId = Math.max(...this.employees().map(e => e.id)) + 1;
    this.employees.update(employees => [...employees, { ...employee, id: newId }]);
  }

  deleteEmployee(id: number) {
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
      this.employees.update(employees => employees.filter(emp => emp.id !== id));
    }
  }
}