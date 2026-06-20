import { Component, input, output, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Reserva, CancelarReservaPayload } from '../../models/reservation.model';

@Component({
  selector: 'app-cancelar-modal',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'isOpen() && onClose.emit()',
    role: 'dialog',
    'aria-modal': 'true',
  },
  template: `
    @if (isOpen() && reserva()) {
      <div class="modal-overlay" (click)="onClose.emit()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="onClose.emit()" aria-label="Cerrar">✕</button>

          <div class="modal-header danger">
            <span class="header-icon">⚠️</span>
            <div>
              <h2>Cancelar Reserva</h2>
              <p class="cod-badge">{{ reserva()!.codReserva }}</p>
            </div>
          </div>

          <div class="modal-body">
            <div class="warning-box">
              <p>
                Estás a punto de cancelar la reserva de
                <strong>{{ huespedPrincipal() }}</strong>
                del <strong>{{ formatFecha(reserva()!.fechaInicio) }}</strong>
                al <strong>{{ formatFecha(reserva()!.fechaFin) }}</strong>.
              </p>
              @if (reserva()!.adelanto > 0) {
                <p class="adelanto-info">
                  Adelanto registrado: <strong>S/ {{ reserva()!.adelanto | number:'1.2-2' }}</strong>
                </p>
              }
            </div>

            <form [formGroup]="form" (ngSubmit)="confirmar()">
              <div class="form-group">
                <label for="motivo">Motivo de cancelación <span class="req">*</span></label>
                <textarea
                  id="motivo"
                  formControlName="motivo"
                  class="form-control"
                  [class.is-invalid]="isInvalid('motivo')"
                  rows="3"
                  maxlength="500"
                  placeholder="Indique el motivo de la cancelación..."></textarea>
                @if (isInvalid('motivo')) {
                  <span class="error-msg">El motivo es obligatorio (máx. 500 caracteres)</span>
                }
                <span class="char-count">{{ form.get('motivo')?.value?.length ?? 0 }} / 500</span>
              </div>

              @if (reserva()!.adelanto > 0) {
                <div class="form-group">
                  <label for="penalizacion">Política de penalización</label>
                  <select id="penalizacion" formControlName="aplicarPenalizacion" class="form-control">
                    <option value="auto">Automática (según días de anticipación)</option>
                    <option value="true">Aplicar penalización (20% del adelanto)</option>
                    <option value="false">Exonerar penalización (devolución total)</option>
                  </select>
                  <span class="hint">
                    @if (form.get('aplicarPenalizacion')?.value === 'false') {
                      El cliente recibirá devolución total del adelanto: S/ {{ reserva()!.adelanto | number:'1.2-2' }}
                    } @else if (form.get('aplicarPenalizacion')?.value === 'true') {
                      Penalización estimada: S/ {{ reserva()!.adelanto * 0.2 | number:'1.2-2' }} — Devolución: S/ {{ reserva()!.adelanto * 0.8 | number:'1.2-2' }}
                    } @else {
                      La penalización se calculará automáticamente según la política del hotel.
                    }
                  </span>
                </div>
              }

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="onClose.emit()">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-danger" [disabled]="form.invalid">
                  Confirmar cancelación
                </button>
              </div>
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
      z-index: 1100; animation: overlayIn 0.2s ease;
    }

    @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-content {
      background: white; border-radius: 1rem;
      max-width: 520px; width: 90%; max-height: 90vh; overflow-y: auto;
      position: relative;
      animation: slideIn 0.25s ease;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
    }

    @keyframes slideIn {
      from { transform: translateY(-30px) scale(0.97); opacity: 0; }
      to   { transform: translateY(0) scale(1); opacity: 1; }
    }

    .modal-close {
      position: absolute; top: 1rem; right: 1rem;
      background: #F9F5F0; border: 1px solid #EEE3D1;
      font-size: 1.125rem; cursor: pointer; color: #8E6F2E;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%; transition: all 0.2s; z-index: 10;
    }
    .modal-close:hover { background: #DC2626; border-color: #DC2626; color: white; }

    .modal-header {
      padding: 1.5rem 1.5rem 1rem;
      border-bottom: 2px solid #DC2626;
      display: flex; align-items: flex-start; gap: 0.875rem;
    }

    .header-icon { font-size: 2rem; margin-top: 0.125rem; }

    .modal-header h2 {
      margin: 0; font-size: 1.25rem; font-weight: 700; color: #2D2926;
    }

    .cod-badge {
      margin: 0.25rem 0 0;
      font-family: monospace; font-size: 0.8125rem;
      color: #DC2626; font-weight: 600;
    }

    .modal-body { padding: 1.5rem; }

    .warning-box {
      background: #FFF5F5; border: 1px solid #FECACA;
      border-radius: 0.5rem; padding: 1rem;
      margin-bottom: 1.25rem;
      font-size: 0.875rem; color: #2D2926; line-height: 1.5;
    }

    .warning-box p { margin: 0 0 0.5rem; }
    .warning-box p:last-child { margin-bottom: 0; }

    .adelanto-info { color: #DC2626; font-weight: 500; }

    .form-group { margin-bottom: 1.25rem; }

    label {
      display: block; margin-bottom: 0.375rem;
      font-weight: 600; color: #8E6F2E;
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;
    }

    .req { color: #DC2626; }

    .form-control {
      width: 100%; padding: 0.625rem 0.875rem;
      border: 1.5px solid #EEE3D1; border-radius: 0.5rem;
      font-size: 0.875rem; transition: all 0.2s;
      background: white; color: #2D2926;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none; border-color: #DC2626;
      box-shadow: 0 0 0 3px rgba(220,38,38,0.1);
    }

    .form-control.is-invalid { border-color: #DC2626; }
    textarea.form-control { resize: vertical; min-height: 80px; }

    select.form-control {
      cursor: pointer; appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E6F2E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 1rem;
      padding-right: 2.5rem;
    }

    .char-count { display: block; text-align: right; font-size: 0.7rem; color: #8E6F2E; margin-top: 0.25rem; }
    .error-msg { display: block; font-size: 0.75rem; color: #DC2626; margin-top: 0.25rem; }
    .hint { display: block; font-size: 0.75rem; color: #8E6F2E; margin-top: 0.375rem; }

    .modal-actions {
      display: flex; gap: 0.75rem; justify-content: flex-end;
      margin-top: 1.5rem; padding-top: 1.25rem;
      border-top: 1px solid #EEE3D1;
    }

    .btn {
      padding: 0.625rem 1.5rem; border-radius: 0.5rem;
      font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: all 0.2s; border: none;
      display: inline-flex; align-items: center; gap: 0.5rem;
    }

    .btn-secondary { background: white; color: #2D2926; border: 1.5px solid #EEE3D1; }
    .btn-secondary:hover { background: #F9F5F0; border-color: #C5A048; }

    .btn-danger { background: #DC2626; color: white; }
    .btn-danger:hover:not(:disabled) {
      background: #B91C1C; transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220,38,38,0.3);
    }
    .btn-danger:disabled { background: #FECACA; cursor: not-allowed; }
  `
})
export class CancelarModalComponent {
  private readonly fb = inject(FormBuilder);

  isOpen  = input.required<boolean>();
  reserva = input<Reserva | null>(null);

  onClose    = output<void>();
  onCancelar = output<CancelarReservaPayload>();

  form = this.fb.group({
    motivo:               ['', [Validators.required, Validators.maxLength(500)]],
    aplicarPenalizacion:  ['auto'],
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        this.form.reset({ aplicarPenalizacion: 'auto' });
      }
    });
  }

  huespedPrincipal(): string {
    const r = this.reserva();
    if (!r) return '';
    return r.huespedes.find(h => h.esPrincipal)?.nombreCompleto ?? r.huespedes[0]?.nombreCompleto ?? '—';
  }

  formatFecha(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  confirmar(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const penalizacion = v.aplicarPenalizacion === 'true' ? true
                       : v.aplicarPenalizacion === 'false' ? false
                       : null;
    this.onCancelar.emit({ motivo: v.motivo!, aplicarPenalizacion: penalizacion });
  }
}
