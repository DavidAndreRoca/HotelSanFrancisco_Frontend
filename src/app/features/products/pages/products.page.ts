import { ChangeDetectionStrategy, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiCardComponent } from '../../../shared/ui/card/ui-card.component';
import { UiBadgeComponent } from '../../../shared/ui/badge/ui-badge.component';
import { UiEmptyStateComponent } from '../../../shared/ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../../../shared/ui/skeleton/ui-skeleton.component';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ProductFiltersComponent } from '../components/product-filters/product-filters.component';
import { ProductFormComponent } from '../components/product-form/product-form.component';
import { ProductService } from '../services/product.service';
import {
  DEFAULT_PRODUCTO_FILTERS,
  Producto,
  ProductoCreatePayload,
  ProductoFilters,
  ProductoUpdatePayload,
} from '../models/product.model';

@Component({
  selector: 'app-products-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    UiButtonComponent,
    UiCardComponent,
    UiBadgeComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    ProductFiltersComponent,
    ProductFormComponent,
  ],
  template: `
    <header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        <p class="text-[11px] uppercase tracking-[0.3em] text-[var(--color-primary-700)] font-semibold mb-1">
          Inventario
        </p>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Productos</h1>
        <p class="text-[15px] text-[var(--color-ink-muted)] mt-1">
          Catálogo de insumos, amenities y artículos de minibar del hotel.
        </p>
      </div>
      <ui-button (click)="onCreate()">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" d="M12 5v14M5 12h14"/>
        </svg>
        Nuevo producto
      </ui-button>
    </header>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <ui-card padding="sm">
        <div class="border-l-2 border-[var(--color-ink-muted)] pl-3">
          <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Total productos</p>
          <p class="mt-2 text-2xl font-bold">{{ service.stats().total }}</p>
        </div>
      </ui-card>
      <ui-card padding="sm">
        <div class="border-l-2 border-[var(--color-success-500)] pl-3">
          <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Activos</p>
          <p class="mt-2 text-2xl font-bold text-[var(--color-success-500)]">{{ service.stats().activos }}</p>
        </div>
      </ui-card>
      <ui-card padding="sm">
        <div class="border-l-2 border-[var(--color-danger-500)] pl-3">
          <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Bajo stock</p>
          <p class="mt-2 text-2xl font-bold text-[var(--color-danger-500)]">{{ service.stats().bajoStock }}</p>
        </div>
      </ui-card>
      <ui-card padding="sm">
        <div class="border-l-2 border-[var(--color-primary-500)] pl-3">
          <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Valor stock (venta)</p>
          <p class="mt-2 text-2xl font-bold text-[var(--color-primary-700)]">
            {{ service.stats().valorStockVenta | currency:'PEN':'symbol-narrow':'1.2-2' }}
          </p>
        </div>
      </ui-card>
    </div>

    <div class="mb-5">
      <app-product-filters
        [initial]="filters()"
        (changed)="onFiltersChanged($event)" />
    </div>

    @if (service.loading()) {
      <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] overflow-hidden">
        <div class="p-4 space-y-3">
          @for (i of [1,2,3,4,5]; track i) {
            <ui-skeleton height="3.25rem" radius="0.75rem" />
          }
        </div>
      </div>
    } @else if (visible().length === 0) {
      <ui-empty-state
        icon="◈"
        title="No se encontraron productos"
        description="Ajusta los filtros o registra un nuevo producto en el catálogo.">
        <ui-button (click)="onCreate()">Crear primer producto</ui-button>
      </ui-empty-state>
    } @else {
      <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-[var(--color-border-soft)]">
                <th class="px-4 py-3 text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">Producto</th>
                <th class="px-4 py-3 text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">Categoría</th>
                <th class="px-4 py-3 text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide text-right">Precio venta</th>
                <th class="px-4 py-3 text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide text-right">Stock</th>
                <th class="px-4 py-3 text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">Estado</th>
                <th class="px-4 py-3 text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (p of visible(); track p.productoId) {
                <tr class="border-b border-[var(--color-border-soft)] last:border-0 hover:bg-[var(--color-surface)]/60 transition-colors">
                  <td class="px-4 py-3">
                    <p class="text-[14px] font-semibold text-[var(--color-ink)]">{{ p.nombre }}</p>
                    @if (p.descripcion) {
                      <p class="text-[12px] text-[var(--color-ink-muted)] line-clamp-1">{{ p.descripcion }}</p>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-[13px] text-[var(--color-ink-soft)]">{{ p.categoriaProductoNombre }}</span>
                  </td>
                  <td class="px-4 py-3 text-right text-[14px] tabular-nums">
                    @if (p.precioVenta > 0) {
                      {{ p.precioVenta | currency:'PEN':'symbol-narrow':'1.2-2' }}
                    } @else {
                      <span class="text-[var(--color-ink-muted)]">— interno</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span [class]="stockClass(p)">{{ p.stockActual }}</span>
                    @if (p.stockActual <= p.stockMinimo) {
                      <p class="text-[11px] text-[var(--color-danger-500)] mt-0.5">Mín. {{ p.stockMinimo }}</p>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <ui-badge [tone]="p.estado === 'ACTIVO' ? 'success' : 'neutral'">
                      {{ p.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
                    </ui-badge>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[var(--color-border-soft)] hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-700)] transition-colors"
                        (click)="onEdit(p)">
                        Editar
                      </button>
                      <button
                        type="button"
                        class="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[var(--color-border-soft)] hover:border-[var(--color-danger-500)] hover:text-[var(--color-danger-500)] transition-colors"
                        (click)="onDelete(p)">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      <p class="mt-3 text-[12px] text-[var(--color-ink-muted)]">
        Mostrando {{ visible().length }} de {{ service.items().length }} productos
        @if (ultimaActualizacion(); as fecha) {
          · Actualizado {{ fecha | date:'dd MMM, HH:mm' }}
        }
      </p>
    }

    @if (formOpen()) {
      <app-product-form
        #formCmp
        [open]="formOpen()"
        [editing]="editingProduct()"
        (closed)="closeForm()"
        (submitted)="onSubmit($event)" />
    }
  `,
})
export class ProductsPage implements OnInit {
  protected readonly service = inject(ProductService);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);

  @ViewChild('formCmp') private formCmp?: ProductFormComponent;

  readonly filters = signal<ProductoFilters>({ ...DEFAULT_PRODUCTO_FILTERS });
  readonly formOpen = signal(false);
  readonly editingProduct = signal<Producto | null>(null);

  readonly visible = computed(() => {
    const f = this.filters();
    return this.service.items().filter((p) => {
      if (f.categoriaProductoId !== '' && p.categoriaProductoId !== f.categoriaProductoId) return false;
      if (f.estado && p.estado !== f.estado) return false;
      if (f.soloBajoStock && p.stockActual > p.stockMinimo) return false;
      if (f.search) {
        const q = f.search.toLowerCase();
        const hay =
          p.nombre.toLowerCase().includes(q) ||
          p.categoriaProductoNombre.toLowerCase().includes(q);
        if (!hay) return false;
      }
      return true;
    });
  });

  readonly ultimaActualizacion = computed(() => {
    const all = this.service.items();
    if (!all.length) return null;
    return all.reduce((latest, p) => (p.fechaModificacion > latest ? p.fechaModificacion : latest), all[0].fechaModificacion);
  });

  ngOnInit(): void {
    this.service.load();
  }

  stockClass(p: Producto): string {
    const base = 'text-[14px] font-semibold tabular-nums';
    return p.stockActual <= p.stockMinimo ? `${base} text-[var(--color-danger-500)]` : `${base} text-[var(--color-ink)]`;
  }

  onFiltersChanged(patch: Partial<ProductoFilters>): void {
    this.filters.update((f) => ({ ...f, ...patch }));
  }

  onCreate(): void {
    this.editingProduct.set(null);
    this.formOpen.set(true);
  }

  onEdit(p: Producto): void {
    this.editingProduct.set(p);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingProduct.set(null);
  }

  onSubmit(payload: ProductoCreatePayload): void {
    const editing = this.editingProduct();
    const op$ = editing
      ? this.service.update(editing.productoId, this.toUpdatePayload(payload))
      : this.service.create(payload);

    op$.subscribe({
      next: () => {
        this.formCmp?.finishSubmit();
        this.toastr.success(editing ? 'Producto actualizado.' : 'Producto creado.');
        this.closeForm();
      },
      error: (err: { friendlyMessage?: string }) => {
        this.formCmp?.finishSubmit();
        this.toastr.error(err.friendlyMessage ?? 'No se pudo guardar.', 'Error');
      },
    });
  }

  /** El backend no actualiza el stock por aquí (solo cabecera del producto). */
  private toUpdatePayload(payload: ProductoCreatePayload): ProductoUpdatePayload {
    return {
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      precioVenta: payload.precioVenta,
      stockMinimo: payload.stockMinimo,
      estado: payload.estado,
      categoriaProductoId: payload.categoriaProductoId,
    };
  }

  async onDelete(p: Producto): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Eliminar producto',
      message: `¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;

    this.service.delete(p.productoId).subscribe({
      next: () => this.toastr.success('Producto eliminado correctamente.'),
      error: (err: { friendlyMessage?: string }) =>
        this.toastr.error(err.friendlyMessage ?? 'No se pudo eliminar el producto.', 'Error'),
    });
  }
}
