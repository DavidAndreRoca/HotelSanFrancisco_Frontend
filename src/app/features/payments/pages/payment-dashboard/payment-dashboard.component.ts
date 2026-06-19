// features/payments/pages/payments-dashboard/payments-dashboard.component.ts
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { PaymentService } from '../../services/payment.service';
import { PaymentStatsComponent } from '../../components/payment-stats/payment-stats.component';
import { PaymentFiltersComponent } from '../../components/payment-filters/payment-filters.component';
import { PaymentTableComponent } from '../../components/payment-table/payment-table.component';
import { PaymentModalComponent } from '../../components/payment-modal/payment-modal.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import {
  DEFAULT_PAYMENT_FILTERS,
  Payment,
  PaymentCreatePayload,
  PaymentFilters,
  ReservaPagoContext,
} from '../../models/payment.model';

@Component({
  selector: 'app-payments-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PaymentStatsComponent,
    PaymentFiltersComponent,
    PaymentTableComponent,
    PaymentModalComponent,
    UiButtonComponent,
  ],
  template: `
    <div class="space-y-6">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Pagos</h1>
          <p class="text-[13px] text-[var(--color-ink-muted)] mt-1">
            Historial de pagos, anticipos y reembolsos asociados a reservas y ventas.
          </p>
        </div>
        <ui-button variant="primary" (click)="openCreateModal()">
          Registrar pago
        </ui-button>
      </header>

      <app-payment-stats [items]="paymentService.items()" />

      <app-payment-filters
        [metodos]="paymentService.metodosActivos()"
        (filtersChange)="onFiltersChange($event)" />

      <app-payment-table
        [items]="paymentService.items()"
        [loading]="paymentService.loading()"
        (edit)="openEditModal($event)"
        (remove)="confirmDelete($event)" />

      @if (paymentService.page(); as page) {
        <div class="flex items-center justify-between text-[13px] text-[var(--color-ink-muted)]">
          <span>
            Mostrando {{ paymentService.items().length }} de {{ page.totalElements }} pagos
          </span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border border-[var(--color-border-soft)] disabled:opacity-50"
              [disabled]="page.first"
              (click)="changePage(filters().page - 1)">
              Anterior
            </button>
            <span>Página {{ page.page + 1 }} de {{ page.totalPages || 1 }}</span>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border border-[var(--color-border-soft)] disabled:opacity-50"
              [disabled]="page.last"
              (click)="changePage(filters().page + 1)">
              Siguiente
            </button>
          </div>
        </div>
      }

      @if (paymentService.lastError()) {
        <div class="rounded-xl bg-[var(--color-danger-500)]/10 border border-[var(--color-danger-500)]/20 px-4 py-3 text-[13px] text-[var(--color-danger-500)]">
          {{ paymentService.lastError() }}
        </div>
      }
    </div>

    <app-payment-modal
      [open]="modalOpen()"
      [payment]="selectedPayment()"
      [context]="modalContext()"
      [metodos]="paymentService.metodosActivos()"
      [saving]="saving()"
      (closed)="closeModal()"
      (save)="onSave($event)" />
  `,
})
export class PaymentsDashboardComponent implements OnInit {
  readonly paymentService = inject(PaymentService);
  private readonly toastr = inject(ToastrService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly filters = signal<PaymentFilters>({ ...DEFAULT_PAYMENT_FILTERS });
  readonly modalOpen = signal(false);
  readonly selectedPayment = signal<Payment | null>(null);
  readonly modalContext = signal<ReservaPagoContext | null>(null);
  readonly saving = signal(false);

  ngOnInit(): void {
    this.refresh();
    this.paymentService.loadMetodos();
  }

  private refresh(): void {
    this.paymentService.load(this.filters());
  }

  onFiltersChange(partial: Partial<PaymentFilters>): void {
    this.filters.update((f) => ({ ...f, ...partial }));
    this.refresh();
  }

  changePage(page: number): void {
    if (page < 0) return;
    this.filters.update((f) => ({ ...f, page }));
    this.refresh();
  }

  openCreateModal(): void {
    this.selectedPayment.set(null);
    this.modalContext.set(null);
    this.modalOpen.set(true);
  }

  /** Abre el modal de registro de pago para una reserva específica (p.ej. desde el módulo de reservas) */
  openCreateForReservation(ctx: ReservaPagoContext): void {
    this.selectedPayment.set(null);
    this.modalContext.set(ctx);
    this.modalOpen.set(true);
  }

  openEditModal(payment: Payment): void {
    this.selectedPayment.set(payment);
    this.modalContext.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.selectedPayment.set(null);
    this.modalContext.set(null);
  }

  onSave(event: { payload: PaymentCreatePayload; id?: number }): void {
    this.saving.set(true);
    const obs = event.id
      ? this.paymentService.update(event.id, event.payload)
      : this.paymentService.create(event.payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.toastr.success(
          event.id ? 'Pago actualizado correctamente.' : 'Pago registrado correctamente.',
        );
        this.closeModal();
        this.refresh();
      },
      error: (err: { friendlyMessage?: string }) => {
        this.saving.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo guardar el pago.');
      },
    });
  }

  async confirmDelete(payment: Payment): Promise<void> {
    const confirmed = await this.confirmDialog.ask({
      title: 'Eliminar pago',
      message: `¿Seguro que deseas eliminar el pago de S/ ${payment.monto.toFixed(2)}? Esta acción no se puede revertir.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    this.paymentService.delete(payment.pagoId).subscribe({
      next: () => {
        this.toastr.success('Pago eliminado correctamente.');
        this.refresh();
      },
      error: (err: { friendlyMessage?: string }) => {
        this.toastr.error(err.friendlyMessage ?? 'No se pudo eliminar el pago.');
      },
    });
  }
}
