// features/guests/components/guest-modal/guest-modal.component.ts
import { Component, input, output, inject, ChangeDetectionStrategy, OnInit, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Guest, GuestStatus, GuestType } from '../../models/guest.model';

@Component({
  selector: 'app-guest-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.open]': 'isOpen()',
    '(document:keydown.escape)': 'onClose.emit()',
    'role': 'dialog',
    'aria-modal': 'true'
  },
  template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="onClose.emit()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="onClose.emit()" aria-label="Cerrar modal">✕</button>

          <div class="modal-header">
            <h2>{{ mode() === 'view' ? 'Detalles del Huésped' : (guest() ? 'Editar Huésped' : 'Nuevo Huésped') }}</h2>
          </div>

          <div class="modal-body">
            <form [formGroup]="guestForm" (ngSubmit)="save()">
              <div class="form-row">
                <div class="form-group">
                  <label for="name">Nombre completo *</label>
                  <input id="name" type="text" formControlName="name" class="form-control" [readonly]="mode() === 'view'">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="document">Documento *</label>
                  <input id="document" type="text" formControlName="document" class="form-control" [readonly]="mode() === 'view'">
                </div>
                <div class="form-group">
                  <label for="phone">Teléfono *</label>
                  <input id="phone" type="tel" formControlName="phone" class="form-control" [readonly]="mode() === 'view'">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="email">Email *</label>
                  <input id="email" type="email" formControlName="email" class="form-control" [readonly]="mode() === 'view'">
                </div>
                <div class="form-group">
                  <label for="birthDate">Fecha nacimiento</label>
                  <input id="birthDate" type="date" formControlName="birthDate" class="form-control" [readonly]="mode() === 'view'">
                </div>
              </div>

              <div class="form-group">
                <label for="address">Dirección</label>
                <textarea id="address" formControlName="address" class="form-control" rows="2" [readonly]="mode() === 'view'"></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="nationality">Nacionalidad</label>
                  <input id="nationality" type="text" formControlName="nationality" class="form-control" [readonly]="mode() === 'view'">
                </div>
                <div class="form-group">
                  <label for="type">Tipo *</label>
                  <select id="type" formControlName="type" class="form-control" [disabled]="mode() === 'view'">
                    @for (type of types; track type.value) {
                      <option [value]="type.value">{{ type.label }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="status">Estado *</label>
                  <select id="status" formControlName="status" class="form-control" [disabled]="mode() === 'view'">
                    @for (status of statuses; track status.value) {
                      <option [value]="status.value">{{ status.label }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label for="totalStays">Total estadías</label>
                  <input id="totalStays" type="number" formControlName="totalStays" class="form-control" [readonly]="mode() === 'view'">
                </div>
              </div>

              <div class="form-group">
                <label for="preferences">Preferencias</label>
                <textarea id="preferences" formControlName="preferences" class="form-control" rows="2" [readonly]="mode() === 'view'" placeholder="Separar preferencias con comas"></textarea>
              </div>

              <div class="form-group">
                <label for="notes">Notas adicionales</label>
                <textarea id="notes" formControlName="notes" class="form-control" rows="3" [readonly]="mode() === 'view'"></textarea>
              </div>

              @if (mode() !== 'view') {
                <div class="modal-actions">
                  <button type="button" class="btn btn-secondary" (click)="onClose.emit()">Cancelar</button>
                  <button type="submit" class="btn btn-primary" [disabled]="guestForm.invalid">Guardar</button>
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
    /* Importar fuente Inter */
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');

    * {
      font-family: 'Inter', sans-serif;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(45, 41, 38, 0.85); /* Sidebar/Contrast con opacidad */
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .modal-overlay.open {
      opacity: 1;
      visibility: visible;
    }

    .modal-content {
      background: #F9F5F0; /* Background: Blanco Hueso */
      border-radius: 1rem;
      max-width: 750px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      animation: modalSlideIn 0.3s ease;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    @keyframes modalSlideIn {
      from {
        transform: translateY(-50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-close {
      position: absolute;
      top: 16px;
      right: 16px;
      background: #F9F5F0;
      border: 1px solid #EEE3D1;
      font-size: 20px;
      cursor: pointer;
      color: #8E6F2E;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
      z-index: 10;
    }

    .modal-close:hover {
      background: #C5A048;
      border-color: #C5A048;
      color: white;
      transform: scale(1.05);
    }

    .modal-header {
      padding: 24px 24px 16px;
      border-bottom: 2px solid #C5A048; /* Primary: Dorado Principal */
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .modal-header-icon {
      font-size: 1.75rem;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #2D2926; /* Sidebar/Contrast: Gris Carbón */
      letter-spacing: -0.02em;
      flex: 1;
    }

    .guest-id-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      background: #EEE3D1;
      color: #8E6F2E;
      border-radius: 2rem;
      letter-spacing: 0.5px;
    }

    .modal-body {
      padding: 24px;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #8E6F2E; /* Secondary: Ocre Oscuro */
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .label-icon {
      font-size: 0.875rem;
    }

    .form-control {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1.5px solid #EEE3D1; /* Details: Crema Suave */
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      background: white;
      color: #2D2926;
    }

    .form-control:focus {
      outline: none;
      border-color: #C5A048; /* Primary: Dorado Principal */
      box-shadow: 0 0 0 3px rgba(197, 160, 72, 0.1);
    }

    .form-control.is-invalid {
      border-color: #DC2626;
    }

    .form-control.is-invalid:focus {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .form-control[readonly] {
      background: #F9F5F0;
      cursor: default;
      border-color: #EEE3D1;
    }

    .form-control::placeholder {
      color: #8E6F2E;
      opacity: 0.4;
      font-size: 0.8125rem;
    }

    select.form-control {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E6F2E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 1rem;
    }

    select.form-control:disabled {
      background: #F9F5F0;
      cursor: default;
      opacity: 0.8;
    }

    textarea.form-control {
      resize: vertical;
      min-height: 60px;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #EEE3D1;
    }

    .btn {
      padding: 0.625rem 1.5rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: #C5A048; /* Primary: Dorado Principal */
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #8E6F2E; /* Secondary: Ocre Oscuro */
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(197, 160, 72, 0.3);
    }

    .btn-primary:disabled {
      background: #EEE3D1;
      cursor: not-allowed;
      color: #8E6F2E;
    }

    .btn-secondary {
      background: white;
      color: #2D2926;
      border: 1.5px solid #EEE3D1;
    }

    .btn-secondary:hover {
      background: #F9F5F0;
      border-color: #C5A048;
    }

    /* Scrollbar personalizada */
    .modal-content::-webkit-scrollbar {
      width: 8px;
    }

    .modal-content::-webkit-scrollbar-track {
      background: #EEE3D1;
      border-radius: 4px;
    }

    .modal-content::-webkit-scrollbar-thumb {
      background: #C5A048;
      border-radius: 4px;
    }

    .modal-content::-webkit-scrollbar-thumb:hover {
      background: #8E6F2E;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .modal-content {
        width: 95%;
        max-height: 85vh;
      }

      .modal-header {
        padding: 1rem;
      }

      .modal-header h2 {
        font-size: 1.25rem;
      }

      .modal-header-icon {
        font-size: 1.5rem;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .modal-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }

      .modal-body {
        padding: 1rem;
      }
    }
  `
})
export class GuestModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  
  isOpen = input.required<boolean>();
  guest = input<Guest | null>(null);
  mode = input<'view' | 'edit' | 'create'>('create');
  onClose = output<void>();
  onSave = output<any>();

  types = [
    { label: 'Regular', value: 'regular' as const },
    { label: 'VIP', value: 'vip' as const },
    { label: 'Corporativo', value: 'corporate' as const }
  ];

  statuses = [
    { label: 'Hospedado', value: 'checked-in' as const },
    { label: 'Check-out', value: 'checked-out' as const },
    { label: 'Reservado', value: 'reserved' as const },
    { label: 'No show', value: 'no-show' as const }
  ];

  guestForm = this.fb.group({
    name: ['', Validators.required],
    document: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    address: [''],
    birthDate: [''],
    nationality: [''],
    type: ['regular', Validators.required],
    status: ['checked-in', Validators.required],
    totalStays: [0],
    preferences: [''],
    notes: ['']
  });

  constructor() {
    // Efecto para actualizar el formulario cuando cambia el guest
    effect(() => {
      const currentGuest = this.guest();
      if (currentGuest) {
        this.guestForm.patchValue({
          name: currentGuest.name,
          document: currentGuest.document,
          phone: currentGuest.phone,
          email: currentGuest.email,
          address: currentGuest.address,
          birthDate: currentGuest.birthDate ? currentGuest.birthDate.toISOString().split('T')[0] : '',
          nationality: currentGuest.nationality,
          type: currentGuest.type,
          status: currentGuest.status,
          totalStays: currentGuest.totalStays,
          preferences: currentGuest.preferences.join(', '),
          notes: currentGuest.notes
        });
      } else if (this.mode() === 'create') {
        // Reset form for new guest
        this.guestForm.reset({
          type: 'regular',
          status: 'checked-in',
          totalStays: 0,
          preferences: '',
          notes: ''
        });
      }
    });
  }

  ngOnInit() {
    // Initial setup if needed
  }

  save() {
    if (this.guestForm.valid && this.mode() !== 'view') {
      const formValue = this.guestForm.value;
      const data = {
        ...formValue,
        birthDate: formValue.birthDate ? new Date(formValue.birthDate) : new Date(),
        preferences: formValue.preferences ? formValue.preferences.split(',').map((p: string) => p.trim()) : [],
        totalStays: Number(formValue.totalStays) || 0
      };
      this.onSave.emit(data);
    }
  }
}