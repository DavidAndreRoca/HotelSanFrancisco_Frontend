import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { BookingApiService, BookingStateService } from '../../../services/booking.service';
import { MetodoPagoPublico } from '../../../models/booking.model';

@Component({
  selector: 'app-step4-pago',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-6 shadow-[var(--shadow-card)]">
        <h2 class="text-lg font-bold text-[#2D2926] mb-1">Método de pago</h2>
        <p class="text-[13px] text-[var(--color-ink-muted)] mb-6">
          Monto a pagar ahora:
          <strong class="text-[#C5A048] text-[16px]">S/ {{ state.adelanto() | number:'1.2-2' }}</strong>
        </p>

        @if (cargando()) {
          <div class="space-y-3">
            @for (i of [1,2,3,4]; track i) {
              <div class="h-14 bg-gray-100 rounded-xl animate-pulse"></div>
            }
          </div>
        } @else {
          <div class="space-y-3">
            @for (m of metodos(); track m.metodoPagoId) {
              <label class="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors"
                [class]="metodoPagoSeleccionado() === m.metodoPagoId
                  ? 'border-[#C5A048] bg-[#FDF8EF]'
                  : 'border-[var(--color-border-soft)] hover:border-[#C5A048]'">
                <input type="radio" name="metodoPago" [value]="m.metodoPagoId"
                  [checked]="metodoPagoSeleccionado() === m.metodoPagoId"
                  (change)="seleccionarMetodo(m)"
                  class="accent-[#C5A048]" />
                <span class="font-medium text-[#2D2926] text-[14px]">{{ m.nombre }}</span>
              </label>
            }
          </div>
        }

        <!-- Formulario tarjeta (solo si método es tarjeta) -->
        @if (mostrarFormTarjeta()) {
          <div class="mt-6 p-5 bg-[#F9F5F0] rounded-xl space-y-4">
            <p class="text-[13px] font-semibold text-[var(--color-ink-soft)] mb-1">Datos de la tarjeta</p>
            <form [formGroup]="cardForm" class="space-y-4" novalidate>
              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Número de tarjeta <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input type="text" formControlName="numeroTarjeta"
                  placeholder="1234 5678 9012 3456"
                  maxlength="19"
                  [class]="cardInputClass('numeroTarjeta')" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                    Vencimiento <span class="text-[var(--color-danger-500)]">*</span>
                  </label>
                  <input type="text" formControlName="vencimiento"
                    placeholder="MM/AA"
                    maxlength="5"
                    [class]="cardInputClass('vencimiento')" />
                </div>
                <div>
                  <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                    CVV <span class="text-[var(--color-danger-500)]">*</span>
                  </label>
                  <input type="password" formControlName="cvv"
                    placeholder="123"
                    maxlength="4"
                    [class]="cardInputClass('cvv')" />
                </div>
              </div>
              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Titular <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input type="text" formControlName="titular"
                  placeholder="Nombre como aparece en la tarjeta"
                  [class]="cardInputClass('titular')" />
              </div>
            </form>
            <p class="text-[11px] text-[var(--color-ink-muted)]">
              Los datos de tarjeta son procesados de forma segura. No los almacenamos en nuestros servidores.
            </p>
          </div>
        }
      </div>

      <!-- Nav -->
      <div class="flex justify-between">
        <button (click)="back.emit()" [disabled]="enviando()"
          class="px-6 h-10 border border-[var(--color-border-soft)] text-[var(--color-ink-muted)] rounded-lg text-[14px] hover:border-[#C5A048] hover:text-[#C5A048] transition-colors disabled:opacity-60">
          Anterior
        </button>
        <button (click)="confirmar()" [disabled]="enviando()"
          class="px-8 h-10 bg-[#C5A048] hover:bg-[#b8923e] disabled:opacity-60 text-white font-semibold rounded-lg text-[14px] transition-colors">
          {{ enviando() ? 'Procesando...' : 'Confirmar reserva' }}
        </button>
      </div>
    </div>
  `,
})
export class Step4PagoComponent implements OnInit {
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  /** La habitación ya no está disponible (409): volver al paso de búsqueda. */
  @Output() conflicto = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly bookingApi = inject(BookingApiService);
  private readonly toastr = inject(ToastrService);
  readonly state = inject(BookingStateService);

  readonly metodos = signal<MetodoPagoPublico[]>([]);
  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly metodoPagoSeleccionado = signal<number | null>(null);
  readonly mostrarFormTarjeta = signal(false);

  readonly cardForm = this.fb.nonNullable.group({
    numeroTarjeta: ['', Validators.required],
    vencimiento: ['', Validators.required],
    cvv: ['', Validators.required],
    titular: ['', Validators.required],
  });

  ngOnInit(): void {
    const existente = this.state.metodoPagoId();
    if (existente) this.metodoPagoSeleccionado.set(existente);

    this.bookingApi.findMetodosPago().subscribe({
      next: (res) => {
        this.metodos.set(res);
        this.cargando.set(false);
        if (existente) {
          const m = res.find((x) => x.metodoPagoId === existente);
          if (m) this.checkTarjeta(m);
        }
      },
      error: () => {
        this.cargando.set(false);
        this.toastr.error('No se pudieron cargar los métodos de pago.');
      },
    });
  }

  seleccionarMetodo(m: MetodoPagoPublico): void {
    this.metodoPagoSeleccionado.set(m.metodoPagoId);
    this.state.setMetodoPago(m.metodoPagoId);
    this.checkTarjeta(m);
  }

  private checkTarjeta(m: MetodoPagoPublico): void {
    this.mostrarFormTarjeta.set(m.nombre.toLowerCase().includes('tarjeta'));
  }

  cardInputClass(field: string): string {
    const ctrl = this.cardForm.get(field);
    const invalid = ctrl?.invalid && ctrl.touched;
    return `w-full h-10 px-3.5 rounded-lg border text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A048] ${
      invalid ? 'border-[var(--color-danger-500)]' : 'border-[var(--color-border-soft)]'
    }`;
  }

  confirmar(): void {
    if (!this.metodoPagoSeleccionado()) {
      this.toastr.warning('Selecciona un método de pago.');
      return;
    }
    if (this.mostrarFormTarjeta() && this.cardForm.invalid) {
      this.cardForm.markAllAsTouched();
      this.toastr.warning('Completa los datos de la tarjeta.');
      return;
    }

    const hab = this.state.habitacionSeleccionada()!;
    const datos = this.state.datosHuesped()!;
    const params = this.state.searchParams()!;

    this.enviando.set(true);
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
      metodoPagoId: this.metodoPagoSeleccionado()!,
    }).subscribe({
      next: (res) => {
        this.state.setConfirmacion(res);
        this.enviando.set(false);
        this.next.emit();
      },
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
}
