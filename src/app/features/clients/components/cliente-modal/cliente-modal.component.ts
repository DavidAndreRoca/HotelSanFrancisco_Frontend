import { Component, input, output, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cliente, CreateClientePayload, UpdateClientePayload } from '../../models/cliente.model';

export interface ClienteModalSaveEvent {
  payload: CreateClientePayload | UpdateClientePayload;
  id?: number;
}

const INPUT_BASE = 'mt-1.5 w-full h-10 px-3.5 rounded-lg border bg-white text-sm focus:outline-none transition';
const INPUT_OK   = `${INPUT_BASE} border-[#EEE3D1] focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20`;
const INPUT_ERR  = `${INPUT_BASE} border-red-400 focus:ring-2 focus:ring-red-400/20`;
const INPUT_RO   = `${INPUT_BASE} border-[#EEE3D1] bg-[#F9F5F0] cursor-default`;

@Component({
  selector: 'app-cliente-modal',
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
                {{ mode() === 'view' ? 'Detalle del cliente' : (cliente() ? 'Editar cliente' : 'Nuevo cliente') }}
              </h2>
              @if (cliente()) {
                <p class="text-xs font-mono text-[#C5A048] mt-0.5">#{{ cliente()!.huespedId }}</p>
              } @else {
                <p class="text-xs text-[#2D2926]/45 mt-0.5">Complete los datos del cliente / huésped.</p>
              }
            </div>
          </div>

          <!-- Body -->
          <div class="p-6">
            <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-4">

              <!-- Nombres -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Nombre <span class="text-red-500">*</span>
                  </label>
                  <input type="text" formControlName="nombre" maxlength="80"
                         placeholder="Ej: María"
                         [class]="ic('nombre')" [readonly]="mode() === 'view'">
                  @if (isInvalid('nombre')) {
                    <p class="text-[11px] text-red-600 mt-1">El nombre es obligatorio (máx. 80 caracteres)</p>
                  }
                </div>
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Apellido paterno <span class="text-red-500">*</span>
                  </label>
                  <input type="text" formControlName="apellidoPaterno" maxlength="80"
                         placeholder="Ej: García"
                         [class]="ic('apellidoPaterno')" [readonly]="mode() === 'view'">
                  @if (isInvalid('apellidoPaterno')) {
                    <p class="text-[11px] text-red-600 mt-1">El apellido paterno es obligatorio</p>
                  }
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Apellido materno
                  </label>
                  <input type="text" formControlName="apellidoMaterno" maxlength="80"
                         placeholder="Ej: Pérez"
                         [class]="mode() === 'view' ? roClass : INPUT_OK" [readonly]="mode() === 'view'">
                </div>
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    N° de documento <span class="text-red-500">*</span>
                  </label>
                  <input type="text" formControlName="numeroDocumento" maxlength="20"
                         placeholder="Ej: 45678901"
                         [class]="ic('numeroDocumento')" [readonly]="mode() === 'view'">
                  @if (isInvalid('numeroDocumento')) {
                    <p class="text-[11px] text-red-600 mt-1">El documento es obligatorio (máx. 20 caracteres)</p>
                  }
                </div>
              </div>

              <!-- Separador contacto -->
              <p class="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#C5A048]
                         pt-2 pb-1 border-b border-[#EEE3D1]">
                Contacto
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Correo electrónico
                  </label>
                  <input type="email" formControlName="correo" maxlength="150"
                         placeholder="ejemplo@correo.com"
                         [class]="ic('correo')" [readonly]="mode() === 'view'">
                  @if (isInvalid('correo')) {
                    <p class="text-[11px] text-red-600 mt-1">Ingresa un correo válido</p>
                  }
                </div>
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Teléfono
                  </label>
                  <input type="tel" formControlName="telefono" maxlength="20"
                         placeholder="Ej: 956123456"
                         [class]="mode() === 'view' ? roClass : INPUT_OK" [readonly]="mode() === 'view'">
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Nacionalidad
                  </label>
                  <input type="text" formControlName="nacionalidad" maxlength="60"
                         placeholder="Ej: Peruana"
                         [class]="mode() === 'view' ? roClass : INPUT_OK" [readonly]="mode() === 'view'">
                </div>
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Estado <span class="text-red-500">*</span>
                  </label>
                  <select formControlName="estado"
                    class="mt-1.5 w-full h-10 px-3.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                           focus:outline-none focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20
                           transition disabled:bg-[#F9F5F0] disabled:cursor-default"
                    [attr.disabled]="mode() === 'view' ? true : null">
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
              </div>

              <!-- Acciones -->
              <div class="flex justify-end gap-3 pt-2 border-t border-[#EEE3D1]">
                <button type="button" (click)="onClose.emit()"
                  class="h-9 px-4 rounded-xl border border-[#EEE3D1] text-sm font-semibold
                         text-[#2D2926] hover:border-[#C5A048] hover:bg-[#F9F5F0] transition-colors">
                  {{ mode() === 'view' ? 'Cerrar' : 'Cancelar' }}
                </button>
                @if (mode() !== 'view') {
                  <button type="submit" [disabled]="form.invalid"
                    class="h-9 px-5 rounded-xl text-sm font-semibold text-white transition-colors
                           bg-[#C5A048] hover:bg-[#8E6F2E] disabled:bg-[#EEE3D1] disabled:text-[#8E6F2E]
                           disabled:cursor-not-allowed">
                    {{ cliente() ? 'Guardar cambios' : 'Registrar cliente' }}
                  </button>
                }
              </div>

            </form>
          </div>

        </div>
      </div>
    }
  `,
})
export class ClienteModalComponent {
  private readonly fb = inject(FormBuilder);

  isOpen  = input.required<boolean>();
  cliente = input<Cliente | null>(null);
  mode    = input<'view' | 'edit' | 'create'>('create');

  onClose = output<void>();
  onSave  = output<ClienteModalSaveEvent>();

  protected readonly INPUT_OK = INPUT_OK;
  protected readonly roClass  = INPUT_RO;

  form = this.fb.group({
    nombre:          ['', [Validators.required, Validators.maxLength(80)]],
    apellidoPaterno: ['', [Validators.required, Validators.maxLength(80)]],
    apellidoMaterno: ['', [Validators.maxLength(80)]],
    numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
    nacionalidad:    ['', [Validators.maxLength(60)]],
    correo:          ['', [Validators.email, Validators.maxLength(150)]],
    telefono:        ['', [Validators.maxLength(20)]],
    estado:          ['ACTIVO', Validators.required],
  });

  constructor() {
    effect(() => {
      const c = this.cliente();
      if (c) {
        this.form.patchValue({
          nombre:          c.nombre,
          apellidoPaterno: c.apellidoPaterno,
          apellidoMaterno: c.apellidoMaterno ?? '',
          numeroDocumento: c.numeroDocumento,
          nacionalidad:    c.nacionalidad ?? '',
          correo:          c.correo ?? '',
          telefono:        c.telefono ?? '',
          estado:          c.estado,
        });
      } else if (this.mode() === 'create') {
        this.form.reset({ estado: 'ACTIVO' });
      }
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  ic(field: string): string {
    if (this.mode() === 'view') return INPUT_RO;
    return this.isInvalid(field) ? INPUT_ERR : INPUT_OK;
  }

  guardar(): void {
    if (this.form.invalid || this.mode() === 'view') return;
    const v = this.form.value;
    this.onSave.emit({
      payload: {
        nombre:          v.nombre!.trim(),
        apellidoPaterno: v.apellidoPaterno!.trim(),
        apellidoMaterno: v.apellidoMaterno?.trim() || null,
        numeroDocumento: v.numeroDocumento!.trim(),
        nacionalidad:    v.nacionalidad?.trim() || null,
        correo:          v.correo?.trim() || null,
        telefono:        v.telefono?.trim() || null,
        estado:          v.estado as 'ACTIVO' | 'INACTIVO',
        usuarioId:       null,
      },
      id: this.cliente()?.huespedId,
    });
  }
}
