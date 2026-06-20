import { Component, input, output, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cliente, CreateClientePayload, UpdateClientePayload } from '../../models/cliente.model';

export interface ClienteModalSaveEvent {
  payload: CreateClientePayload | UpdateClientePayload;
  id?: number;
}

@Component({
  selector: 'app-cliente-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.open]': 'isOpen()',
    '(document:keydown.escape)': 'onClose.emit()',
    role: 'dialog',
    'aria-modal': 'true',
  },
  template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="onClose.emit()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="onClose.emit()" aria-label="Cerrar">✕</button>

          <div class="modal-header">
            <h2>
              {{ mode() === 'view' ? 'Detalle del cliente' : (cliente() ? 'Editar cliente' : 'Nuevo cliente') }}
            </h2>
            @if (cliente()) {
              <span class="id-badge">#{{ cliente()!.huespedId }}</span>
            }
          </div>

          <div class="modal-body">
            <form [formGroup]="form" (ngSubmit)="guardar()">

              <!-- Nombres -->
              <div class="form-row">
                <div class="form-group">
                  <label for="nombre">Nombre <span class="req">*</span></label>
                  <input
                    id="nombre" type="text" formControlName="nombre"
                    class="form-control" [class.is-invalid]="isInvalid('nombre')"
                    [readonly]="mode() === 'view'" maxlength="80"
                    placeholder="Ej: María">
                  @if (isInvalid('nombre')) {
                    <span class="error-msg">El nombre es obligatorio (máx. 80 caracteres)</span>
                  }
                </div>
                <div class="form-group">
                  <label for="apellidoPaterno">Apellido paterno <span class="req">*</span></label>
                  <input
                    id="apellidoPaterno" type="text" formControlName="apellidoPaterno"
                    class="form-control" [class.is-invalid]="isInvalid('apellidoPaterno')"
                    [readonly]="mode() === 'view'" maxlength="80"
                    placeholder="Ej: García">
                  @if (isInvalid('apellidoPaterno')) {
                    <span class="error-msg">El apellido paterno es obligatorio</span>
                  }
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="apellidoMaterno">Apellido materno</label>
                  <input
                    id="apellidoMaterno" type="text" formControlName="apellidoMaterno"
                    class="form-control"
                    [readonly]="mode() === 'view'" maxlength="80"
                    placeholder="Ej: Pérez">
                </div>
                <div class="form-group">
                  <label for="numeroDocumento">N° de documento <span class="req">*</span></label>
                  <input
                    id="numeroDocumento" type="text" formControlName="numeroDocumento"
                    class="form-control" [class.is-invalid]="isInvalid('numeroDocumento')"
                    [readonly]="mode() === 'view'" maxlength="20"
                    placeholder="Ej: 45678901">
                  @if (isInvalid('numeroDocumento')) {
                    <span class="error-msg">El documento es obligatorio (máx. 20 caracteres)</span>
                  }
                </div>
              </div>

              <!-- Contacto -->
              <div class="section-title">Contacto</div>
              <div class="form-row">
                <div class="form-group">
                  <label for="correo">Correo electrónico</label>
                  <input
                    id="correo" type="email" formControlName="correo"
                    class="form-control" [class.is-invalid]="isInvalid('correo')"
                    [readonly]="mode() === 'view'" maxlength="150"
                    placeholder="ejemplo@correo.com">
                  @if (isInvalid('correo')) {
                    <span class="error-msg">Ingresa un correo válido</span>
                  }
                </div>
                <div class="form-group">
                  <label for="telefono">Teléfono</label>
                  <input
                    id="telefono" type="tel" formControlName="telefono"
                    class="form-control"
                    [readonly]="mode() === 'view'" maxlength="20"
                    placeholder="Ej: 956123456">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="nacionalidad">Nacionalidad</label>
                  <input
                    id="nacionalidad" type="text" formControlName="nacionalidad"
                    class="form-control"
                    [readonly]="mode() === 'view'" maxlength="60"
                    placeholder="Ej: Peruana">
                </div>
                <div class="form-group">
                  <label for="estado">Estado <span class="req">*</span></label>
                  <select
                    id="estado" formControlName="estado"
                    class="form-control" [class.is-invalid]="isInvalid('estado')"
                    [disabled]="mode() === 'view'">
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
              </div>

              @if (mode() !== 'view') {
                <div class="modal-actions">
                  <button type="button" class="btn btn-secondary" (click)="onClose.emit()">
                    Cancelar
                  </button>
                  <button type="submit" class="btn btn-primary" [disabled]="form.invalid">
                    {{ cliente() ? 'Guardar cambios' : 'Registrar cliente' }}
                  </button>
                </div>
              } @else {
                <div class="modal-actions">
                  <button type="button" class="btn btn-secondary" (click)="onClose.emit()">Cerrar</button>
                </div>
              }

            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');
    * { font-family: 'Inter', sans-serif; }

    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(45,41,38,0.75);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; animation: overlayIn 0.2s ease;
    }

    @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-content {
      background: #F9F5F0;
      border-radius: 1rem;
      max-width: 680px; width: 90%;
      max-height: 90vh; overflow-y: auto;
      position: relative;
      animation: modalSlideIn 0.25s ease;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }

    @keyframes modalSlideIn {
      from { transform: translateY(-40px); opacity: 0; }
      to   { transform: translateY(0); opacity: 1; }
    }

    .modal-close {
      position: absolute; top: 1rem; right: 1rem;
      background: white; border: 1px solid #EEE3D1;
      font-size: 1.125rem; cursor: pointer; color: #8E6F2E;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%; transition: all 0.2s; z-index: 10;
    }

    .modal-close:hover { background: #C5A048; border-color: #C5A048; color: white; }

    .modal-header {
      padding: 1.5rem 1.5rem 1rem;
      border-bottom: 2px solid #C5A048;
      display: flex; align-items: center; gap: 0.75rem;
    }

    .modal-header h2 {
      margin: 0; font-size: 1.375rem; font-weight: 700;
      color: #2D2926; letter-spacing: -0.02em; flex: 1;
    }

    .id-badge {
      font-size: 0.7rem; font-weight: 600;
      padding: 0.25rem 0.75rem;
      background: #EEE3D1; color: #8E6F2E;
      border-radius: 2rem; letter-spacing: 0.5px;
    }

    .modal-body { padding: 1.5rem; }

    .section-title {
      font-size: 0.75rem; font-weight: 700;
      color: #C5A048; text-transform: uppercase; letter-spacing: 1px;
      margin: 1.25rem 0 0.875rem;
      padding-bottom: 0.375rem;
      border-bottom: 1px solid #EEE3D1;
    }

    .form-group { margin-bottom: 1.25rem; }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    label {
      display: flex; align-items: center; gap: 0.25rem;
      margin-bottom: 0.375rem;
      font-weight: 600; color: #8E6F2E;
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;
    }

    .req { color: #DC2626; font-size: 0.875rem; }

    .form-control {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1.5px solid #EEE3D1;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      background: white; color: #2D2926;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #C5A048;
      box-shadow: 0 0 0 3px rgba(197,160,72,0.1);
    }

    .form-control.is-invalid { border-color: #DC2626; }
    .form-control.is-invalid:focus { box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }

    .form-control[readonly] {
      background: #F9F5F0; cursor: default; border-color: #EEE3D1;
    }

    .form-control::placeholder { color: #8E6F2E; opacity: 0.4; font-size: 0.8125rem; }

    select.form-control {
      cursor: pointer; appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E6F2E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 1rem;
      padding-right: 2.5rem;
    }

    select.form-control:disabled { background-color: #F9F5F0; cursor: default; opacity: 0.8; }

    .error-msg {
      display: block; margin-top: 0.25rem;
      font-size: 0.75rem; color: #DC2626;
    }

    .modal-actions {
      display: flex; gap: 0.75rem; justify-content: flex-end;
      margin-top: 1.5rem; padding-top: 1.25rem;
      border-top: 1px solid #EEE3D1;
    }

    .btn {
      padding: 0.625rem 1.5rem;
      border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: all 0.2s ease; border: none;
      display: inline-flex; align-items: center; gap: 0.5rem;
    }

    .btn-primary { background: #C5A048; color: white; }
    .btn-primary:hover:not(:disabled) {
      background: #8E6F2E; transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(197,160,72,0.3);
    }
    .btn-primary:disabled { background: #EEE3D1; cursor: not-allowed; color: #8E6F2E; }

    .btn-secondary { background: white; color: #2D2926; border: 1.5px solid #EEE3D1; }
    .btn-secondary:hover { background: #F9F5F0; border-color: #C5A048; }

    .modal-content::-webkit-scrollbar { width: 6px; }
    .modal-content::-webkit-scrollbar-track { background: #EEE3D1; }
    .modal-content::-webkit-scrollbar-thumb { background: #C5A048; border-radius: 3px; }

    @media (max-width: 640px) {
      .modal-content { width: 95%; max-height: 85vh; }
      .modal-header { padding: 1rem; }
      .modal-header h2 { font-size: 1.125rem; }
      .modal-body { padding: 1rem; }
      .form-row { grid-template-columns: 1fr; gap: 0.75rem; }
      .modal-actions { flex-direction: column; }
      .btn { width: 100%; justify-content: center; }
    }
  `
})
export class ClienteModalComponent {
  private readonly fb = inject(FormBuilder);

  isOpen  = input.required<boolean>();
  cliente = input<Cliente | null>(null);
  mode    = input<'view' | 'edit' | 'create'>('create');

  onClose = output<void>();
  onSave  = output<ClienteModalSaveEvent>();

  form = this.fb.group({
    nombre:           ['', [Validators.required, Validators.maxLength(80)]],
    apellidoPaterno:  ['', [Validators.required, Validators.maxLength(80)]],
    apellidoMaterno:  ['', [Validators.maxLength(80)]],
    numeroDocumento:  ['', [Validators.required, Validators.maxLength(20)]],
    nacionalidad:     ['', [Validators.maxLength(60)]],
    correo:           ['', [Validators.email, Validators.maxLength(150)]],
    telefono:         ['', [Validators.maxLength(20)]],
    estado:           ['ACTIVO', Validators.required],
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
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  guardar(): void {
    if (this.form.invalid || this.mode() === 'view') return;

    const v = this.form.value;
    const payload = {
      nombre:          v.nombre!.trim(),
      apellidoPaterno: v.apellidoPaterno!.trim(),
      apellidoMaterno: v.apellidoMaterno?.trim() || null,
      numeroDocumento: v.numeroDocumento!.trim(),
      nacionalidad:    v.nacionalidad?.trim() || null,
      correo:          v.correo?.trim() || null,
      telefono:        v.telefono?.trim() || null,
      estado:          v.estado as 'ACTIVO' | 'INACTIVO',
      usuarioId:       null,
    };

    this.onSave.emit({
      payload,
      id: this.cliente()?.huespedId,
    });
  }
}
