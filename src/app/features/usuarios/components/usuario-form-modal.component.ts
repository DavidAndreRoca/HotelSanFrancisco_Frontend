import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UiModalComponent } from '../../../shared/ui/modal/ui-modal.component';
import { DniLookupComponent } from '../../../shared/components/dni-lookup/dni-lookup.component';
import { ReniecPersona } from '../../../core/reniec/reniec.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PublicDocumentType } from '../../../core/auth/auth-user.interface';
import { RolService } from '../../../features/roles/services/rol.service';
import { RolResponse } from '../../../features/roles/models/rol.model';
import { UsuarioService } from '../services/usuario.service';
import {
  CreateUsuarioRequest,
  EstadoUsuario,
  UpdateUsuarioRequest,
  UsuarioResponse,
} from '../models/usuario.model';
import { ESTADOS_USUARIO, ESTADO_USUARIO_LABEL } from '../utils/usuario-ui';

@Component({
  selector: 'app-usuario-form-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, ReactiveFormsModule, DniLookupComponent],
  template: `
    <ui-modal
      [open]="open()"
      [title]="esEdicion() ? 'Editar usuario' : 'Nuevo usuario'"
      [size]="'lg'"
      (closed)="cerrar.emit()">

      <form [formGroup]="form" class="space-y-5">

        <!-- Datos personales -->
        <div>
          <h3 class="text-xs font-bold text-[#C5A048] uppercase tracking-widest mb-3">Datos personales</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">Nombre *</label>
              <input type="text" formControlName="nombre" [class]="cls('nombre')" />
            </div>
            <div>
              <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">Apellido paterno *</label>
              <input type="text" formControlName="apellidoPaterno" [class]="cls('apellidoPaterno')" />
            </div>
            <div>
              <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">Apellido materno</label>
              <input type="text" formControlName="apellidoMaterno" [class]="cls('apellidoMaterno')" />
            </div>
            <div>
              <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">Teléfono</label>
              <input type="tel" formControlName="telefono" [class]="cls('telefono')" />
            </div>
            <div>
              <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">Tipo de documento *</label>
              <select formControlName="tipoDocumentoId" [class]="cls('tipoDocumentoId')">
                <option [ngValue]="null">— Selecciona —</option>
                @for (td of tiposDoc(); track td.tipoDocumentoId) {
                  <option [ngValue]="td.tipoDocumentoId">{{ td.acronimo }} — {{ td.nombre }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">N° documento *</label>
              <input type="text" formControlName="numeroDocumento" [class]="cls('numeroDocumento')" />
              <app-dni-lookup
                [dni]="form.controls.numeroDocumento.value ?? ''"
                [enabled]="esDni()"
                (found)="onReniec($event)" />
            </div>
            <div>
              <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">Correo *</label>
              <input type="email" formControlName="correo" [class]="cls('correo')" />
            </div>
            <div>
              <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">Fecha de nacimiento</label>
              <input type="date" formControlName="fechaNacimiento" [class]="cls('fechaNacimiento')" />
            </div>
            @if (!esEdicion()) {
              <div>
                <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">Contraseña *</label>
                <input type="password" formControlName="contrasena" [class]="cls('contrasena')" />
              </div>
            }
          </div>
        </div>

        <!-- Acceso -->
        <div>
          <h3 class="text-xs font-bold text-[#C5A048] uppercase tracking-widest mb-3">Acceso</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">Rol *</label>
              <select formControlName="rolId" [class]="cls('rolId')">
                <option [ngValue]="null">— Selecciona —</option>
                @for (r of roles(); track r.rolId) {
                  <option [ngValue]="r.rolId">{{ r.nombre }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">Estado *</label>
              <select formControlName="estado" [class]="cls('estado')">
                @for (e of estados; track e) {
                  <option [value]="e">{{ estadoLabel(e) }}</option>
                }
              </select>
            </div>
          </div>
        </div>

        <!-- Datos laborales (solo si el rol no es CLIENTE) -->
        @if (esStaff()) {
          <div>
            <h3 class="text-xs font-bold text-[#C5A048] uppercase tracking-widest mb-3">Datos laborales</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">Cargo</label>
                <input type="text" formControlName="cargo" [class]="cls('cargo')" />
              </div>
              <div>
                <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">Departamento</label>
                <input type="text" formControlName="departamento" [class]="cls('departamento')" />
              </div>
              <div>
                <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">Código de empleado</label>
                <input type="text" formControlName="codigoEmpleado" [class]="cls('codigoEmpleado')" />
              </div>
              <div>
                <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">Fecha de ingreso</label>
                <input type="date" formControlName="fechaIngreso" [class]="cls('fechaIngreso')" />
              </div>
              <div>
                <label class="block text-[13px] font-semibold text-[#2D2926] mb-1">Salario</label>
                <input type="number" min="0" step="0.01" formControlName="salario" [class]="cls('salario')" />
              </div>
            </div>
          </div>
        }
      </form>

      <ng-container modal-footer>
        <button type="button" (click)="cerrar.emit()"
          class="h-9 px-4 rounded-lg text-sm font-medium text-[#2D2926]/70
                 hover:bg-[#F9F5F0] transition-colors">Cancelar</button>
        <button type="button" (click)="guardar()"
          [disabled]="form.invalid || guardando()"
          class="h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                 hover:bg-[#8E6F2E] transition-colors disabled:opacity-40
                 disabled:cursor-not-allowed">
          {{ guardando() ? 'Guardando…' : 'Guardar' }}
        </button>
      </ng-container>
    </ui-modal>
  `,
  styles: `
    input, select {
      width: 100%; height: 2.5rem; padding: 0 0.75rem; border-radius: 0.5rem;
      border: 1px solid #EEE3D1; background: white; font-size: 0.875rem; color: #2D2926;
    }
    input:focus, select:focus { outline: none; border-color: #C5A048; }
    .err { border-color: #f87171; }
  `,
})
export class UsuarioFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(UsuarioService);
  private readonly rolSvc = inject(RolService);
  private readonly auth = inject(AuthService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly usuario = input<UsuarioResponse | null>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<UsuarioResponse>();

  readonly roles = signal<RolResponse[]>([]);
  readonly tiposDoc = signal<readonly PublicDocumentType[]>([]);
  readonly guardando = signal(false);
  readonly estados = ESTADOS_USUARIO;

  readonly esEdicion = computed(() => this.usuario() != null);

  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    apellidoPaterno: ['', [Validators.required, Validators.maxLength(80)]],
    apellidoMaterno: ['', Validators.maxLength(80)],
    numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    telefono: ['', Validators.maxLength(20)],
    fechaNacimiento: [''],
    contrasena: ['', [Validators.required, Validators.maxLength(255)]],
    rolId: [null as number | null, Validators.required],
    tipoDocumentoId: [null as number | null, Validators.required],
    estado: ['ACTIVO' as EstadoUsuario, Validators.required],
    cargo: ['', Validators.maxLength(80)],
    departamento: ['', Validators.maxLength(80)],
    codigoEmpleado: ['', Validators.maxLength(30)],
    fechaIngreso: [''],
    salario: [null as number | null],
  });

  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /** El rol seleccionado es staff si su nombre no es CLIENTE. */
  readonly esStaff = computed(() => {
    const rolId = this.value().rolId;
    const rol = this.roles().find((r) => r.rolId === rolId);
    return rol ? rol.nombre.toUpperCase() !== 'CLIENTE' : false;
  });

  /** El tipo de documento seleccionado es DNI (habilita la búsqueda RENIEC). */
  esDni(): boolean {
    const id = this.form.controls.tipoDocumentoId.value;
    return this.tiposDoc().find((t) => t.tipoDocumentoId === id)?.acronimo === 'DNI';
  }

  onReniec(p: ReniecPersona): void {
    this.form.patchValue({
      nombre: p.nombres,
      apellidoPaterno: p.apellidoPaterno,
      apellidoMaterno: p.apellidoMaterno,
    });
  }

  constructor() {
    this.rolSvc
      .listarPorEstado('ACTIVO')
      .pipe(catchError(() => of([] as RolResponse[])))
      .subscribe((r) => this.roles.set(r));

    this.auth
      .getDocumentTypes()
      .pipe(catchError(() => of([] as PublicDocumentType[])))
      .subscribe((t) => this.tiposDoc.set(t));

    effect(() => {
      const u = this.usuario();
      const pwd = this.form.controls.contrasena;
      if (u) {
        // Edición: sin contraseña, patch parcial
        pwd.clearValidators();
        pwd.updateValueAndValidity({ emitEvent: false });
        this.form.patchValue({
          nombre: u.nombre,
          apellidoPaterno: u.apellidoPaterno,
          apellidoMaterno: u.apellidoMaterno ?? '',
          numeroDocumento: u.numeroDocumento,
          correo: u.correo,
          telefono: u.telefono ?? '',
          fechaNacimiento: u.fechaNacimiento ?? '',
          rolId: u.rolId,
          tipoDocumentoId: u.tipoDocumentoId,
          estado: u.estado,
          cargo: u.cargo ?? '',
          departamento: u.departamento ?? '',
          codigoEmpleado: u.codigoEmpleado ?? '',
          fechaIngreso: u.fechaIngreso ?? '',
          salario: u.salario,
        });
      } else {
        pwd.setValidators([Validators.required, Validators.maxLength(255)]);
        pwd.updateValueAndValidity({ emitEvent: false });
        this.form.reset({ estado: 'ACTIVO', rolId: null, tipoDocumentoId: null });
      }
    });
  }

  cls(campo: string): string {
    const c = this.form.get(campo);
    return c && c.invalid && (c.touched || c.dirty) ? 'err' : '';
  }

  estadoLabel(e: EstadoUsuario): string { return ESTADO_USUARIO_LABEL[e]; }

  guardar(): void {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const v = this.form.getRawValue();
    const u = this.usuario();

    const base = {
      nombre: v.nombre!.trim(),
      apellidoPaterno: v.apellidoPaterno!.trim(),
      apellidoMaterno: v.apellidoMaterno?.trim() || undefined,
      numeroDocumento: v.numeroDocumento!.trim(),
      correo: v.correo!.trim(),
      telefono: v.telefono?.trim() || undefined,
      fechaNacimiento: v.fechaNacimiento || undefined,
      rolId: v.rolId!,
      tipoDocumentoId: v.tipoDocumentoId!,
      estado: v.estado!,
      cargo: this.esStaff() ? v.cargo?.trim() || undefined : undefined,
      departamento: this.esStaff() ? v.departamento?.trim() || undefined : undefined,
      codigoEmpleado: this.esStaff() ? v.codigoEmpleado?.trim() || undefined : undefined,
      fechaIngreso: this.esStaff() ? v.fechaIngreso || undefined : undefined,
      salario: this.esStaff() ? v.salario ?? undefined : undefined,
    };

    const obs$ = u
      ? this.svc.actualizar(u.usuarioId, base as UpdateUsuarioRequest)
      : this.svc.crear({ ...base, contrasena: v.contrasena! } as CreateUsuarioRequest);

    obs$.subscribe({
      next: (saved) => {
        this.guardando.set(false);
        this.toastr.success(u ? 'Usuario actualizado.' : 'Usuario creado.');
        this.guardado.emit(saved);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.guardando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo guardar el usuario.', 'Error');
      },
    });
  }
}
