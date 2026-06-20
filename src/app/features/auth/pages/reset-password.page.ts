import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/auth/auth.service';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('nuevaContrasena')?.value;
  const confirm = group.get('confirmarContrasena')?.value;
  return pass && confirm && pass !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent],
  template: `
    <div class="min-h-screen grid lg:grid-cols-2 bg-[var(--color-surface)]">
      <aside class="relative hidden lg:block overflow-hidden">
        <div
          class="absolute inset-0 bg-cover bg-center"
          style="background-image:url('https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=80')"
          aria-hidden="true"></div>
        <div
          class="absolute inset-0 bg-gradient-to-br from-[var(--color-ink)]/85 via-[var(--color-ink)]/60 to-[var(--color-primary-700)]/55"
          aria-hidden="true"></div>
        <div class="relative h-full flex flex-col justify-between p-12 text-white">
          <a routerLink="/home" class="inline-flex items-center gap-3 group">
            <div
              class="w-12 h-12 rounded-full bg-[var(--color-primary-500)] text-[var(--color-ink)] flex items-center justify-center font-extrabold shadow-lg">
              SF
            </div>
            <div class="leading-tight">
              <p class="text-sm font-semibold tracking-wider">HOTEL SAN FRANCISCO</p>
              <p class="text-[11px] text-white/70">Ica · Perú</p>
            </div>
          </a>
          <div>
            <h2 class="text-4xl font-bold leading-tight max-w-md">
              Crea una <span class="text-[var(--color-primary-300)]">nueva contraseña</span>.
            </h2>
          </div>
        </div>
      </aside>

      <section
        class="flex items-center justify-center px-6 py-12 sm:px-12"
        aria-label="Restablecer contraseña">
        <div class="w-full max-w-md">
          @if (!token) {
            <div class="rounded-lg border border-[var(--color-danger-500)]/40 bg-white p-5" role="alert">
              <p class="font-semibold text-[var(--color-ink)]">Enlace no válido</p>
              <p class="mt-2 text-[15px] text-[var(--color-ink-muted)]">
                El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.
              </p>
              <a
                routerLink="/recuperar-contrasena"
                class="mt-5 inline-flex text-[var(--color-primary-700)] font-medium hover:underline">
                Solicitar nuevo enlace
              </a>
            </div>
          } @else if (done()) {
            <div class="rounded-lg border border-[var(--color-border-soft)] bg-white p-5" role="status">
              <p class="font-semibold text-[var(--color-ink)]">Contraseña actualizada</p>
              <p class="mt-2 text-[15px] text-[var(--color-ink-muted)]">
                Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              <a
                routerLink="/login"
                class="mt-5 inline-flex text-[var(--color-primary-700)] font-medium hover:underline">
                Ir a iniciar sesión
              </a>
            </div>
          } @else {
            <header class="mb-8">
              <h1 class="text-3xl font-bold tracking-tight">Nueva contraseña</h1>
              <p class="text-[15px] text-[var(--color-ink-muted)] mt-2">
                Elige una contraseña segura para tu cuenta.
              </p>
            </header>

            <form
              [formGroup]="form"
              (ngSubmit)="onSubmit()"
              novalidate
              class="space-y-5"
              aria-label="Formulario de nueva contraseña">
              <div>
                <label for="nueva" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                  Nueva contraseña <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input
                  id="nueva"
                  type="password"
                  formControlName="nuevaContrasena"
                  placeholder="Mínimo 6 caracteres"
                  autocomplete="new-password"
                  [class]="inputClass(showError('nuevaContrasena'))" />
                @if (showError('nuevaContrasena')) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
                    La contraseña debe tener al menos 6 caracteres.
                  </p>
                }
              </div>

              <div>
                <label for="confirmar" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                  Confirmar contraseña <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input
                  id="confirmar"
                  type="password"
                  formControlName="confirmarContrasena"
                  placeholder="Repite la contraseña"
                  autocomplete="new-password"
                  [class]="inputClass(mismatch())" />
                @if (mismatch()) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
                    Las contraseñas no coinciden.
                  </p>
                }
              </div>

              <ui-button
                type="submit"
                [block]="true"
                [loading]="loading()"
                [disabled]="form.invalid">
                Restablecer contraseña
              </ui-button>
            </form>
          }
        </div>
      </section>
    </div>
  `,
})
export class ResetPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);

  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly loading = signal(false);
  readonly done = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      nuevaContrasena: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      confirmarContrasena: ['', [Validators.required]],
    },
    { validators: matchPasswords },
  );

  showError(field: 'nuevaContrasena' | 'confirmarContrasena'): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || c.dirty);
  }

  mismatch(): boolean {
    const confirm = this.form.controls.confirmarContrasena;
    return this.form.hasError('passwordMismatch') && (confirm.touched || confirm.dirty);
  }

  inputClass(invalid: boolean): string {
    const base =
      'w-full h-11 px-3.5 rounded-lg border bg-white text-[15px] placeholder:text-[var(--color-ink-muted)] transition-all focus:outline-none';
    return invalid
      ? `${base} border-[var(--color-danger-500)] focus:ring-2 focus:ring-[var(--color-danger-500)]/30`
      : `${base} border-[var(--color-border-soft)] focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25`;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth
      .resetPassword({ token: this.token, nuevaContrasena: this.form.getRawValue().nuevaContrasena })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.done.set(true);
          this.toastr.success('Tu contraseña fue actualizada.');
        },
        error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
          this.loading.set(false);
          this.toastr.error(
            err.friendlyMessage ?? 'El enlace es inválido o ha expirado.',
            'No se pudo restablecer',
          );
        },
      });
  }
}
