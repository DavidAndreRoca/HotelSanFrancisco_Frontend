import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BookingApiService, BookingStateService } from '../../services/booking.service';
import { Step1SeleccionarComponent } from './steps/step1-seleccionar.component';
import { Step2DatosComponent } from './steps/step2-datos.component';
import { Step3ResumenComponent } from './steps/step3-resumen.component';
import { Step4PagoComponent } from './steps/step4-pago.component';
import { Step5ConfirmacionComponent } from './steps/step5-confirmacion.component';

const STEP_LABELS = ['Seleccionar', 'Datos', 'Resumen', 'Pago', 'Confirmación'];

@Component({
  selector: 'app-booking-flow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Step1SeleccionarComponent,
    Step2DatosComponent,
    Step3ResumenComponent,
    Step4PagoComponent,
    Step5ConfirmacionComponent,
  ],
  template: `
    <div class="min-h-screen bg-[#F9F5F0]">
      <!-- Header -->
      <header class="bg-white border-b border-[var(--color-border-soft)]">
        <div class="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded bg-[#C5A048] flex items-center justify-center">
              <span class="text-white font-bold text-sm">SF</span>
            </div>
            <span class="font-semibold text-[#2D2926] text-sm tracking-wide"
              >Hotel San Francisco</span
            >
          </div>
          <span class="text-[var(--color-border-soft)] select-none">|</span>
          <span class="text-sm text-[var(--color-ink-muted)]">Reserva en línea</span>
        </div>
      </header>

      <div class="max-w-5xl mx-auto px-4 py-8">
        <!-- Stepper -->
        @if (step() < 5) {
          <nav class="mb-10" aria-label="Pasos de reserva">
            <ol class="flex items-center">
              @for (label of stepLabels; track $index) {
                <li class="flex items-center flex-1 last:flex-none">
                  <div class="flex flex-col items-center">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors"
                      [class]="stepCircleClass($index + 1)"
                    >
                      @if ($index + 1 < step()) {
                        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      } @else {
                        {{ $index + 1 }}
                      }
                    </div>
                    <span
                      class="text-[11px] mt-1.5 font-medium whitespace-nowrap hidden sm:block"
                      [class]="stepLabelClass($index + 1)"
                    >
                      {{ label }}
                    </span>
                  </div>
                  @if ($index < stepLabels.length - 1) {
                    <div
                      class="h-px flex-1 mx-2 transition-colors"
                      [class]="
                        $index + 1 < step() ? 'bg-[#C5A048]' : 'bg-[var(--color-border-soft)]'
                      "
                    ></div>
                  }
                </li>
              }
            </ol>
          </nav>
        }

        <!-- Step content -->
        @switch (step()) {
          @case (1) {
            <app-step1-seleccionar (next)="goNext()" />
          }
          @case (2) {
            <app-step2-datos (next)="goNext()" (back)="goBack()" />
          }
          @case (3) {
            <app-step3-resumen (next)="goNext()" (back)="goBack()" />
          }
          @case (4) {
            <app-step4-pago (next)="goNext()" (back)="goBack()" (conflicto)="volverASeleccion()" />
          }
          @case (5) {
            <app-step5-confirmacion (restart)="restart()" />
          }
        }
      </div>
    </div>
  `,
})
export class BookingFlowPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly state = inject(BookingStateService);
  private readonly bookingApi = inject(BookingApiService);
  private readonly toastr = inject(ToastrService);

  readonly step = signal(1);
  readonly stepLabels = STEP_LABELS;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['checkIn'] && params['checkOut'] && params['guests']) {
      this.state.setSearch({
        checkIn: params['checkIn'],
        checkOut: params['checkOut'],
        guests: Number(params['guests']),
      });
    }
    if (params['pago']) {
      this.procesarRetornoPago(params['pago'], params['purchase'], params['msg']);
    }
  }

  /**
   * Retorno del checkout de Niubiz: el pago termina en una navegación completa
   * (POST del lightbox → backend → redirect aquí), así que el resultado llega
   * por query params y la confirmación se recupera del backend.
   */
  private procesarRetornoPago(resultado: string, purchase?: string, msg?: string): void {
    // Limpia los query params para que un F5 no reprocese el resultado.
    this.router.navigate([], { queryParams: {}, replaceUrl: true });

    if (resultado === 'exito' && purchase) {
      this.bookingApi.getConfirmacionPago(purchase).subscribe({
        next: (c) => {
          this.state.setConfirmacion(c);
          this.step.set(5);
          this.toastr.success('¡Pago confirmado! Su reserva está garantizada.');
        },
        error: () => {
          this.toastr.error(
            'El pago se procesó pero no se pudo cargar la confirmación. Revise su correo.',
          );
        },
      });
      return;
    }
    if (resultado === 'rechazado') {
      this.toastr.warning(
        msg ?? 'El pago no fue autorizado. Puede intentar nuevamente.',
        'Pago rechazado',
      );
      return;
    }
    if (resultado === 'timeout') {
      this.toastr.info('El tiempo para completar el pago expiró. Puede intentarlo nuevamente.');
      return;
    }
    if (resultado === 'error') {
      this.toastr.error(
        'No se pudo verificar el resultado del pago. No vuelva a intentar: el hotel le confirmará por correo.',
        'Verificación pendiente',
      );
    }
  }

  goNext(): void {
    this.step.update((s) => Math.min(s + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goBack(): void {
    this.step.update((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** La disponibilidad cambió (409 al reservar): volver al paso de selección. */
  volverASeleccion(): void {
    this.step.set(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  restart(): void {
    this.state.reset();
    this.router.navigate(['/home']);
  }

  stepCircleClass(n: number): string {
    if (n < this.step()) return 'bg-[#C5A048] border-[#C5A048] text-white';
    if (n === this.step()) return 'bg-white border-[#C5A048] text-[#C5A048]';
    return 'bg-white border-[var(--color-border-soft)] text-[var(--color-ink-muted)]';
  }

  stepLabelClass(n: number): string {
    if (n <= this.step()) return 'text-[#C5A048]';
    return 'text-[var(--color-ink-muted)]';
  }
}
