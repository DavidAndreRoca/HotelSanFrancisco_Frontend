import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { ReniecPersona, ReniecService } from '../../../core/reniec/reniec.service';

type Estado = 'idle' | 'loading' | 'ok' | 'error';

/**
 * Botón "Buscar por DNI" + autollenado vía RENIEC.
 * - Dispara automáticamente al completar 8 dígitos numéricos (debounce 500ms).
 * - Botón manual como respaldo (reintentos tras un fallo).
 * - Nunca bloquea el formulario: si falla, muestra el mensaje y se escribe a mano.
 */
@Component({
  selector: 'app-dni-lookup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (enabled()) {
      <div class="flex items-center flex-wrap gap-2 mt-1.5">
        <button
          type="button"
          (click)="buscar()"
          [disabled]="estado() === 'loading' || !valido()"
          class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--color-border-soft)] text-[12px] font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-700)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          @if (estado() === 'loading') {
            <span class="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden="true"></span>
          }
          Buscar por DNI
        </button>

        @if (estado() === 'ok') {
          <span class="text-[12px] text-[var(--color-success-500)]">✓ {{ mensaje() }}</span>
        } @else if (estado() === 'error') {
          <span class="text-[12px] text-[var(--color-ink-muted)]">{{ mensaje() }}</span>
        }
      </div>
    }
  `,
})
export class DniLookupComponent {
  private readonly reniec = inject(ReniecService);

  /** Valor actual del campo de documento. */
  readonly dni = input<string>('');
  /** Solo aplica para DNI (8 dígitos). Para CE/Pasaporte va en false. */
  readonly enabled = input<boolean>(true);

  /** Emite los datos cuando RENIEC los encuentra. */
  readonly found = output<ReniecPersona>();

  readonly estado = signal<Estado>('idle');
  readonly mensaje = signal('');

  readonly valido = computed(() => /^\d{8}$/.test(this.dni().trim()));

  constructor() {
    // Disparo automático: solo cuando hay exactamente 8 dígitos y está habilitado.
    const autoDni = computed(() => (this.enabled() && this.valido() ? this.dni().trim() : ''));

    toObservable(autoDni)
      .pipe(
        debounceTime(500),
        filter((d) => d.length === 8),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((d) => this.ejecutar(d));
  }

  buscar(): void {
    if (this.valido()) this.ejecutar(this.dni().trim());
  }

  private ejecutar(dni: string): void {
    this.estado.set('loading');
    this.mensaje.set('');
    this.reniec.consultarDni(dni).subscribe({
      next: (persona) => {
        this.estado.set('ok');
        this.mensaje.set('Datos encontrados en RENIEC.');
        this.found.emit(persona);
      },
      error: (err: { friendlyMessage?: string }) => {
        this.estado.set('error');
        this.mensaje.set(
          err.friendlyMessage ?? 'No se pudo consultar el DNI. Ingresa tus datos manualmente.',
        );
      },
    });
  }
}
