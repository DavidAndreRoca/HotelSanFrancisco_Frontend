import { ChangeDetectionStrategy, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiCardComponent } from '../../../shared/ui/card/ui-card.component';
import { UiBadgeComponent } from '../../../shared/ui/badge/ui-badge.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/ui-skeleton.component';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { PurchaseFiltersComponent } from '../components/purchase-filters/purchase-filters.component';
import { PurchaseFormComponent } from '../components/purchase-form/purchase-form.component';
import { PurchaseService } from '../services/purchase.service';
import {
  Compra,
  CompraCreatePayload,
  CompraFilters,
  DEFAULT_COMPRA_FILTERS,
  ESTADO_COMPRA_CONFIG,
  totalCompra,
} from '../models/purchase.model';

@Component({
  selector: 'app-purchases-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    UiButtonComponent,
    UiCardComponent,
    UiBadgeComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    PurchaseFiltersComponent,
    PurchaseFormComponent,
  ],
  template: `
    <header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--color-primary-700)] font-semibold mb-1">
          Inventario
        </p>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Compras</h1>
        <p class="text-[15px] text-[var(--color-ink-muted)] mt-1">
          Órdenes de compra a proveedores y reposición de stock.
        </p>
      </div>
      <ui-button (click)="onCreate()">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" d="M12 5v14M5 12h14"/>
        </svg>
        Nueva orden
      </ui-button>
    </header>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <ui-card padding="sm">
        <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Total órdenes</p>
        <p class="mt-2 text-2xl font-bold">{{ service.stats().total }}</p>
      </ui-card>
      <ui-card padding="sm">
        <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Pendientes</p>
        <p class="mt-2 text-2xl font-bold text-[var(--color-warning-500)]">{{ service.stats().pendientes }}</p>
      </ui-card>
      <ui-card padding="sm">
        <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Recibidas</p>
        <p class="mt-2 text-2xl font-bold text-[var(--color-success-500)]">{{ service.stats().recibidas }}</p>
      </ui-card>
      <ui-card padding="sm">
        <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Monto del mes</p>
        <p class="mt-2 text-2xl font-bold text-[var(--color-primary-700)]">
          {{ service.stats().montoTotalMes | currency:'PEN':'symbol-narrow':'1.2-2' }}
        </p>
      </ui-card>
    </div>

    <div class="mb-5">
      <app-purchase-filters
        [initial]="filters()"
        (changed)="onFiltersChanged($event)" />
    </div>

    @if (service.loading()) {
      <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] overflow-hidden">
        <div class="p-4 space-y-3">
          @for (i of [1,2,3,4]; track i) {
            <ui-skeleton height="4.5rem" radius="0.75rem" />
          }
        </div>
      </div>
    } @else if (visible().length === 0) {
      <ui-empty-state
        icon="▣"
        title="No se encontraron órdenes de compra"
        description="Ajusta los filtros o crea una nueva orden para reponer inventario.">
        <ui-button (click)="onCreate()">Crear primera orden</ui-button>
      </ui-empty-state>
    } @else {
      <div class="space-y-3">
        @for (c of visible(); track c.compraId) {
          <ui-card padding="sm">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="text-[15px] font-semibold text-[var(--color-ink)]">{{ c.numeroOrden }}</p>
                  <ui-badge [tone]="estadoCfg(c).badgeTone">{{ estadoCfg(c).label }}</ui-badge>
                </div>
                <p class="text-[13px] text-[var(--color-ink-soft)] mt-0.5">{{ c.proveedor }}</p>
                <p class="text-[12px] text-[var(--color-ink-muted)] mt-1">
                  Ordenado {{ c.fechaOrden | date:'dd MMM yyyy' }}
                  @if (c.fechaRecepcion) {
                    · Recibido {{ c.fechaRecepcion | date:'dd MMM yyyy' }}
                  }
                </p>

                <div class="mt-3 flex flex-wrap gap-1.5">
                  @for (d of c.detalle; track d.productoId) {
                    <span class="inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-soft)] text-[var(--color-ink-soft)]">
                      {{ d.productoNombre }} × {{ d.cantidad }}
                    </span>
                  }
                </div>

                @if (c.notas) {
                  <p class="text-[12px] text-[var(--color-ink-muted)] mt-2 italic">"{{ c.notas }}"</p>
                }
              </div>

              <div class="flex sm:flex-col items-end justify-between sm:justify-start gap-3 sm:gap-2 sm:text-right shrink-0">
                <div>
                  <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Total</p>
                  <p class="text-lg font-bold text-[var(--color-primary-700)]">
                    {{ total(c) | currency:'PEN':'symbol-narrow':'1.2-2' }}
                  </p>
                </div>
                <div class="flex gap-2">
                  @if (c.estado === 'PENDIENTE') {
                    <button
                      type="button"
                      class="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[var(--color-success-500)] text-[var(--color-success-500)] hover:bg-[var(--color-success-500)]/10 transition-colors"
                      (click)="onRecibir(c)">
                      Recibir
                    </button>
                  }
                  <button
                    type="button"
                    class="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[var(--color-border-soft)] hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-700)] transition-colors"
                    (click)="onEdit(c)">
                    Editar
                  </button>
                  <button
                    type="button"
                    class="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[var(--color-border-soft)] hover:border-[var(--color-danger-500)] hover:text-[var(--color-danger-500)] transition-colors"
                    (click)="onDelete(c)">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </ui-card>
        }
      </div>
      <p class="mt-3 text-[12px] text-[var(--color-ink-muted)]">
        Mostrando {{ visible().length }} de {{ service.items().length }} órdenes
      </p>
    }

    @if (formOpen()) {
      <app-purchase-form
        #formCmp
        [open]="formOpen()"
        [editing]="editingPurchase()"
        (closed)="closeForm()"
        (submitted)="onSubmit($event)" />
    }
  `,
})
export class PurchasesPage implements OnInit {
  protected readonly service = inject(PurchaseService);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);

  @ViewChild('formCmp') private formCmp?: PurchaseFormComponent;

  readonly filters = signal<CompraFilters>({ ...DEFAULT_COMPRA_FILTERS });
  readonly formOpen = signal(false);
  readonly editingPurchase = signal<Compra | null>(null);

  readonly visible = computed(() => {
    const f = this.filters();
    return this.service.items().filter((c) => {
      if (f.estado && c.estado !== f.estado) return false;
      if (f.search) {
        const q = f.search.toLowerCase();
        const hay =
          c.numeroOrden.toLowerCase().includes(q) || c.proveedor.toLowerCase().includes(q);
        if (!hay) return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.service.load();
  }

  estadoCfg(c: Compra) {
    return ESTADO_COMPRA_CONFIG[c.estado];
  }

  total(c: Compra): number {
    return totalCompra(c);
  }

  onFiltersChanged(patch: Partial<CompraFilters>): void {
    this.filters.update((f) => ({ ...f, ...patch }));
  }

  onCreate(): void {
    this.editingPurchase.set(null);
    this.formOpen.set(true);
  }

  onEdit(c: Compra): void {
    this.editingPurchase.set(c);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingPurchase.set(null);
  }

  onSubmit(payload: CompraCreatePayload): void {
    const editing = this.editingPurchase();
    const op$ = editing
      ? this.service.update(editing.compraId, payload)
      : this.service.create(payload);

    op$.subscribe({
      next: () => {
        this.formCmp?.finishSubmit();
        this.toastr.success(editing ? 'Orden de compra actualizada.' : 'Orden de compra creada.');
        this.closeForm();
      },
      error: (err: { friendlyMessage?: string }) => {
        this.formCmp?.finishSubmit();
        this.toastr.error(err.friendlyMessage ?? 'No se pudo guardar la orden.', 'Error');
      },
    });
  }

  async onRecibir(c: Compra): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Confirmar recepción',
      message: `¿Marcar la orden "${c.numeroOrden}" como recibida? Esto debería actualizar el stock de los productos.`,
      confirmText: 'Sí, recibir',
      cancelText: 'Cancelar',
    });
    if (!ok) return;

    this.service.cambiarEstado(c.compraId, 'RECIBIDA').subscribe({
      next: () => this.toastr.success(`Orden "${c.numeroOrden}" marcada como recibida.`),
      error: (err: { friendlyMessage?: string }) =>
        this.toastr.error(err.friendlyMessage ?? 'No se pudo actualizar la orden.', 'Error'),
    });
  }

  async onDelete(c: Compra): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Eliminar orden de compra',
      message: `¿Eliminar la orden "${c.numeroOrden}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;

    this.service.delete(c.compraId).subscribe({
      next: () => this.toastr.success('Orden eliminada correctamente.'),
      error: (err: { friendlyMessage?: string }) =>
        this.toastr.error(err.friendlyMessage ?? 'No se pudo eliminar la orden.', 'Error'),
    });
  }
}
