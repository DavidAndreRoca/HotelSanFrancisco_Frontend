import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { PerfilUsuarioResponse } from '../../../../core/auth/auth-user.interface';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';

@Component({
  selector: 'app-mi-cuenta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, UiButtonComponent],
  template: `
    <div class="space-y-6">

      <!-- ── Tarjeta: cabecera de perfil ─────────────────────────── -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-6 flex items-center gap-5">
        <!-- Avatar con iniciales -->
        <div
          class="w-16 h-16 rounded-full bg-[#C5A048] flex items-center justify-center
                 text-white font-bold text-xl shrink-0 select-none"
          aria-hidden="true">
          {{ initials() }}
        </div>

        <!-- Datos básicos -->
        <div class="min-w-0">
          @if (loading()) {
            <div class="h-5 w-40 bg-[#EEE3D1] rounded animate-pulse mb-2"></div>
            <div class="h-4 w-52 bg-[#EEE3D1] rounded animate-pulse mb-1.5"></div>
            <div class="h-4 w-36 bg-[#EEE3D1] rounded animate-pulse"></div>
          } @else {
            <p class="text-xl font-bold text-[#2D2926] truncate">
              {{ perfil()?.nombreCompleto ?? '—' }}
            </p>
            <p class="text-sm text-[#2D2926]/55 mt-0.5 truncate">
              {{ perfil()?.correo }}
            </p>
            <p class="text-sm text-[#2D2926]/55 mt-0.5">
              Miembro desde {{ memberSince() }}
            </p>
          }
        </div>
      </div>

      <!-- ── Tarjeta: información personal ───────────────────────── -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-6">
        <h2 class="text-lg font-bold text-[#2D2926] mb-6">Información personal</h2>

        @if (loading()) {
          <!-- Skeleton grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mb-6">
            @for (_ of [1,2,3,4]; track _) {
              <div>
                <div class="h-3 w-24 bg-[#EEE3D1] rounded animate-pulse mb-3"></div>
                <div class="h-10 bg-[#EEE3D1] rounded-lg animate-pulse"></div>
              </div>
            }
          </div>
          <div class="h-3 w-20 bg-[#EEE3D1] rounded animate-pulse mb-3"></div>
          <div class="h-10 bg-[#EEE3D1] rounded animate-pulse mb-6"></div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

            <!-- Grid 2 columnas -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mb-6">

              <!-- Nombre Completo (solo lectura) -->
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-4 h-4 text-[#C5A048] shrink-0" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span class="text-sm font-semibold text-[#2D2926]">Nombre Completo</span>
                </div>
                <p class="text-[15px] text-[#2D2926]/65 pl-6">
                  {{ perfil()?.nombreCompleto ?? '—' }}
                </p>
              </div>

              <!-- DNI / Documento (solo lectura) -->
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-4 h-4 text-[#C5A048] shrink-0" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2"/>
                    <path stroke-linecap="round" d="M7 9h5M7 13h3"/>
                  </svg>
                  <span class="text-sm font-semibold text-[#2D2926]">
                    {{ perfil()?.tipoDocumentoAcronimo ?? 'DNI' }} / Documento
                  </span>
                </div>
                <p class="text-[15px] text-[#2D2926]/65 pl-6">
                  {{ perfil()?.numeroDocumento ?? '—' }}
                </p>
              </div>

              <!-- Correo electrónico (deshabilitado — requiere flujo de verificación) -->
              <div>
                <label for="correo"
                       class="flex items-center gap-2 mb-2 text-sm font-semibold text-[#2D2926]">
                  <svg class="w-4 h-4 text-[#C5A048] shrink-0" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  Correo electrónico
                </label>
                <input
                  id="correo"
                  type="email"
                  [value]="perfil()?.correo ?? ''"
                  disabled
                  class="w-full h-11 px-3.5 rounded-lg border border-[#EEE3D1] bg-[#F9F5F0]
                         text-[15px] text-[#2D2926]/50 cursor-not-allowed outline-none" />
              </div>

              <!-- Teléfono (editable) -->
              <div>
                <label for="telefono"
                       class="flex items-center gap-2 mb-2 text-sm font-semibold text-[#2D2926]">
                  <svg class="w-4 h-4 text-[#C5A048] shrink-0" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  Teléfono
                </label>
                <input
                  id="telefono"
                  type="tel"
                  formControlName="telefono"
                  placeholder="+51 999 999 999"
                  autocomplete="tel"
                  [class]="fieldClass(showError('telefono'))" />
                @if (showError('telefono')) {
                  <p class="text-xs text-red-500 mt-1.5" role="alert">
                    Máximo 20 caracteres.
                  </p>
                }
              </div>

            </div>

            <!-- Dirección (ancho completo, estilo solo borde inferior) -->
            <div class="mb-8">
              <label for="direccion"
                     class="flex items-center gap-2 mb-2 text-sm font-semibold text-[#2D2926]">
                <svg class="w-4 h-4 text-[#C5A048] shrink-0" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Dirección
              </label>
              <input
                id="direccion"
                type="text"
                formControlName="direccion"
                placeholder="Av. San Martín 123"
                autocomplete="street-address"
                class="w-full border-0 border-b border-[#2D2926]/20 bg-transparent py-2
                       text-[15px] text-[#2D2926] placeholder:text-[#2D2926]/35
                       focus:outline-none focus:border-[#C5A048] transition-colors" />
            </div>

            <!-- Botón guardar -->
            <div class="flex justify-end">
              <ui-button
                type="submit"
                size="md"
                [loading]="saving()"
                [disabled]="form.pristine || form.invalid">
                Guardar cambios
              </ui-button>
            </div>

          </form>
        }
      </div>

    </div>
  `,
})
export class MiCuentaPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly store = inject(AuthStore);
  private readonly toastr = inject(ToastrService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly perfil = signal<PerfilUsuarioResponse | null>(null);

  readonly initials = computed(() => {
    const p = this.perfil();
    const u = this.store.user();
    const n = p?.nombre ?? u?.nombre ?? '';
    const a = p?.apellidoPaterno ?? u?.apellidoPaterno ?? '';
    return `${n[0] ?? ''}${a[0] ?? ''}`.toUpperCase() || '··';
  });

  readonly memberSince = computed(() => {
    const fecha = this.perfil()?.fechaCreacion;
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  });

  readonly form = this.fb.nonNullable.group({
    telefono: ['', [Validators.maxLength(20)]],
    direccion: ['', [Validators.maxLength(200)]],
  });

  constructor() {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.auth
      .getMyProfile()
      .pipe(
        catchError(() => {
          // GET /auth/me/perfil aún no existe: usa datos básicos del store como fallback
          const u = this.store.user();
          return of(
            u
              ? ({
                  usuarioId: u.usuarioId,
                  nombre: u.nombre,
                  apellidoPaterno: u.apellidoPaterno,
                  apellidoMaterno: u.apellidoMaterno,
                  nombreCompleto: u.nombreCompleto,
                  correo: u.correo,
                  rol: u.rol,
                  permisos: u.permisos,
                } as PerfilUsuarioResponse)
              : null,
          );
        }),
      )
      .subscribe((perfil) => {
        this.loading.set(false);
        if (!perfil) return;
        this.perfil.set(perfil);
        this.form.patchValue({
          telefono: perfil.telefono ?? '',
          direccion: perfil.direccion ?? '',
        });
        this.form.markAsPristine();
      });
  }

  showError(field: 'telefono' | 'direccion'): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || c.dirty);
  }

  fieldClass(invalid: boolean): string {
    const base =
      'w-full h-11 px-3.5 rounded-lg border text-[15px] bg-white ' +
      'placeholder:text-[#2D2926]/35 transition-all focus:outline-none focus:ring-2';
    return invalid
      ? `${base} border-red-400 focus:ring-red-400/20`
      : `${base} border-[#EEE3D1] focus:border-[#C5A048] focus:ring-[#C5A048]/20`;
  }

  onSubmit(): void {
    if (this.form.invalid || this.form.pristine) return;

    const { telefono, direccion } = this.form.getRawValue();
    this.saving.set(true);

    this.auth.updateMyProfile({ telefono, direccion }).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.perfil.set(updated);
        this.form.markAsPristine();
        this.toastr.success('Perfil actualizado correctamente.');
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.saving.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo guardar los cambios.', 'Error');
      },
    });
  }
}
