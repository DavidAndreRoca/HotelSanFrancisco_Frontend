import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { HabitacionService } from '../../services/habitacion.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';

@Component({
  selector: 'app-checkin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent],
  template: `
    <div class="max-w-xl mx-auto">
      <!-- Encabezado -->
      <div class="mb-6">
        <a routerLink="/habitaciones" class="text-[13px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition">
          ← Volver al panel
        </a>
        <h1 class="text-2xl font-bold tracking-tight mt-2">Proceso de Check-in</h1>
        <p class="text-[14px] text-[var(--color-ink-muted)] mt-1">
          Complete el formulario para registrar el ingreso del huésped.
        </p>
      </div>

      <!-- Formulario -->
      <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-6 shadow-[var(--shadow-card)]">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="space-y-5">

          <div>
            <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
              ID de reserva <span class="text-[var(--color-danger-500)]">*</span>
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
            <p class="text-[12px] text-[var(--color-ink-muted)] mt-1">
              La reserva debe estar en estado <strong>CONFIRMADA</strong>.
            </p>
          </div>

          <div>
            <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
              Responsable del check-in
            </label>
            <input
              type="text"
              disabled
              [value]="usuarioLabel()"
              class="w-full h-10 px-3.5 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] text-[14px] text-[var(--color-ink-muted)] cursor-not-allowed" />
            <p class="text-[12px] text-[var(--color-ink-muted)] mt-1">
              Se usa el usuario de la sesión activa.
            </p>
          </div>

          <div>
            <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
              Observaciones
            </label>
            <textarea
              formControlName="observaciones"
              rows="3"
              placeholder="Notas adicionales sobre el check-in..."
              class="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border-soft)] bg-white text-[14px] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 transition resize-none">
            </textarea>
          </div>

          <!-- Info box -->
          <div class="rounded-lg bg-[var(--color-primary-500)]/8 border border-[var(--color-primary-500)]/25 p-4 text-[13px] text-[var(--color-ink-soft)]">
            <p class="font-semibold mb-1">¿Qué ocurre al confirmar?</p>
            <ul class="space-y-1 list-disc list-inside text-[var(--color-ink-muted)]">
              <li>La reserva pasa a estado <strong>CHECK_IN</strong>.</li>
              <li>Las habitaciones asignadas pasan a <strong>OCUPADA</strong>.</li>
              <li>Se registra la estancia con fecha y hora de ingreso.</li>
            </ul>
          </div>

          <div class="flex gap-3 pt-2">
            <a routerLink="/habitaciones" class="flex-1">
              <ui-button type="button" variant="outline" [block]="true">Cancelar</ui-button>
            </a>
            <div class="flex-1">
              <ui-button type="submit" [block]="true" [loading]="loading()" [disabled]="form.invalid">
                Confirmar check-in
              </ui-button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class CheckInPage {
  private readonly fb = inject(FormBuilder);
  private readonly habitacionService = inject(HabitacionService);
  private readonly authStore = inject(AuthStore);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);

  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    reservaId: [null as number | null, [Validators.required, Validators.min(1)]],
    observaciones: [''],
  });

  usuarioLabel(): string {
    const u = this.authStore.user();
    return u ? `${u.nombre} ${u.apellidoPaterno} (${u.rol})` : '—';
  }

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

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const usuarioId = this.authStore.user()?.usuarioId;
    if (!usuarioId) { this.toastr.error('Sesión no válida.'); return; }

    this.loading.set(true);
    this.habitacionService.checkIn({
      reservaId: this.form.getRawValue().reservaId!,
      usuarioId,
      observaciones: this.form.getRawValue().observaciones || undefined,
    }).subscribe({
      next: () => {
        this.toastr.success('Check-in registrado. Habitación(es) en OCUPADA.');
        this.router.navigate(['/habitaciones']);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.loading.set(false);
        this.toastr.error(err.friendlyMessage ?? 'Error al procesar el check-in.', 'Check-in fallido');
      },
    });
  }
}
