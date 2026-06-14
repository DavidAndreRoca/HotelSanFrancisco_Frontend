import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { HabitacionService } from '../../services/habitacion.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { CheckOutLiquidacion } from '../../models/habitacion.model';

function formatIso(iso: string | null | undefined): string {
  if (!iso) return '—';
  return iso.slice(0, 16).replace('T', ' ');
}

@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, UiButtonComponent],
  template: `
    <div class="max-w-xl mx-auto">
      <div class="mb-6">
        <a routerLink="/habitaciones" class="text-[13px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition">
          ← Volver al panel
        </a>
        <h1 class="text-2xl font-bold tracking-tight mt-2">Proceso de Check-out</h1>
        <p class="text-[14px] text-[var(--color-ink-muted)] mt-1">
          Registre la salida del huésped y genere la liquidación final.
        </p>
      </div>

      <!-- Formulario de entrada -->
      @if (!liquidacion()) {
        <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-6 shadow-[var(--shadow-card)]">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="space-y-5">

            <div>
              <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                ID de reserva en CHECK-IN <span class="text-[var(--color-danger-500)]">*</span>
              </label>
              <input
                type="number"
                formControlName="reservaId"
                placeholder="Ej. 42"
                [class]="inputClass(showError('reservaId'))" />
              @if (showError('reservaId')) {
                <p class="text-xs text-[var(--color-danger-500)] mt-1" role="alert">
                  El ID de reserva es obligatorio.
                </p>
              }
            </div>

            <div>
              <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                Consumos adicionales (S/.)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                formControlName="consumosAdicionales"
                placeholder="0.00"
                [class]="inputClass(false)" />
              <p class="text-[12px] text-[var(--color-ink-muted)] mt-1">
                Room service, minibar, servicios extra. Dejar en 0 si no aplica.
              </p>
            </div>

            <div>
              <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                Observaciones de salida
              </label>
              <textarea
                formControlName="observaciones"
                rows="3"
                placeholder="Estado de la habitación, incidencias observadas..."
                class="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border-soft)] bg-white text-[14px] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 transition resize-none">
              </textarea>
            </div>

            <div class="flex gap-3 pt-2">
              <a routerLink="/habitaciones" class="flex-1">
                <ui-button type="button" variant="outline" [block]="true">Cancelar</ui-button>
              </a>
              <div class="flex-1">
                <ui-button type="submit" [block]="true" [loading]="loading()" [disabled]="form.invalid">
                  Generar liquidación
                </ui-button>
              </div>
            </div>
          </form>
        </div>
      }

      <!-- Comprobante de liquidación -->
      @if (liquidacion(); as liq) {
        <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] overflow-hidden">
          <!-- Cabecera del comprobante -->
          <div class="bg-[var(--color-ink)] text-white px-6 py-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[11px] uppercase tracking-[0.2em] text-white/60 font-semibold">Liquidación de estancia</p>
                <p class="text-xl font-bold mt-0.5">{{ liq.codReserva }}</p>
              </div>
              <span class="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/15">CHECK-OUT</span>
            </div>
          </div>

          <!-- Detalle financiero -->
          <div class="px-6 py-5 space-y-2.5 text-[14px]">
            <div class="flex justify-between">
              <span class="text-[var(--color-ink-muted)]">Subtotal ({{ liq.noches }} noche{{ liq.noches !== 1 ? 's' : '' }})</span>
              <span class="font-medium">{{ liq.subtotal | currency:'PEN':'symbol-narrow':'1.2-2' }}</span>
            </div>
            @if (liq.descuento > 0) {
              <div class="flex justify-between text-[var(--color-success-700)]">
                <span>Descuento</span>
                <span class="font-medium">- {{ liq.descuento | currency:'PEN':'symbol-narrow':'1.2-2' }}</span>
              </div>
            }
            <div class="flex justify-between">
              <span class="text-[var(--color-ink-muted)]">Impuesto (IGV)</span>
              <span class="font-medium">{{ liq.impuesto | currency:'PEN':'symbol-narrow':'1.2-2' }}</span>
            </div>
            @if (liq.consumosAdicionales > 0) {
              <div class="flex justify-between">
                <span class="text-[var(--color-ink-muted)]">Consumos adicionales</span>
                <span class="font-medium">{{ liq.consumosAdicionales | currency:'PEN':'symbol-narrow':'1.2-2' }}</span>
              </div>
            }
            <div class="border-t border-[var(--color-border-soft)] pt-2.5 flex justify-between font-bold text-[16px]">
              <span>Total</span>
              <span class="text-[var(--color-ink)]">{{ liq.montoTotal | currency:'PEN':'symbol-narrow':'1.2-2' }}</span>
            </div>
            <div class="flex justify-between text-[var(--color-ink-muted)]">
              <span>Adelanto recibido</span>
              <span>- {{ liq.adelanto | currency:'PEN':'symbol-narrow':'1.2-2' }}</span>
            </div>
            <div class="flex justify-between font-bold text-[15px]">
              <span>Saldo pendiente</span>
              <span [class]="liq.montoPendiente > 0 ? 'text-[var(--color-danger-600)]' : 'text-[var(--color-success-700)]'">
                {{ liq.montoPendiente | currency:'PEN':'symbol-narrow':'1.2-2' }}
              </span>
            </div>
          </div>

          <!-- Info de fechas -->
          <div class="px-6 pb-5 grid grid-cols-2 gap-3 text-[12px] text-[var(--color-ink-muted)] border-t border-[var(--color-border-soft)] pt-4">
            <div>
              <p class="font-semibold text-[var(--color-ink-soft)]">Check-in</p>
              <p>{{ formatFecha(liq.fechaCheckin) }}</p>
            </div>
            <div>
              <p class="font-semibold text-[var(--color-ink-soft)]">Check-out</p>
              <p>{{ formatFecha(liq.fechaCheckout) }}</p>
            </div>
          </div>

          <div class="px-6 pb-5 flex gap-3">
            <button type="button" (click)="liquidacion.set(null)"
              class="flex-1 h-11 px-5 text-sm font-semibold rounded-lg border border-[var(--color-border-soft)] hover:border-[var(--color-primary-500)] transition">
              Nuevo check-out
            </button>
            <a routerLink="/habitaciones"
              class="flex-1 h-11 px-5 text-sm font-semibold rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition flex items-center justify-center">
              Ir al panel
            </a>
          </div>
        </div>
      }
    </div>
  `,
})
export class CheckOutPage {
  private readonly fb = inject(FormBuilder);
  private readonly habitacionService = inject(HabitacionService);
  private readonly authStore = inject(AuthStore);
  private readonly toastr = inject(ToastrService);

  readonly loading = signal(false);
  readonly liquidacion = signal<CheckOutLiquidacion | null>(null);

  readonly form = this.fb.nonNullable.group({
    reservaId: [null as number | null, [Validators.required, Validators.min(1)]],
    consumosAdicionales: [0, [Validators.min(0)]],
    observaciones: [''],
  });

  showError(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  inputClass(invalid: boolean): string {
    const base = 'w-full h-10 px-3.5 rounded-lg border bg-white text-[14px] placeholder:text-[var(--color-ink-muted)] focus:outline-none transition';
    return invalid
      ? `${base} border-[var(--color-danger-500)] focus:ring-2 focus:ring-[var(--color-danger-500)]/30`
      : `${base} border-[var(--color-border-soft)] focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25`;
  }

  formatFecha(iso: string | null | undefined): string { return formatIso(iso); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const usuarioId = this.authStore.user()?.usuarioId;
    if (!usuarioId) { this.toastr.error('Sesión no válida.'); return; }

    this.loading.set(true);
    const { reservaId, consumosAdicionales, observaciones } = this.form.getRawValue();

    this.habitacionService.checkOut({
      reservaId: reservaId!,
      usuarioId,
      consumosAdicionales: consumosAdicionales ?? 0,
      observaciones: observaciones || undefined,
    }).subscribe({
      next: (liq) => {
        this.loading.set(false);
        this.liquidacion.set(liq);
        this.toastr.success('Check-out registrado. Habitación(es) en cola de limpieza.');
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.loading.set(false);
        this.toastr.error(err.friendlyMessage ?? 'Error al procesar el check-out.', 'Check-out fallido');
      },
    });
  }
}
