import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/auth/auth.service';
import { PublicDocumentType, RegisterRequest } from '../../../core/auth/auth-user.interface';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const a = group.get('contrasena')?.value;
  const b = group.get('confirmarContrasena')?.value;
  return a && b && a === b ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent],
  template: `
    <div class="min-h-screen grid lg:grid-cols-[1.1fr_1.4fr] bg-[var(--color-surface)]">
      <!-- IMAGEN -->
      <aside class="relative hidden lg:block overflow-hidden">
        <div
          class="absolute inset-0 bg-cover bg-center"
          style="background-image:url('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=80')"
          aria-hidden="true"
        ></div>
        <div
          class="absolute inset-0 bg-gradient-to-br from-[var(--color-ink)]/85 via-[var(--color-ink)]/55 to-[var(--color-primary-700)]/55"
          aria-hidden="true"
        ></div>

        <div class="relative h-full flex flex-col justify-between p-12 text-white">
          <a routerLink="/home" class="inline-flex items-center gap-3">
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
              Crea tu cuenta de
              <span class="text-[var(--color-primary-300)]">huésped</span>.
            </h2>
            <p class="mt-4 text-white/75 max-w-md text-[15px] leading-relaxed">
              Reserva tu habitación, gestiona tus pagos y disfruta de beneficios exclusivos como
              cliente registrado.
            </p>
            <ul class="mt-8 space-y-3 text-[14px] text-white/80">
              <li class="flex items-center gap-3">
                <span class="text-[var(--color-primary-300)]">✓</span> Reservas más rápidas
              </li>
              <li class="flex items-center gap-3">
                <span class="text-[var(--color-primary-300)]">✓</span> Historial de estancias
              </li>
              <li class="flex items-center gap-3">
                <span class="text-[var(--color-primary-300)]">✓</span> Atención prioritaria
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <section class="flex items-center justify-center px-6 py-12 sm:px-12">
        <div class="w-full max-w-2xl">
          <header class="mb-8">
            <h1 class="text-3xl font-bold tracking-tight">Crear cuenta</h1>
            <p class="text-[15px] text-[var(--color-ink-muted)] mt-2">
              Completa tus datos para registrarte como huésped.
            </p>
          </header>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="space-y-5">
            <!-- Nombres -->
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label for="nombre" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                  Nombre <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input
                  id="nombre"
                  formControlName="nombre"
                  autocomplete="given-name"
                  [class]="cls(form.controls.nombre)"
                  placeholder="Juan"
                />
                @if (errorMsg('nombre'); as msg) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
                    {{ msg }}
                  </p>
                }
              </div>
              <div>
                <label
                  for="apellidoPaterno"
                  class="text-[13px] font-medium text-[var(--color-ink-soft)]"
                >
                  Apellido paterno <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input
                  id="apellidoPaterno"
                  formControlName="apellidoPaterno"
                  autocomplete="family-name"
                  [class]="cls(form.controls.apellidoPaterno)"
                  placeholder="Pérez"
                />
                @if (errorMsg('apellidoPaterno'); as msg) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
                    {{ msg }}
                  </p>
                }
              </div>
            </div>

            <div>
              <label
                for="apellidoMaterno"
                class="text-[13px] font-medium text-[var(--color-ink-soft)]"
              >
                Apellido materno
              </label>
              <input
                id="apellidoMaterno"
                formControlName="apellidoMaterno"
                [class]="cls(form.controls.apellidoMaterno)"
                placeholder="Quispe (opcional)"
              />
              @if (errorMsg('apellidoMaterno'); as msg) {
                <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
              }
            </div>

            <!-- Documento -->
            <div class="grid sm:grid-cols-[170px_1fr] gap-4">
              <div>
                <label
                  for="tipoDocumentoId"
                  class="text-[13px] font-medium text-[var(--color-ink-soft)]"
                >
                  Tipo de documento <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <select
                  id="tipoDocumentoId"
                  formControlName="tipoDocumentoId"
                  [class]="cls(form.controls.tipoDocumentoId)"
                  [attr.aria-busy]="loadingTypes() || null"
                >
                  <option [ngValue]="null" disabled>Selecciona</option>
                  @for (t of documentTypes(); track t.tipoDocumentoId) {
                    <option [ngValue]="t.tipoDocumentoId">{{ t.acronimo }}</option>
                  }
                </select>
                @if (errorMsg('tipoDocumentoId'); as msg) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
                    {{ msg }}
                  </p>
                }
              </div>
              <div>
                <label
                  for="numeroDocumento"
                  class="text-[13px] font-medium text-[var(--color-ink-soft)]"
                >
                  Número de documento <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input
                  id="numeroDocumento"
                  formControlName="numeroDocumento"
                  [class]="cls(form.controls.numeroDocumento)"
                  [placeholder]="documentPlaceholder()"
                  [maxlength]="20"
                  inputmode="text"
                />
                @if (errorMsg('numeroDocumento'); as msg) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
                    {{ msg }}
                  </p>
                }
              </div>
            </div>

            <!-- Correo + teléfono -->
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label for="correo" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                  Correo electrónico <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input
                  id="correo"
                  type="email"
                  formControlName="correo"
                  autocomplete="email"
                  [class]="cls(form.controls.correo)"
                  placeholder="nombre@correo.com"
                />
                @if (errorMsg('correo'); as msg) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
                    {{ msg }}
                  </p>
                }
              </div>
              <div>
                <label for="telefono" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                  Teléfono
                </label>
                <input
                  id="telefono"
                  type="tel"
                  formControlName="telefono"
                  autocomplete="tel"
                  [class]="cls(form.controls.telefono)"
                  placeholder="987 654 321"
                />
                @if (errorMsg('telefono'); as msg) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
                    {{ msg }}
                  </p>
                }
              </div>
            </div>

            <!-- Fecha + nacionalidad -->
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label
                  for="fechaNacimiento"
                  class="text-[13px] font-medium text-[var(--color-ink-soft)]"
                >
                  Fecha de nacimiento
                </label>
                <input
                  id="fechaNacimiento"
                  type="date"
                  formControlName="fechaNacimiento"
                  [max]="todayIso"
                  [class]="cls(form.controls.fechaNacimiento)"
                />
                @if (errorMsg('fechaNacimiento'); as msg) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
                    {{ msg }}
                  </p>
                }
              </div>
              <div>
                <label
                  for="nacionalidad"
                  class="text-[13px] font-medium text-[var(--color-ink-soft)]"
                >
                  Nacionalidad
                </label>
                <input
                  id="nacionalidad"
                  formControlName="nacionalidad"
                  [class]="cls(form.controls.nacionalidad)"
                  placeholder="Peruana"
                />
              </div>
            </div>

            <!-- Contraseñas -->
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label
                  for="contrasena"
                  class="text-[13px] font-medium text-[var(--color-ink-soft)]"
                >
                  Contraseña <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input
                  id="contrasena"
                  type="password"
                  formControlName="contrasena"
                  autocomplete="new-password"
                  [class]="cls(form.controls.contrasena)"
                  placeholder="Mín. 6 caracteres"
                />
                @if (errorMsg('contrasena'); as msg) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
                    {{ msg }}
                  </p>
                }
              </div>
              <div>
                <label
                  for="confirmarContrasena"
                  class="text-[13px] font-medium text-[var(--color-ink-soft)]"
                >
                  Confirmar contraseña <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input
                  id="confirmarContrasena"
                  type="password"
                  formControlName="confirmarContrasena"
                  autocomplete="new-password"
                  [class]="cls(form.controls.confirmarContrasena)"
                  placeholder="Repite la contraseña"
                />
                @if (showMismatch()) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
                    Las contraseñas no coinciden.
                  </p>
                }
              </div>
            </div>

            <p class="text-[12px] text-[var(--color-ink-muted)] leading-relaxed">
              Al crear tu cuenta aceptas nuestros
              <a
                routerLink="/home"
                fragment="contact"
                class="underline hover:text-[var(--color-primary-700)]"
                >términos</a
              >
              y la política de tratamiento de datos personales.
            </p>

            <ui-button type="submit" [block]="true" [loading]="loading()" [disabled]="form.invalid">
              Crear cuenta
            </ui-button>

            <p class="text-center text-[13px] text-[var(--color-ink-muted)]">
              ¿Ya tienes una cuenta?
              <a
                routerLink="/login"
                class="text-[var(--color-primary-700)] font-medium hover:underline"
              >
                Inicia sesión
              </a>
            </p>
          </form>
        </div>
      </section>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  readonly loading = signal(false);
  readonly loadingTypes = signal(true);
  readonly documentTypes = signal<readonly PublicDocumentType[]>([]);

  readonly todayIso = new Date().toISOString().split('T')[0];

  readonly form = this.fb.group(
    {
      nombre: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(80)]),
      apellidoPaterno: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.maxLength(80),
      ]),
      apellidoMaterno: this.fb.nonNullable.control('', [Validators.maxLength(80)]),
      tipoDocumentoId: this.fb.control<number | null>(null, [Validators.required]),
      numeroDocumento: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(20),
        Validators.pattern(/^[A-Za-z0-9]+$/),
      ]),
      correo: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.email,
        Validators.maxLength(150),
      ]),
      telefono: this.fb.nonNullable.control('', [
        Validators.maxLength(20),
        Validators.pattern(/^$|^[0-9+\-\s]{6,20}$/),
      ]),
      fechaNacimiento: this.fb.nonNullable.control(''),
      nacionalidad: this.fb.nonNullable.control('', [Validators.maxLength(60)]),
      contrasena: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(100),
      ]),
      confirmarContrasena: this.fb.nonNullable.control('', [Validators.required]),
    },
    { validators: passwordMatchValidator },
  );

  readonly showMismatch = computed(() => {
    const c = this.form.controls.confirmarContrasena;
    return this.form.hasError('passwordMismatch') && (c.dirty || c.touched);
  });

  readonly documentPlaceholder = computed(() => {
    const id = this.form.controls.tipoDocumentoId.value;
    const type = this.documentTypes().find((t) => t.tipoDocumentoId === id);
    if (!type) return 'Número de documento';
    if (type.acronimo === 'DNI') return '12345678';
    if (type.acronimo === 'CE') return 'CE123456';
    if (type.acronimo === 'PASS') return 'AB1234567';
    return type.nombre;
  });

  ngOnInit(): void {
    this.auth.getDocumentTypes().subscribe({
      next: (types) => {
        this.documentTypes.set(types);
        this.loadingTypes.set(false);
        const dni = types.find((t) => t.acronimo === 'DNI');
        if (dni) {
          this.form.controls.tipoDocumentoId.setValue(dni.tipoDocumentoId);
        }
      },
      error: () => {
        this.loadingTypes.set(false);
      },
    });
  }

  errorMsg(field: keyof typeof this.form.controls): string | null {
    const c = this.form.controls[field];
    if (!c.invalid || (!c.touched && !c.dirty)) return null;
    if (c.hasError('required')) return 'Este campo es obligatorio.';
    if (c.hasError('email')) return 'Ingresa un correo válido.';
    if (c.hasError('minlength')) {
      const e = c.getError('minlength') as { requiredLength: number };
      return `Mínimo ${e.requiredLength} caracteres.`;
    }
    if (c.hasError('maxlength')) {
      const e = c.getError('maxlength') as { requiredLength: number };
      return `Máximo ${e.requiredLength} caracteres.`;
    }
    if (c.hasError('pattern')) {
      if (field === 'numeroDocumento') return 'Solo letras y números, sin espacios.';
      if (field === 'telefono') return 'Teléfono inválido.';
      return 'Formato inválido.';
    }
    return 'Valor inválido.';
  }

  cls(control: AbstractControl | FormControl): string {
    const base =
      'w-full h-11 px-3.5 rounded-lg border bg-white text-[15px] placeholder:text-[var(--color-ink-muted)] focus:outline-none transition-all mt-1.5';
    const invalid = control.invalid && (control.touched || control.dirty);
    return invalid
      ? `${base} border-[var(--color-danger-500)] focus:ring-2 focus:ring-[var(--color-danger-500)]/30`
      : `${base} border-[var(--color-border-soft)] focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25`;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Revisa los campos marcados en rojo.');
      return;
    }

    const v = this.form.getRawValue();
    const payload: RegisterRequest = {
      nombre: v.nombre.trim(),
      apellidoPaterno: v.apellidoPaterno.trim(),
      apellidoMaterno: v.apellidoMaterno?.trim() || null,
      tipoDocumentoId: v.tipoDocumentoId as number,
      numeroDocumento: v.numeroDocumento.trim(),
      correo: v.correo.trim().toLowerCase(),
      telefono: v.telefono?.trim() || null,
      fechaNacimiento: v.fechaNacimiento || null,
      nacionalidad: v.nacionalidad?.trim() || null,
      contrasena: v.contrasena,
    };

    this.loading.set(true);
    this.auth.register(payload).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.toastr.success(`Bienvenido, ${user.nombre}. Tu cuenta fue creada.`);
        this.router.navigateByUrl('/dashboard');
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.loading.set(false);
        this.toastr.error(
          err.friendlyMessage ?? 'No pudimos completar tu registro.',
          'Error al registrar',
        );
      },
    });
  }
}
