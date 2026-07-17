import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Output,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../../../environments/environment';
import { BookingApiService, BookingStateService } from '../../../services/booking.service';
import {
  BookingConfirmationResponse,
  CrearSesionPagoResponse,
} from '../../../models/booking.model';

/** API global que expone checkout.js de Niubiz una vez cargado. */
declare global {
  interface Window {
    VisanetCheckout?: {
      configure(config: Record<string, unknown>): void;
      open(): void;
    };
  }
}

@Component({
  selector: 'app-step4-pago',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-6 shadow-[var(--shadow-card)]">
        <h2 class="text-lg font-bold text-[#2D2926] mb-1">Pago seguro online</h2>
        <p class="text-[13px] text-[var(--color-ink-muted)] mb-6">
          Para garantizar su reserva se requiere el pago
          {{ state.tipoPago() === 'TOTAL' ? 'del total' : 'de un adelanto del 50%' }}.
        </p>

        <!-- Resumen del cobro -->
        <div class="p-5 rounded-xl border-2 border-[#C5A048] bg-[#FDF8EF] space-y-2">
          <div class="flex justify-between text-[14px]">
            <span class="text-[var(--color-ink-muted)]">Total de la reserva</span>
            <span class="font-medium">S/ {{ state.montoTotal() | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between text-[15px] font-bold text-[#C5A048] border-t border-[#EEE3D1] pt-2">
            <span>A pagar ahora</span>
            <span>S/ {{ state.adelanto() | number:'1.2-2' }}</span>
          </div>
          @if (state.montoPendiente() > 0) {
            <div class="flex justify-between text-[12px] text-[var(--color-ink-muted)]">
              <span>Saldo al llegar al hotel</span>
              <span>S/ {{ state.montoPendiente() | number:'1.2-2' }}</span>
            </div>
          }
        </div>

        <!-- Medios aceptados -->
        <div class="mt-5 flex items-center gap-2 text-[13px] text-[var(--color-ink-soft)]">
          <svg class="w-4 h-4 shrink-0 text-[#C5A048]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 10h18M7 15h2m2 0h2M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          Aceptamos tarjetas de crédito / débito (Visa, Mastercard, Amex, Diners) y Yape.
        </div>

        <div class="mt-3 flex items-center gap-2 text-[11px] text-[var(--color-ink-muted)]">
          <svg class="w-4 h-4 shrink-0 text-[#C5A048]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          Sus datos de pago se ingresan en el formulario seguro de Niubiz; nunca pasan por nuestros servidores.
        </div>
      </div>

      <!-- Nav -->
      <div class="flex justify-between">
        <button (click)="back.emit()" [disabled]="enviando()"
          class="px-6 h-10 border border-[var(--color-border-soft)] text-[var(--color-ink-muted)] rounded-lg text-[14px] hover:border-[#C5A048] hover:text-[#C5A048] transition-colors disabled:opacity-60">
          Anterior
        </button>
        <button (click)="pagar()" [disabled]="enviando()"
          class="px-8 h-10 bg-[#C5A048] hover:bg-[#b8923e] disabled:opacity-60 text-white font-semibold rounded-lg text-[14px] transition-colors">
          {{ enviando() ? 'Procesando...' : 'Pagar y confirmar' }}
        </button>
      </div>
    </div>
  `,
})
export class Step4PagoComponent {
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  /** La habitación ya no está disponible (409): volver al paso de búsqueda. */
  @Output() conflicto = new EventEmitter<void>();

  private readonly bookingApi = inject(BookingApiService);
  private readonly toastr = inject(ToastrService);
  readonly state = inject(BookingStateService);

  readonly enviando = signal(false);

  private scriptCargado: Promise<void> | null = null;
  private scriptUrl: string | null = null;

  pagar(): void {
    this.enviando.set(true);

    // Pre-reserva PENDIENTE (una sola vez) → sesión Niubiz → checkout.
    const pendiente = this.state.reservaPendiente();
    if (pendiente) {
      this.iniciarPago(pendiente.reservaId);
      return;
    }
    this.crearReserva((res) => {
      this.state.setReservaPendiente(res);
      this.iniciarPago(res.reservaId);
    });
  }

  private crearReserva(onOk: (res: BookingConfirmationResponse) => void): void {
    const hab = this.state.habitacionSeleccionada()!;
    const datos = this.state.datosHuesped()!;
    const params = this.state.searchParams()!;

    this.bookingApi.crearReserva({
      fechaInicio: params.checkIn,
      fechaFin: params.checkOut,
      habitacionId: hab.habitacionId,
      tipoHabitacionId: hab.tipoHabitacionId,
      numeroDocumento: datos.numeroDocumento,
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      telefono: datos.telefono,
      correo: datos.correo,
      nroAdultos: datos.nroAdultos,
      nroNinos: datos.nroNinos,
      serviciosAdicionales: datos.serviciosAdicionales,
      tipoPago: this.state.tipoPago(),
    }).subscribe({
      next: onOk,
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        if (err.status === 409) {
          this.toastr.warning(
            err.error?.message ?? 'La habitación ya no está disponible para las fechas seleccionadas.',
            'Disponibilidad',
          );
          this.conflicto.emit();
          return;
        }
        this.toastr.error(err.error?.message ?? 'Error al procesar la reserva. Intente nuevamente.');
      },
    });
  }

  private iniciarPago(reservaId: number): void {
    this.bookingApi.crearSesionPago(reservaId).subscribe({
      next: (sesion) => this.abrirCheckout(sesion),
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        if (err.status === 503) {
          this.toastr.error('El pago online no está disponible en este momento. Intente más tarde.');
          return;
        }
        this.toastr.error(err.error?.message ?? 'No se pudo iniciar el pago. Intente nuevamente.');
      },
    });
  }

  private abrirCheckout(sesion: CrearSesionPagoResponse): void {
    this.cargarScript(sesion.checkoutScriptUrl)
      .then(() => {
        const checkout = window.VisanetCheckout;
        if (!checkout) {
          this.enviando.set(false);
          this.toastr.error('No se pudo cargar el formulario de pago. Intente nuevamente.');
          return;
        }
        const datos = this.state.datosHuesped();
        checkout.configure({
          sessiontoken: sesion.sessionKey,
          channel: 'web',
          merchantid: sesion.merchantId,
          purchasenumber: sesion.purchaseNumber,
          amount: sesion.monto,
          expirationminutes: '15',
          timeouturl: `${window.location.origin}/booking?pago=timeout`,
          merchantlogo: '',
          formbuttoncolor: '#C5A048',
          // El checkout hace un POST clásico del transactionToken a esta URL:
          // el backend autoriza el cobro y redirige de vuelta a /booking con el
          // resultado en query params (la SPA pierde su estado en esa navegación).
          action: `${environment.apiUrl}/api/v1/booking/pago/retorno/${sesion.purchaseNumber}`,
          showamount: true,
          cardholdername: datos?.nombres ?? '',
          cardholderlastname: datos?.apellidos ?? '',
          cardholderemail: datos?.correo ?? '',
        });
        checkout.open();
        // Se libera el botón: si el usuario cierra el modal sin pagar puede
        // reintentar (se genera una nueva sesión; la anterior expira sola).
        this.enviando.set(false);
      })
      .catch(() => {
        this.enviando.set(false);
        this.toastr.error('No se pudo cargar el formulario de pago. Verifique su conexión.');
      });
  }

  private cargarScript(url: string): Promise<void> {
    if (this.scriptCargado && this.scriptUrl === url) {
      return this.scriptCargado;
    }
    this.scriptUrl = url;
    this.scriptCargado = new Promise<void>((resolve, reject) => {
      if (window.VisanetCheckout) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('checkout.js load error'));
      document.head.appendChild(script);
    });
    return this.scriptCargado;
  }
}
