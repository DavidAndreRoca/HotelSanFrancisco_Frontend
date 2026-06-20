import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/auth/auth.service';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent],
  template: `
    <div class="min-h-screen grid lg:grid-cols-2 bg-[var(--color-surface)]">
      <!-- IMAGEN -->
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
              Gestión hotelera <span class="text-[var(--color-primary-300)]">elegante</span> y precisa.
            </h2>
            <p class="mt-4 text-white/75 max-w-md text-[15px] leading-relaxed">
              Accede al panel para administrar reservas, habitaciones, pagos y operaciones
              en tiempo real.
            </p>
          </div>
        </div>
      </aside>

      <!-- FORMULARIO -->
      <section
        class="flex items-center justify-center px-6 py-12 sm:px-12"
        aria-label="Inicio de sesión">
        <div class="w-full max-w-md">
          <div class="mb-10 lg:hidden text-center">
            <div
              class="inline-flex w-14 h-14 rounded-full bg-[var(--color-ink)] text-[var(--color-primary-300)] items-center justify-center font-extrabold">
              SF
            </div>
          </div>

          <header class="mb-8">
            <h1 class="text-3xl font-bold tracking-tight">Bienvenido de vuelta</h1>
            <p class="text-[15px] text-[var(--color-ink-muted)] mt-2">
              Inicia sesión con tu cuenta corporativa.
            </p>
          </header>

          <form
            [formGroup]="form"
            (ngSubmit)="onSubmit()"
            novalidate
            class="space-y-5"
            aria-label="Formulario de inicio de sesión">
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
                [attr.aria-invalid]="showError('correo') || null"
                [class]="inputClass(showError('correo'))" />
              @if (showError('correo')) {
                <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
                  {{ errorFor('correo') }}
                </p>
              }
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label
                  for="contrasena"
                  class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                  Contraseña <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <div class="flex items-center gap-3">
                  <a
                    routerLink="/recuperar-contrasena"
                    class="text-[12px] text-[var(--color-primary-700)] hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                  <button
                    type="button"
                    class="text-[12px] text-[var(--color-primary-700)] hover:underline"
                    (click)="togglePassword()">
                    {{ showPassword() ? 'Ocultar' : 'Mostrar' }}
                  </button>
                </div>
              </div>
              <input
                id="contrasena"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="contrasena"
                placeholder="Mínimo 6 caracteres"
                autocomplete="current-password"
                [attr.aria-invalid]="showError('contrasena') || null"
                [class]="inputClass(showError('contrasena'))" />
              @if (showError('contrasena')) {
                <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
                  {{ errorFor('contrasena') }}
                </p>
              }
            </div>

            <ui-button type="submit" [block]="true" [loading]="loading()" [disabled]="form.invalid">
              Iniciar sesión
            </ui-button>

            <p class="text-center text-[13px] text-[var(--color-ink-muted)]">
              ¿No tienes una cuenta?
              <a
                routerLink="/register"
                class="text-[var(--color-primary-700)] font-medium hover:underline">
                Regístrate
              </a>
            </p>
          </form>
        </div>
      </section>
    </div>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);

  readonly loading = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    contrasena: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
  });

  showError(field: 'correo' | 'contrasena'): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || c.dirty);
  }

  errorFor(field: 'correo' | 'contrasena'): string {
    const c = this.form.controls[field];
    if (c.hasError('required')) return 'Este campo es obligatorio.';
    if (c.hasError('email')) return 'Ingresa un correo válido.';
    if (c.hasError('minlength')) return 'Mínimo 6 caracteres.';
    if (c.hasError('maxlength')) return 'Valor demasiado largo.';
    return '';
  }

  inputClass(invalid: boolean): string {
    const base =
      'w-full h-11 px-3.5 rounded-lg border bg-white text-[15px] placeholder:text-[var(--color-ink-muted)] transition-all focus:outline-none';
    return invalid
      ? `${base} border-[var(--color-danger-500)] focus:ring-2 focus:ring-[var(--color-danger-500)]/30`
      : `${base} border-[var(--color-border-soft)] focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25`;
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.toastr.success(`Bienvenido, ${user.nombre}`);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.loading.set(false);
        this.toastr.error(err.friendlyMessage ?? 'Credenciales inválidas.', 'No se pudo iniciar sesión');
      },
    });
  }
}
