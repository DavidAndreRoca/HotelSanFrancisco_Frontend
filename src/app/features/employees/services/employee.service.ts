// features/employees/services/employee.service.ts
// Conectado a GET /api/v1/usuarios (esEmpleado=true). El modelo visual de la
// página (EmployeeRole/EmployeeStatus) no existe 1:1 en el backend, así que
// aquí se mapea: rol/cargo/departamento → EmployeeRole y EstadoUsuario →
// EmployeeStatus. Ver toEmployee() para las reglas.
import { Injectable, signal, computed, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { UsuarioService } from '../../usuarios/services/usuario.service';
import { UsuarioResponse } from '../../usuarios/models/usuario.model';
import { Employee, EmployeeRole, EmployeeStatus, EmployeeStats } from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly usuarios = inject(UsuarioService);
  private readonly toastr = inject(ToastrService);

  private employees = signal<Employee[]>([]);
  readonly loading = signal(false);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.usuarios.listar({ esEmpleado: true, size: 200, sort: 'nombre,asc' }).subscribe({
      next: (page) => {
        this.employees.set(page.content.map((u) => this.toEmployee(u)));
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err?.friendlyMessage ?? 'No se pudo cargar el personal.', 'Empleados');
      },
    });
  }

  /**
   * Mapea el usuario del backend al modelo visual de la página:
   * - role: por cargo/departamento (limpieza/mantenimiento/seguridad) o por
   *   rol RECEPCION; el resto (ADMIN, RRHH, CAJA, INVENTARIO) cae en
   *   'management' como cajón administrativo.
   * - status: ACTIVO → active; INACTIVO y BLOQUEADO → inactive (el backend no
   *   distingue vacaciones ni descanso médico).
   * - address/contacto de emergencia no existen en el backend → vacíos.
   */
  private toEmployee(u: UsuarioResponse): Employee {
    return {
      id: u.usuarioId,
      name: u.nombreCompleto,
      document: u.numeroDocumento,
      phone: u.telefono ?? '',
      email: u.correo,
      role: this.toRole(u),
      status: u.estado === 'ACTIVO' ? 'active' : 'inactive',
      hireDate: new Date(u.fechaIngreso ?? u.fechaCreacion),
      lastShift: new Date(u.fechaModificacion ?? u.fechaCreacion),
      salary: u.salario ?? 0,
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
    };
  }

  private toRole(u: UsuarioResponse): EmployeeRole {
    const texto = `${u.cargo ?? ''} ${u.departamento ?? ''}`.toLowerCase();
    if (texto.includes('limpieza') || texto.includes('housekeeping')) return 'cleaning';
    if (texto.includes('manten')) return 'maintenance';
    if (texto.includes('segur')) return 'security';
    if (u.rolNombre === 'RECEPCION' || texto.includes('recep')) return 'reception';
    return 'management';
  }

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
    const nuevoEstado = status === 'active' ? 'ACTIVO' : 'INACTIVO';
    this.usuarios.cambiarEstado(id, { nuevoEstado }).subscribe({
      next: () => this.reload(),
      error: (err) =>
        this.toastr.error(err?.friendlyMessage ?? 'No se pudo cambiar el estado.', 'Empleados'),
    });
  }

  /** El cambio de rol real requiere un rolId del backend; se gestiona en /users. */
  updateEmployeeRole(id: number, role: EmployeeRole) {
    const actual = this.employees().find(e => e.id === id);
    if (actual && actual.role !== role) {
      this.toastr.info('El rol del sistema se cambia desde la pantalla de Usuarios.', 'Empleados');
    }
  }

  /** El alta real exige contraseña, rol y tipo de documento; se hace en /users. */
  addEmployee(_employee: Omit<Employee, 'id'>) {
    this.toastr.info(
      'Los empleados se crean desde la pantalla de Usuarios (requiere rol, tipo de documento y contraseña).',
      'Empleados',
    );
  }

  /** Baja lógica en el backend (usuario pasa a INACTIVO). */
  deleteEmployee(id: number) {
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
      this.usuarios.eliminar(id).subscribe({
        next: () => {
          this.toastr.success('Empleado dado de baja.', 'Empleados');
          this.reload();
        },
        error: (err) =>
          this.toastr.error(err?.friendlyMessage ?? 'No se pudo eliminar.', 'Empleados'),
      });
    }
  }
}
