import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnChanges,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiModalComponent } from '../../../../shared/ui/modal/ui-modal.component';
import { PaymentService } from '../../services/payment.service';
import {
  MetodoPago,
  Payment,
  PaymentCreatePayload,
  ReservaPagoContext,
  TipoPago,
} from '../../models/payment.model';

@Component({
  selector: 'app-payment-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, UiButtonComponent, UiModalComponent],
  template: `
    <ui-modal
      [open]="open()"
      [title]="title()"
      [subtitle]="subtitle()"
      size="lg"
      (closed)="closed.emit()">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate id="payment-form" class="space-y-4">
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label for="tipoPago" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Tipo de pago <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <select
              id="tipoPago"
              formControlName="tipoPago"
              class="mt-1.5 w-full h-11 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
              <option value="ANTICIPO">Anticipo (50%)</option>
              <option value="SALDO">Saldo</option>
              <option value="TOTAL">Pago total</option>
              <option value="REEMBOLSO">Reembolso</option>
            </select>
          </div>

          <div>
            <label for="metodoPagoId" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Método de pago <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <select
              id="metodoPagoId"
              formControlName="metodoPagoId"
              class="mt-1.5 w-full h-11 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
              <option [ngValue]="null" disabled>Selecciona un método</option>
              @for (m of metodos(); track m.metodoPagoId) {
                <option [ngValue]="m.metodoPagoId">{{ m.nombre }}</option>
              }
            </select>
          </div>
        </div>

        <div>
          <label for="monto" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
            Monto <span class="text-[var(--color-danger-500)]">*</span>
          </label>
          <div class="relative mt-1.5">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] text-[13px]">S/</span>
            <input
              id="monto"
              type="number"
              step="0.01"
              min="0"
              formControlName="monto"
              [class]="inputCls()"
              placeholder="0.00" />
          </div>

          @if (montoErrorMsg(); as msg) {
            <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
          }

          @if (context() && form.controls.tipoPago.value === 'ANTICIPO') {
            <p class="text-xs text-[var(--color-ink-muted)] mt-1.5">
              Sugerencia: anticipo del 50% es
              <button type="button" class="font-semibold text-[var(--color-primary-700)] hover:underline" (click)="aplicarSugerenciaAdelanto()">
                S/ {{ sugerenciaAdelanto().toFixed(2) }}
              </button>
            </p>
          }

          @if (context()) {
            <p class="text-xs text-[var(--color-ink-muted)] mt-1">
              Monto total de la reserva: S/ {{ context()!.montoTotal.toFixed(2) }}
              @if (context()!.adelanto > 0) {
                · Adelanto ya registrado: S/ {{ context()!.adelanto.toFixed(2) }}
              }
              @if (saldoPendiente() !== null) {
                · Saldo pendiente:
                <button type="button"
                  class="font-semibold text-[var(--color-primary-700)] hover:underline"
                  title="Usar el saldo pendiente como monto"
                  (click)="aplicarSaldoPendiente()">
                  S/ {{ saldoPendiente()!.toFixed(2) }}
                </button>
              }
            </p>
          }
        </div>

        @if (requiereComprobante()) {
          <div>
            <label for="comprobante" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Comprobante <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <input
              id="comprobante"
              type="text"
              formControlName="comprobante"
              maxlength="100"
              placeholder="N° de operación, voucher, boleta, etc."
              class="mt-1.5 w-full h-11 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
            <p class="text-xs text-[var(--color-ink-muted)] mt-1.5">
              El método seleccionado requiere comprobante.
            </p>
          </div>
        }
      </form>

      <ng-container modal-footer>
        <ui-button variant="ghost" (click)="closed.emit()">Cancelar</ui-button>
        <ui-button
          type="submit"
          variant="primary"
          [loading]="saving()"
          [disabled]="form.invalid"
          (click)="submit()">
          {{ payment() ? 'Guardar cambios' : 'Registrar pago' }}
        </ui-button>
      </ng-container>
    </ui-modal>
  `,
})
export class PaymentModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);

  readonly open = input.required<boolean>();
  readonly payment = input<Payment | null>(null);
  readonly context = input<ReservaPagoContext | null>(null);
  readonly metodos = input<MetodoPago[]>([]);
  readonly saving = input<boolean>(false);

  readonly closed = output<void>();
  readonly save = output<{ payload: PaymentCreatePayload; id?: number }>();

  readonly form = this.fb.group({
    tipoPago: this.fb.nonNullable.control<TipoPago>('ANTICIPO', Validators.required),
    metodoPagoId: this.fb.control<number | null>(null, Validators.required),
    monto: this.fb.nonNullable.control<number>(0, [Validators.required, Validators.min(0.01)]),
    comprobante: this.fb.control<string | null>(null),
  });

  readonly title = computed(() => (this.payment() ? 'Editar pago' : 'Registrar pago'));
  readonly subtitle = computed(() => {
    const ctx = this.context();
    return ctx ? `Reserva ${ctx.codReserva} · Total S/ ${ctx.montoTotal.toFixed(2)}` : '';
  });

  readonly sugerenciaAdelanto = computed(() => {
    const ctx = this.context();
    if (!ctx) return 0;
    return this.paymentService.calcularAdelanto(ctx.montoTotal, 50).montoAdelanto;
  });

  readonly requiereComprobante = computed(() => {
    const id = this.form.controls.metodoPagoId.value;
    return this.metodos().find((m) => m.metodoPagoId === id)?.requiereComprobante ?? false;
  });

  readonly montoError = signal<string | null>(null);

  // Suma de pagos previos de la reserva (sin reembolsos). null = aún no cargada,
  // en ese caso se usa ctx.adelanto como aproximación.
  private readonly pagosPrevios = signal<number | null>(null);
  private pagosCargadosDeReserva: number | null = null;

  /** Saldo pendiente de la reserva; null si no hay contexto. */
  readonly saldoPendiente = computed(() => {
    const ctx = this.context();
    if (!ctx) return null;
    const pagado = this.pagosPrevios() ?? ctx.adelanto;
    return Math.max(0, Math.round((ctx.montoTotal - pagado) * 100) / 100);
  });

  ngOnChanges(): void {
    this.cargarPagosPrevios();
    const p = this.payment();
    if (p) {
      this.form.patchValue({
        tipoPago: p.tipoPago,
        metodoPagoId: p.metodoPagoId,
        monto: p.monto,
        comprobante: p.comprobante,
      });
    } else {
      this.form.reset({
        tipoPago: 'ANTICIPO',
        metodoPagoId: null,
        monto: this.context() ? this.sugerenciaAdelanto() : 0,
        comprobante: null,
      });
    }
    this.montoError.set(null);
  }

  aplicarSugerenciaAdelanto(): void {
    this.form.controls.monto.setValue(this.sugerenciaAdelanto());
    this.validarMonto();
  }

  aplicarSaldoPendiente(): void {
    const saldo = this.saldoPendiente();
    if (saldo === null) return;
    this.form.controls.monto.setValue(saldo);
    this.validarMonto();
  }

  montoErrorMsg(): string | null {
    return this.montoError();
  }

  inputCls(): string {
    const base =
      'w-full h-11 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]';
    return this.montoError()
      ? `${base} border-[var(--color-danger-500)]`
      : `${base} border-[var(--color-border-soft)]`;
  }

  /** Trae los pagos reales de la reserva para calcular el saldo como lo hace el backend. */
  private cargarPagosPrevios(): void {
    const ctx = this.context();
    if (!this.open() || !ctx) {
      this.pagosPrevios.set(null);
      this.pagosCargadosDeReserva = null;
      return;
    }
    if (this.pagosCargadosDeReserva === ctx.reservaId) return;
    this.pagosCargadosDeReserva = ctx.reservaId;
    this.pagosPrevios.set(null);
    this.paymentService.findByReserva(ctx.reservaId).subscribe({
      next: (pagos) => {
        const editandoId = this.payment()?.pagoId ?? null;
        const total = pagos
          .filter((p) => p.tipoPago !== 'REEMBOLSO' && p.pagoId !== editandoId)
          .reduce((s, p) => s + p.monto, 0);
        this.pagosPrevios.set(Math.round(total * 100) / 100);
      },
      // Si falla, se queda en null y validarMonto usa ctx.adelanto como respaldo.
      error: () => this.pagosPrevios.set(null),
    });
  }

  private validarMonto(): boolean {
    const monto = Number(this.form.controls.monto.value);
    // Un reembolso devuelve dinero; el tope de saldo pendiente no aplica.
    if (this.form.controls.tipoPago.value === 'REEMBOLSO') {
      const error = this.paymentService.validarMonto(monto, Number.POSITIVE_INFINITY);
      this.montoError.set(error);
      return !error;
    }
    const saldo = this.saldoPendiente() ?? Number.POSITIVE_INFINITY;
    const error = this.paymentService.validarMonto(monto, saldo);
    this.montoError.set(error);
    return !error;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.requiereComprobante() && !this.form.controls.comprobante.value) {
      this.form.controls.comprobante.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }
    if (!this.validarMonto()) return;

    const ctx = this.context();
    const value = this.form.getRawValue();
    const payload: PaymentCreatePayload = {
      metodoPagoId: value.metodoPagoId!,
      monto: value.monto,
      tipoPago: value.tipoPago,
      comprobante: value.comprobante || null,
      reservaId: ctx?.reservaId ?? this.payment()?.reservaId ?? null,
    };

    this.save.emit({ payload, id: this.payment()?.pagoId });
  }
}
