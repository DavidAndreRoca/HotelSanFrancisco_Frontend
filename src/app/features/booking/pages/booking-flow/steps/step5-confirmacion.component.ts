import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { BookingStateService } from '../../../services/booking.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { AuthStore } from '../../../../../core/auth/auth.store';
import { BookingConfirmationResponse } from '../../../models/booking.model';

const INPUT_BASE = 'mt-1 w-full h-10 px-3.5 rounded-lg border bg-white text-sm focus:outline-none transition';
const INPUT_OK   = `${INPUT_BASE} border-[#EEE3D1] focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20`;
const INPUT_ERR  = `${INPUT_BASE} border-red-400 focus:ring-2 focus:ring-red-400/20`;

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const pwd  = group.get('contrasena')?.value as string;
  const conf = group.get('confirmar')?.value  as string;
  return pwd && conf && pwd !== conf ? { mismatch: true } : null;
}

@Component({
  selector: 'app-step5-confirmacion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, ReactiveFormsModule],
  template: `
    <div class="max-w-2xl mx-auto space-y-5">

      @if (state.confirmacion(); as c) {

        <!-- Confirmación -->
        <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-8 shadow-[var(--shadow-card)] text-center">
          <!-- Icono -->
          <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg class="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>

          <h2 class="text-2xl font-bold text-[#2D2926] mb-1">Reserva confirmada</h2>
          <p class="text-[var(--color-ink-muted)] text-sm mb-6">
            Recibirá un correo de confirmación en <strong>{{ c.huespedCorreo }}</strong>
          </p>

          <!-- Código -->
          <div class="bg-[#F9F5F0] rounded-xl px-6 py-4 mb-8 inline-block mx-auto">
            <p class="text-[11px] text-[var(--color-ink-muted)] uppercase tracking-widest mb-1">Código de reserva</p>
            <p class="text-3xl font-bold text-[#C5A048] tracking-widest">{{ c.codReserva }}</p>
          </div>

          <!-- Detalles -->
          <div class="text-left space-y-6">
            <section>
              <p class="text-[11px] font-semibold text-[#C5A048] uppercase tracking-widest mb-3">Habitación</p>
              <div class="grid grid-cols-2 gap-y-2 text-[14px]">
                <span class="text-[var(--color-ink-muted)]">Tipo</span>
                <span class="font-medium text-right">{{ c.tipoHabitacionNombre }}</span>
                <span class="text-[var(--color-ink-muted)]">Número</span>
                <span class="font-medium text-right">Hab. {{ c.habitacionNumero }} — Piso {{ c.habitacionPiso }}</span>
                <span class="text-[var(--color-ink-muted)]">Entrada</span>
                <span class="font-medium text-right">{{ c.fechaInicio }}</span>
                <span class="text-[var(--color-ink-muted)]">Salida</span>
                <span class="font-medium text-right">{{ c.fechaFin }}</span>
                <span class="text-[var(--color-ink-muted)]">Noches</span>
                <span class="font-medium text-right">{{ c.noches }}</span>
              </div>
            </section>

            <hr class="border-[var(--color-border-soft)]"/>

            <section>
              <p class="text-[11px] font-semibold text-[#C5A048] uppercase tracking-widest mb-3">Huésped</p>
              <div class="grid grid-cols-2 gap-y-2 text-[14px]">
                <span class="text-[var(--color-ink-muted)]">Nombre</span>
                <span class="font-medium text-right">{{ c.huespedNombres }} {{ c.huespedApellidos }}</span>
                <span class="text-[var(--color-ink-muted)]">Documento</span>
                <span class="font-medium text-right">{{ c.huespedDocumento }}</span>
              </div>
            </section>

            <hr class="border-[var(--color-border-soft)]"/>

            <section>
              <p class="text-[11px] font-semibold text-[#C5A048] uppercase tracking-widest mb-3">Resumen de pago</p>
              <div class="space-y-2 text-[14px]">
                <div class="flex justify-between">
                  <span class="text-[var(--color-ink-muted)]">
                    S/ {{ c.precioNoche | number:'1.2-2' }} × {{ c.noches }} noche{{ c.noches > 1 ? 's' : '' }}
                  </span>
                  <span>S/ {{ c.subtotal | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[var(--color-ink-muted)]">IGV (18%)</span>
                  <span>S/ {{ c.impuesto | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between font-bold border-t border-[var(--color-border-soft)] pt-2">
                  <span>Total</span>
                  <span>S/ {{ c.montoTotal | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between text-green-700 font-semibold">
                  <span>Pagado online (Niubiz)</span>
                  <span>S/ {{ c.adelanto | number:'1.2-2' }}</span>
                </div>
                @if (c.montoPendiente > 0) {
                  <div class="flex justify-between text-[var(--color-ink-muted)]">
                    <span>Pendiente al llegar</span>
                    <span>S/ {{ c.montoPendiente | number:'1.2-2' }}</span>
                  </div>
                }
              </div>
            </section>
          </div>

          <!-- Volver -->
          <div class="mt-8 flex justify-center">
            <button (click)="restart.emit()"
              class="px-6 h-10 border border-[var(--color-border-soft)] text-[var(--color-ink-muted)] rounded-lg text-[14px] hover:border-[#C5A048] hover:text-[#C5A048] transition-colors">
              Volver al inicio
            </button>
          </div>
        </div>

        <!-- Panel de registro opcional (solo si no autenticado y no omitido) -->
        @if (!authStore.isAuthenticated() && !omitido() && !registrado()) {
          <div class="rounded-2xl border-2 border-[#C5A048]/40 overflow-hidden
                      shadow-[0_4px_24px_-4px_rgba(197,160,72,0.18)]">

            <!-- Header dorado -->
            <div class="bg-gradient-to-r from-[#C5A048] to-[#8E6F2E] px-6 py-5 text-center relative overflow-hidden">
              <!-- Decoración -->
              <div class="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none"></div>
              <div class="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none"></div>

              <div class="relative">
                <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <h3 class="text-white font-bold text-base">Crea tu cuenta y gestiona tus reservas</h3>
                <p class="text-white/75 text-xs mt-1">Gratis · Solo toma unos segundos</p>
              </div>
            </div>

            <!-- Beneficios -->
            <div class="bg-[#FFF9F0] px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              @for (b of beneficios; track b) {
                <div class="flex items-center gap-2 text-[13px] text-[#2D2926]">
                  <svg class="w-4 h-4 shrink-0 text-[#C5A048]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ b }}
                </div>
              }
            </div>

            <!-- Formulario -->
            <div class="bg-white px-6 pb-6 pt-5">

              <!-- Email (prellenado, readonly) -->
              <div class="mb-4 p-3 rounded-lg bg-[#F9F5F0] border border-[#EEE3D1] flex items-center gap-2">
                <svg class="w-4 h-4 shrink-0 text-[#C5A048]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span class="text-sm text-[#2D2926] font-medium">{{ c.huespedCorreo }}</span>
                <span class="ml-auto text-[11px] text-[#8E6F2E] bg-[#EEE3D1] rounded px-1.5 py-0.5">Pre-llenado</span>
              </div>

              <form [formGroup]="registerForm" (ngSubmit)="registrar(c)" class="space-y-3">
                <!-- Contraseña -->
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Contraseña <span class="text-red-500">*</span>
                  </label>
                  <input type="password" formControlName="contrasena"
                         placeholder="Mínimo 8 caracteres"
                         [class]="ic('contrasena')">
                  @if (inv('contrasena')) {
                    <p class="text-[11px] text-red-600 mt-1">
                      @if (registerForm.get('contrasena')?.errors?.['required']) { La contraseña es obligatoria }
                      @else { Debe tener al menos 8 caracteres }
                    </p>
                  }
                </div>

                <!-- Confirmar contraseña -->
                <div>
                  <label class="text-[11px] uppercase tracking-wider font-semibold text-[#8E6F2E]">
                    Confirmar contraseña <span class="text-red-500">*</span>
                  </label>
                  <input type="password" formControlName="confirmar"
                         placeholder="Repite tu contraseña"
                         [class]="ic('confirmar')">
                  @if (inv('confirmar') || (registerForm.errors?.['mismatch'] && registerForm.get('confirmar')?.touched)) {
                    <p class="text-[11px] text-red-600 mt-1">Las contraseñas no coinciden</p>
                  }
                </div>

                <!-- Error general -->
                @if (registerError()) {
                  <p class="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {{ registerError() }}
                  </p>
                }

                <!-- Acciones -->
                <div class="flex flex-col sm:flex-row gap-2 pt-1">
                  <button type="submit" [disabled]="registrando()"
                    class="flex-1 h-10 rounded-xl text-sm font-bold text-white transition-colors
                           bg-[#C5A048] hover:bg-[#8E6F2E] disabled:opacity-60 disabled:cursor-not-allowed">
                    @if (registrando()) { Creando cuenta… } @else { Crear mi cuenta }
                  </button>
                  <button type="button" (click)="omitido.set(true)"
                    class="h-10 px-4 rounded-xl text-sm text-[#2D2926]/50 hover:text-[#2D2926] transition-colors">
                    Omitir por ahora
                  </button>
                </div>
              </form>
            </div>
          </div>
        }

        <!-- Éxito de registro -->
        @if (registrado()) {
          <div class="bg-green-50 border border-green-200 rounded-2xl px-6 py-5 flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <p class="text-[14px] font-semibold text-green-800">Cuenta creada exitosamente</p>
              <p class="text-[12px] text-green-600 mt-0.5">Ya puedes acceder al historial de tus reservas desde tu cuenta.</p>
            </div>
          </div>
        }

      } @else {
        <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-10 text-center">
          <p class="text-[var(--color-ink-muted)]">No hay datos de confirmación.</p>
        </div>
      }

    </div>
  `,
})
export class Step5ConfirmacionComponent {
  readonly restart      = output<void>();
  readonly state        = inject(BookingStateService);
  readonly authStore    = inject(AuthStore);

  private readonly authSvc  = inject(AuthService);
  private readonly fb       = inject(FormBuilder);
  private readonly toastr   = inject(ToastrService);

  readonly registrado     = signal(false);
  readonly omitido        = signal(false);
  readonly registerError  = signal<string | null>(null);
  readonly registrando    = signal(false);

  private tipoDocId = 1;

  protected readonly INPUT_OK = INPUT_OK;
  protected readonly INPUT_ERR = INPUT_ERR;

  readonly beneficios = [
    'Ver historial de reservas',
    'Modificar o cancelar reservas',
    'Recibir ofertas exclusivas',
    'Check-in exprés sin colas',
  ];

  readonly registerForm = this.fb.group(
    {
      contrasena: ['', [Validators.required, Validators.minLength(8)]],
      confirmar:  ['', Validators.required],
    },
    { validators: matchPasswords },
  );

  constructor() {
    this.authSvc.getDocumentTypes().pipe(takeUntilDestroyed()).subscribe(types => {
      if (types.length > 0) this.tipoDocId = types[0].tipoDocumentoId;
    });
  }

  inv(field: string): boolean {
    const c = this.registerForm.get(field);
    return !!(c?.invalid && c.touched);
  }

  ic(field: string): string {
    return this.inv(field) ? INPUT_ERR : INPUT_OK;
  }

  registrar(c: BookingConfirmationResponse): void {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.invalid) return;

    this.registrando.set(true);
    this.registerError.set(null);

    const nombres    = c.huespedNombres.trim().split(/\s+/);
    const apellidos  = c.huespedApellidos.trim().split(/\s+/);

    this.authSvc.register({
      nombre:           nombres[0],
      apellidoPaterno:  apellidos[0] ?? '',
      apellidoMaterno:  apellidos[1] ?? null,
      tipoDocumentoId:  this.tipoDocId,
      numeroDocumento:  c.huespedDocumento,
      correo:           c.huespedCorreo,
      telefono:         c.huespedTelefono || null,
      contrasena:       this.registerForm.value['contrasena']!,
    }).subscribe({
      next: () => {
        this.registrado.set(true);
        this.registrando.set(false);
        this.toastr.success('¡Cuenta creada! Ya puedes gestionar tus reservas.');
      },
      error: (err: { friendlyMessage?: string }) => {
        this.registerError.set(err.friendlyMessage ?? 'No se pudo crear la cuenta. Intenta de nuevo.');
        this.registrando.set(false);
      },
    });
  }
}
