import { Component, input, output, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Employee, EmployeeRole, EmployeeStatus } from '../../models/employee.model';

const INPUT_BASE = 'mt-1.5 w-full h-10 px-3.5 rounded-lg border bg-white text-sm focus:outline-none transition';
const INPUT_OK   = `${INPUT_BASE} border-[#EEE3D1] focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20`;
const INPUT_ERR  = `${INPUT_BASE} border-red-400 focus:ring-2 focus:ring-red-400/20`;
const SELECT_CLS = 'mt-1.5 w-full h-10 px-3.5 rounded-lg border border-[#EEE3D1] bg-white text-sm ' +
                   'focus:outline-none focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20 transition';

@Component({
  selector: 'app-employee-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  host: {
    '(document:keydown.escape)': 'isOpen() && onClose.emit()',
    role: 'dialog',
    'aria-modal': 'true',
  },
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2926]/75"
           (click)="onClose.emit()">
        <div class="w-full max-w-2xl bg-[#F9F5F0] rounded-2xl shadow-2xl flex flex-col
                    max-h-[90vh] overflow-y-auto relative"
             (click)="$event.stopPropagation()">

          <!-- Cerrar -->
          <button type="button" (click)="onClose.emit()" aria-label="Cerrar"
            class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#EEE3D1]
                   flex items-center justify-center text-[#2D2926]/40
                   hover:bg-[#C5A048] hover:border-[#C5A048] hover:text-white transition-colors z-10">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>

          <!-- Header -->
          <div class="flex items-center gap-3 px-6 py-5 bg-white border-b-2 border-[#C5A048] rounded-t-2xl">
            <div>
              <h2 class="text-base font-bold text-[#2D2926]">
                {{ employee() ? 'Editar empleado' : 'Nuevo empleado' }}
              </h2>
              @if (employee()) {
                <p class="text-xs font-mono text-[#C5A048] mt-0.5">#{{ employee()!.id }}</p>
              } @else {
                <p class="text-xs text-[#2D2926]/45 mt-0.5">Complete los datos del empleado.</p>
              }
            </div>
          </div>

          <!-- Body -->
          <div class="p-6">
            <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">

              <!-- Nombre -->
              <div>
                <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                  Nombre completo <span class="text-red-500">*</span>
                </label>
                <input type="text" formControlName="name" placeholder="Ej: María García Pérez"
                       [class]="ic('name')">
                @if (inv('name')) {
                  <p class="text-[11px] text-red-600 mt-1">El nombre es obligatorio</p>
                }
              </div>

              <!-- Documento y teléfono -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Documento <span class="text-red-500">*</span>
                  </label>
                  <input type="text" formControlName="document" placeholder="Ej: 45678901"
                         [class]="ic('document')">
                  @if (inv('document')) {
                    <p class="text-[11px] text-red-600 mt-1">El documento es obligatorio</p>
                  }
                </div>
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Teléfono <span class="text-red-500">*</span>
                  </label>
                  <input type="tel" formControlName="phone" placeholder="Ej: 956123456"
                         [class]="ic('phone')">
                  @if (inv('phone')) {
                    <p class="text-[11px] text-red-600 mt-1">El teléfono es obligatorio</p>
                  }
                </div>
              </div>

              <!-- Email -->
              <div>
                <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                  Correo electrónico <span class="text-red-500">*</span>
                </label>
                <input type="email" formControlName="email" placeholder="empleado@hotel.com"
                       [class]="ic('email')">
                @if (inv('email')) {
                  <p class="text-[11px] text-red-600 mt-1">Ingresa un correo válido</p>
                }
              </div>

              <!-- Separador -->
              <p class="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#C5A048]
                         pt-2 pb-1 border-b border-[#EEE3D1]">Cargo y estado</p>

              <!-- Rol y estado -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Rol <span class="text-red-500">*</span>
                  </label>
                  <select formControlName="role" [class]="SELECT_CLS">
                    @for (r of roles; track r.value) {
                      <option [value]="r.value">{{ r.label }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Estado <span class="text-red-500">*</span>
                  </label>
                  <select formControlName="status" [class]="SELECT_CLS">
                    @for (s of statuses; track s.value) {
                      <option [value]="s.value">{{ s.label }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Separador -->
              <p class="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#C5A048]
                         pt-2 pb-1 border-b border-[#EEE3D1]">Información adicional</p>

              <!-- Salario y fecha -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Salario (S/.) <span class="text-red-500">*</span>
                  </label>
                  <input type="number" formControlName="salary" placeholder="0.00"
                         [class]="ic('salary')">
                  @if (inv('salary')) {
                    <p class="text-[11px] text-red-600 mt-1">El salario es obligatorio</p>
                  }
                </div>
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Fecha de contratación <span class="text-red-500">*</span>
                  </label>
                  <input type="date" formControlName="hireDate"
                         [class]="ic('hireDate')">
                  @if (inv('hireDate')) {
                    <p class="text-[11px] text-red-600 mt-1">La fecha es obligatoria</p>
                  }
                </div>
              </div>

              <!-- Dirección -->
              <div>
                <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                  Dirección
                </label>
                <input type="text" formControlName="address"
                       placeholder="Ej: Av. Principal 123, Lima"
                       [class]="INPUT_OK">
              </div>

              <!-- Contacto emergencia -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Contacto de emergencia
                  </label>
                  <input type="text" formControlName="emergencyContact"
                         placeholder="Nombre del contacto"
                         [class]="INPUT_OK">
                </div>
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Teléfono de emergencia
                  </label>
                  <input type="tel" formControlName="emergencyPhone"
                         placeholder="Ej: 987654321"
                         [class]="INPUT_OK">
                </div>
              </div>

              <!-- Acciones -->
              <div class="flex justify-end gap-3 pt-2 border-t border-[#EEE3D1]">
                <button type="button" (click)="onClose.emit()"
                  class="h-9 px-4 rounded-xl border border-[#EEE3D1] text-sm font-semibold
                         text-[#2D2926] hover:border-[#C5A048] hover:bg-[#F9F5F0] transition-colors">
                  Cancelar
                </button>
                <button type="submit" [disabled]="form.invalid"
                  class="h-9 px-5 rounded-xl text-sm font-semibold text-white transition-colors
                         bg-[#C5A048] hover:bg-[#8E6F2E] disabled:bg-[#EEE3D1] disabled:text-[#8E6F2E]
                         disabled:cursor-not-allowed">
                  {{ employee() ? 'Guardar cambios' : 'Registrar empleado' }}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    }
  `,
})
export class EmployeeModalComponent {
  private readonly fb = inject(FormBuilder);

  isOpen   = input.required<boolean>();
  employee = input<Employee | null>(null);
  onClose  = output<void>();
  onSave   = output<Record<string, unknown>>();

  protected readonly INPUT_OK   = INPUT_OK;
  protected readonly SELECT_CLS = SELECT_CLS;

  readonly roles = [
    { label: 'Recepción',      value: 'reception'   as EmployeeRole },
    { label: 'Limpieza',       value: 'cleaning'    as EmployeeRole },
    { label: 'Mantenimiento',  value: 'maintenance' as EmployeeRole },
    { label: 'Seguridad',      value: 'security'    as EmployeeRole },
    { label: 'Administración', value: 'management'  as EmployeeRole },
  ];

  readonly statuses = [
    { label: 'Activo',          value: 'active'       as EmployeeStatus },
    { label: 'Inactivo',        value: 'inactive'     as EmployeeStatus },
    { label: 'Vacaciones',      value: 'on-vacation'  as EmployeeStatus },
    { label: 'Licencia médica', value: 'sick-leave'   as EmployeeStatus },
  ];

  form = this.fb.group({
    name:             ['', Validators.required],
    document:         ['', Validators.required],
    phone:            ['', Validators.required],
    email:            ['', [Validators.required, Validators.email]],
    role:             ['reception', Validators.required],
    status:           ['active',    Validators.required],
    address:          [''],
    salary:           [0, Validators.required],
    hireDate:         ['', Validators.required],
    emergencyContact: [''],
    emergencyPhone:   [''],
  });

  constructor() {
    effect(() => {
      const emp  = this.employee();
      const open = this.isOpen();
      if (emp) {
        this.form.patchValue({
          name:             emp.name,
          document:         emp.document,
          phone:            emp.phone,
          email:            emp.email,
          role:             emp.role,
          status:           emp.status,
          address:          emp.address ?? '',
          salary:           emp.salary,
          hireDate:         emp.hireDate.toISOString().split('T')[0],
          emergencyContact: emp.emergencyContact ?? '',
          emergencyPhone:   emp.emergencyPhone ?? '',
        });
      } else if (open) {
        this.form.reset({ role: 'reception', status: 'active', salary: 0 });
      }
    });
  }

  inv(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  ic(field: string): string {
    return this.inv(field) ? INPUT_ERR : INPUT_OK;
  }

  save(): void {
    if (this.form.invalid) return;
    this.onSave.emit(this.form.value as Record<string, unknown>);
  }
}
