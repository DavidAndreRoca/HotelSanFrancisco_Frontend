import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/auth/auth.service';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';

@Component({
  selector: 'app-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent],
  template: `
    <div class="min-h-screen grid lg:grid-cols-2 bg-[var(--color-surface)]">
      <!-- IMAGEN -->
      <aside class="relative hidden lg:block overflow-hidden">
        <div
          class="absolute inset-0 bg-cover bg-center"
          style="background-image:url('https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=80')"
          aria-hidden="true"
        ></div>
        <div
          class="absolute inset-0 bg-gradient-to-br from-[var(--color-ink)]/85 via-[var(--color-ink)]/60 to-[var(--color-primary-700)]/55"
          aria-hidden="true"
        ></div>

        <div class="relative h-full flex flex-col justify-between p-12 text-white">
          <a routerLink="/home" class="inline-flex items-center gap-3 group">
            <div
              class="w-12 h-12 rounded-full bg-[var(--color-primary-500)] text-[var(--color-ink)] flex items-center justify-center font-extrabold shadow-lg"
            >
              SF
            </div>
            <div class="leading-tight">
              <p class="text-sm font-semibold tracking-wider">HOTEL SAN FRANCISCO</p>
              <p class="text-[11px] text-white/70">Ica · Perú</p>
            </div>
          </a>

          <div>
            <h2 class="text-4xl font-bold leading-tight max-w-md">
              ¿Olvidaste tu <span class="text-[var(--color-primary-300)]">contraseña</span>?
            </h2>
            <p class="mt-4 text-white/75 max-w-md text-[15px] leading-relaxed">
              Te enviaremos un enlace seguro para que puedas restablecerla en segundos.
            </p>
          </div>
        </div>
      </aside>

      <!-- FORMULARIO -->
      <section
        class="flex items-center justify-center px-6 py-12 sm:px-12"
        aria-label="Recuperar contraseña"
      >
        <div class="w-full max-w-md">
          <header class="mb-8">
            <h1 class="text-3xl font-bold tracking-tight">Recuperar contraseña</h1>
            <p class="text-[15px] text-[var(--color-ink-muted)] mt-2">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </header>

          @if (sent()) {
            <div
              class="rounded-lg border border-[var(--color-border-soft)] bg-white p-5 text-[15px] leading-relaxed"
              role="status"
            >
              <p class="font-semibold text-[var(--color-ink)]">Revisa tu bandeja de entrada</p>
              <p class="mt-2 text-[var(--color-ink-muted)]">
                Si <span class="font-medium">{{ sentTo() }}</span> está registrado, recibirás un
                enlace para restablecer tu contraseña. Revisa también la carpeta de spam.
              </p>
              <a
                routerLink="/login"
                class="mt-5 inline-flex items-center gap-2 text-[var(--color-primary-700)] font-medium hover:underline"
              >
                ← Volver a iniciar sesión
              </a>
            </div>
          } @else {
            <form
              [formGroup]="form"
              (ngSubmit)="onSubmit()"
              novalidate
              class="space-y-5"
              aria-label="Formulario de recuperación de contraseña"
            >
              <div>
                <label for="correo" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                  Correo electrónico <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input
                  id="correo"
                  type="email"
                  formControlName="correo"
                  placeholder="nombre@hotelsanfrancisco.com"
                  autocomplete="email"
                  [attr.aria-invalid]="showError() || null"
                  [class]="inputClass(showError())"
                />
                @if (showError()) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
                    {{ errorMessage() }}
                  </p>
                }
              </div>

              <ui-button
                type="submit"
                [block]="true"
                [loading]="loading()"
                [disabled]="form.invalid"
              >
                Enviar enlace de recuperación
              </ui-button>

              <p class="text-center text-[13px] text-[var(--color-ink-muted)]">
                <a
                  routerLink="/login"
                  class="text-[var(--color-primary-700)] font-medium hover:underline"
                >
                  ← Volver a iniciar sesión
                </a>
              </p>
            </form>
          }
        </div>
      </section>
    </div>
  `,
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toastr = inject(ToastrService);

  readonly loading = signal(false);
  readonly sent = signal(false);
  readonly sentTo = signal('');

  readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
  });

  showError(): boolean {
    const c = this.form.controls.correo;
    return c.invalid && (c.touched || c.dirty);
  }

  errorMessage(): string {
    const c = this.form.controls.correo;
    if (c.hasError('required')) return 'El correo es obligatorio.';
    if (c.hasError('email')) return 'Ingresa un correo electrónico válido.';
    if (c.hasError('maxlength')) return 'El correo es demasiado largo.';
    return '';
  }

  inputClass(invalid: boolean): string {
    const base =
      'w-full h-11 px-3.5 rounded-lg border bg-white text-[15px] placeholder:text-[var(--color-ink-muted)] transition-all focus:outline-none';
    return invalid
      ? `${base} border-[var(--color-danger-500)] focus:ring-2 focus:ring-[var(--color-danger-500)]/30`
      : `${base} border-[var(--color-border-soft)] focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25`;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const correo = this.form.getRawValue().correo;
    this.loading.set(true);
    this.auth.forgotPassword({ correo }).subscribe({
      next: () => {
        this.loading.set(false);
        this.sentTo.set(correo);
        this.sent.set(true);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.loading.set(false);
        // Por seguridad el backend no debería revelar si el correo existe;
        // ante un error real (5xx/red) mostramos aviso, el interceptor ya notifica.
        if (err.status >= 500 || err.status === 0) {
          this.toastr.error('No se pudo enviar el enlace. Intenta de nuevo.');
        } else {
          // Respuesta tipo "siempre OK" para no filtrar existencia de cuentas.
          this.sentTo.set(correo);
          this.sent.set(true);
        }
      },
    });
  }
}
