import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/auth/auth.service';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';

const RESEND_COOLDOWN_SECONDS = 45;

@Component({
  selector: 'app-verify-email',
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
              Verifica tu <span class="text-[var(--color-primary-300)]">cuenta</span>.
            </h2>
            <p class="mt-4 text-white/75 max-w-md text-[15px] leading-relaxed">
              Te enviamos un código de 6 dígitos a tu correo. Ingrésalo para activar tu cuenta y
              empezar a reservar.
            </p>
          </div>
        </div>
      </aside>

      <!-- FORMULARIO -->
      <section
        class="flex items-center justify-center px-6 py-12 sm:px-12"
        aria-label="Verificar cuenta"
      >
        <div class="w-full max-w-md">
          <header class="mb-8">
            <h1 class="text-3xl font-bold tracking-tight">Verifica tu cuenta</h1>
            <p class="text-[15px] text-[var(--color-ink-muted)] mt-2">
              Ingresa el código de 6 dígitos que enviamos a
              <span class="font-medium text-[var(--color-ink)]">{{ correo() || 'tu correo' }}</span
              >.
            </p>
          </header>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="space-y-5">
            <div>
              <label for="codigo" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                Código de verificación <span class="text-[var(--color-danger-500)]">*</span>
              </label>
              <input
                id="codigo"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                formControlName="codigo"
                placeholder="000000"
                [attr.aria-invalid]="showError() || null"
                [class]="inputClass(showError())"
                (input)="onCodeInput($event)"
              />
              @if (showError()) {
                <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
                  {{ errorMessage() }}
                </p>
              }
            </div>

            @if (serverError()) {
              <div
                class="rounded-lg border border-[var(--color-danger-500)]/40 bg-[var(--color-danger-500)]/10 p-3.5 text-[14px] text-[var(--color-ink)]"
                role="alert"
              >
                {{ serverError() }}
              </div>
            }

            <ui-button type="submit" [block]="true" [loading]="loading()" [disabled]="form.invalid">
              Verificar
            </ui-button>

            <button
              type="button"
              class="w-full text-center text-[13px] font-medium text-[var(--color-primary-700)] hover:underline disabled:text-[var(--color-ink-muted)] disabled:no-underline disabled:cursor-not-allowed"
              [disabled]="resending() || cooldown() > 0"
              (click)="onResend()"
            >
              @if (cooldown() > 0) {
                Reenviar código en {{ cooldown() }} s
              } @else if (resending()) {
                Enviando…
              } @else {
                Reenviar código
              }
            </button>

            <p class="text-center text-[13px] text-[var(--color-ink-muted)]">
              <a
                routerLink="/login"
                class="text-[var(--color-primary-700)] font-medium hover:underline"
              >
                ← Volver a iniciar sesión
              </a>
            </p>
          </form>
        </div>
      </section>
    </div>
  `,
})
export class VerifyEmailPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);

  readonly loading = signal(false);
  readonly resending = signal(false);
  readonly cooldown = signal(0);
  readonly serverError = signal('');
  readonly correo = signal('');

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
  });

  ngOnInit(): void {
    const correo = this.route.snapshot.queryParamMap.get('correo') ?? '';
    this.correo.set(correo);
    if (!correo) {
      // Sin correo no podemos verificar; volvemos al login.
      this.toastr.warning('No pudimos identificar tu correo. Inicia sesión para reenviarte el código.');
      this.router.navigateByUrl('/login');
    }
  }

  ngOnDestroy(): void {
    this.stopCooldown();
  }

  showError(): boolean {
    const c = this.form.controls.codigo;
    return c.invalid && (c.touched || c.dirty);
  }

  errorMessage(): string {
    const c = this.form.controls.codigo;
    if (c.hasError('required')) return 'El código es obligatorio.';
    if (c.hasError('pattern')) return 'El código debe tener 6 dígitos numéricos.';
    return '';
  }

  inputClass(invalid: boolean): string {
    const base =
      'w-full h-12 px-3.5 rounded-lg border bg-white text-center text-2xl tracking-[0.5em] font-semibold placeholder:tracking-[0.5em] placeholder:text-[var(--color-ink-muted)] transition-all focus:outline-none';
    return invalid
      ? `${base} border-[var(--color-danger-500)] focus:ring-2 focus:ring-[var(--color-danger-500)]/30`
      : `${base} border-[var(--color-border-soft)] focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25`;
  }

  /** Solo permite dígitos y limita a 6. */
  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/\D/g, '').slice(0, 6);
    if (clean !== input.value) {
      this.form.controls.codigo.setValue(clean);
    }
    if (this.serverError()) this.serverError.set('');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const correo = this.correo();
    const codigo = this.form.getRawValue().codigo;
    this.serverError.set('');
    this.loading.set(true);

    this.auth.verifyEmail({ correo, codigo }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastr.success('Correo verificado. Ya puedes iniciar sesión.');
        this.router.navigate(['/login'], { queryParams: { correo } });
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string; code?: string }) => {
        this.loading.set(false);

        // 422 BUSINESS_ERROR → mensaje del backend tal cual (incorrecto/expirado/…).
        // 400 VALIDATION_ERROR → fieldErrors del código.
        if (err.status === 422 || err.status === 400) {
          const body = err.error as { fieldErrors?: Record<string, string> } | null;
          const fieldMsg = body?.fieldErrors?.['codigo'];
          this.serverError.set(fieldMsg ?? err.friendlyMessage ?? 'Código inválido.');
          return;
        }

        this.serverError.set(err.friendlyMessage ?? 'No pudimos verificar el código. Intenta de nuevo.');
      },
    });
  }

  onResend(): void {
    const correo = this.correo();
    if (!correo || this.cooldown() > 0 || this.resending()) return;

    this.resending.set(true);
    this.auth.resendVerification({ correo }).subscribe({
      next: (message) => {
        this.resending.set(false);
        this.serverError.set('');
        this.form.reset({ codigo: '' });
        this.toastr.info(message);
        this.startCooldown();
      },
      error: () => {
        this.resending.set(false);
      },
    });
  }

  private startCooldown(): void {
    this.stopCooldown();
    this.cooldown.set(RESEND_COOLDOWN_SECONDS);
    this.cooldownTimer = setInterval(() => {
      const next = this.cooldown() - 1;
      this.cooldown.set(next);
      if (next <= 0) this.stopCooldown();
    }, 1000);
  }

  private stopCooldown(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }
}
