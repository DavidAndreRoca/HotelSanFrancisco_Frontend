import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiModalComponent } from '../../../../shared/ui/modal/ui-modal.component';
import { ProductService } from '../../../products/services/product.service';
import { ProveedorService } from '../../services/proveedor.service';
import { Compra, CompraCreatePayload, DetalleCompraPayload } from '../../models/purchase.model';

interface DetalleFormValue {
  productoId: number;
  cantidad: number;
  costoUnitario: number;
}

interface DetalleFormGroup {
  productoId: FormControl<number>;
  cantidad: FormControl<number>;
  costoUnitario: FormControl<number>;
}

@Component({
  selector: 'app-purchase-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CurrencyPipe, UiButtonComponent, UiModalComponent],
  template: `
    <ui-modal
      [open]="open()"
      [title]="title()"
      subtitle="Registra la compra a proveedor y las líneas de productos."
      size="xl"
      (closed)="closed.emit()">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate id="purchase-form" class="space-y-4">
        <div class="grid sm:grid-cols-3 gap-4">
          <div class="sm:col-span-2">
            <label for="proveedorId" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Proveedor <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <select
              id="proveedorId"
              formControlName="proveedorId"
              [class]="inputCls(form.controls.proveedorId)">
              <option [value]="0" disabled>Selecciona un proveedor...</option>
              @for (p of proveedores.items(); track p.proveedorId) {
                <option [value]="p.proveedorId">{{ p.razonSocial }}</option>
              }
            </select>
            @if (errMsg(form.controls.proveedorId); as msg) {
              <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
            }
          </div>

          <div>
            <label for="fechaCompra" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Fecha de compra <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <input
              id="fechaCompra"
              type="date"
              [max]="todayIso()"
              formControlName="fechaCompra"
              [class]="inputCls(form.controls.fechaCompra)" />
            @if (errMsg(form.controls.fechaCompra); as msg) {
              <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
            }
          </div>
        </div>

        <div class="grid sm:grid-cols-3 gap-4">
          <div class="sm:col-span-2">
            <label for="numeroFactura" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              N° de factura
            </label>
            <input
              id="numeroFactura"
              formControlName="numeroFactura"
              [class]="inputCls(form.controls.numeroFactura)"
              placeholder="Ej. F001-000123"
              maxlength="50" />
            @if (errMsg(form.controls.numeroFactura); as msg) {
              <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
            }
          </div>

          <div>
            <label for="impuesto" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Impuesto (IGV) <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <div class="relative mt-1.5">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] text-[13px]">S/</span>
              <input
                id="impuesto"
                type="number"
                step="0.01"
                min="0"
                formControlName="impuesto"
                [class]="inputCls(form.controls.impuesto, 'pl-8') + ' !mt-0'"
                placeholder="0.00" />
            </div>
            @if (errMsg(form.controls.impuesto); as msg) {
              <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
            }
          </div>
        </div>

        <!-- ── Líneas de detalle ────────────────────────────────────────── -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Productos <span class="text-[var(--color-danger-500)]">*</span>
            </span>
            @if (!isEditing()) {
              <button
                type="button"
                class="text-[12px] font-semibold text-[var(--color-primary-700)] hover:underline"
                (click)="addLinea()">
                + Agregar línea
              </button>
            }
          </div>

          @if (isEditing()) {
            <p class="text-[12px] text-[var(--color-ink-muted)] mb-2">
              Las líneas de productos no se pueden modificar después de registrar la compra.
            </p>
          }

          <div class="rounded-xl border border-[var(--color-border-soft)] overflow-hidden">
            <div class="hidden sm:grid grid-cols-[2fr_100px_120px_120px_40px] gap-2 px-3 py-2 bg-[var(--color-surface)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
              <span>Producto</span>
              <span>Cantidad</span>
              <span>Costo unit.</span>
              <span class="text-right">Subtotal</span>
              <span></span>
            </div>

            <div formArrayName="detalle">
              @for (line of detalle.controls; let i = $index; track i) {
                <div
                  [formGroupName]="i"
                  class="grid grid-cols-1 sm:grid-cols-[2fr_100px_120px_120px_40px] gap-2 px-3 py-2.5 border-t border-[var(--color-border-soft)] items-center">
                  <select
                    formControlName="productoId"
                    class="h-10 px-2.5 rounded-lg border border-[var(--color-border-soft)] bg-white text-[13px] focus:outline-none focus:border-[var(--color-primary-500)] disabled:bg-[var(--color-surface)] disabled:text-[var(--color-ink-muted)]"
                    (change)="onProductoChange(line)">
                    <option [value]="0" disabled>Selecciona...</option>
                    @for (p of products.items(); track p.productoId) {
                      <option [value]="p.productoId">{{ p.nombre }}</option>
                    }
                  </select>

                  <input
                    type="number"
                    min="1"
                    formControlName="cantidad"
                    class="h-10 px-2.5 rounded-lg border border-[var(--color-border-soft)] bg-white text-[13px] focus:outline-none focus:border-[var(--color-primary-500)] disabled:bg-[var(--color-surface)] disabled:text-[var(--color-ink-muted)]"
                    placeholder="0" />

                  <div class="relative">
                    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] text-[12px]">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      formControlName="costoUnitario"
                      class="h-10 pl-7 pr-2.5 w-full rounded-lg border border-[var(--color-border-soft)] bg-white text-[13px] focus:outline-none focus:border-[var(--color-primary-500)] disabled:bg-[var(--color-surface)] disabled:text-[var(--color-ink-muted)]"
                      placeholder="0.00" />
                  </div>

                  <span class="text-[13px] font-semibold text-right tabular-nums">
                    {{ lineaSubtotal(line) | currency:'PEN':'symbol-narrow':'1.2-2' }}
                  </span>

                  @if (!isEditing()) {
                    <button
                      type="button"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-danger-500)] hover:bg-[var(--color-danger-500)]/10 transition-colors justify-self-end"
                      (click)="removeLinea(i)"
                      [disabled]="detalle.length === 1"
                      aria-label="Quitar línea">
                      ×
                    </button>
                  } @else {
                    <span></span>
                  }
                </div>
              }
            </div>
          </div>

          @if (detalle.invalid && detalle.touched) {
            <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">
              Cada línea necesita un producto, cantidad y costo válidos.
            </p>
          }

          <div class="flex justify-end mt-3">
            <div class="text-right space-y-0.5">
              <p class="text-[12px] text-[var(--color-ink-muted)]">
                Subtotal {{ subtotalDetalle() | currency:'PEN':'symbol-narrow':'1.2-2' }}
                · IGV {{ impuestoValue() | currency:'PEN':'symbol-narrow':'1.2-2' }}
              </p>
              <p class="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-semibold">Total compra</p>
              <p class="text-xl font-bold text-[var(--color-primary-700)]">
                {{ totalCompra() | currency:'PEN':'symbol-narrow':'1.2-2' }}
              </p>
            </div>
          </div>
        </div>
      </form>

      <ng-container modal-footer>
        <ui-button variant="ghost" (click)="closed.emit()" [disabled]="submitting()">
          Cancelar
        </ui-button>
        <ui-button
          type="button"
          variant="primary"
          [loading]="submitting()"
          [disabled]="form.invalid"
          (click)="submit()">
          {{ isEditing() ? 'Guardar cambios' : 'Registrar compra' }}
        </ui-button>
      </ng-container>
    </ui-modal>
  `,
})
export class PurchaseFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly products = inject(ProductService);
  protected readonly proveedores = inject(ProveedorService);

  readonly open = input.required<boolean>();
  readonly editing = input<Compra | null>(null);
  readonly submitting = signal(false);

  readonly closed = output<void>();
  readonly submitted = output<CompraCreatePayload>();

  readonly form = this.fb.nonNullable.group({
    proveedorId: [0, [Validators.required, Validators.min(1)]],
    fechaCompra: [this.todayIso(), [Validators.required]],
    numeroFactura: ['', [Validators.maxLength(50)]],
    impuesto: [0, [Validators.required, Validators.min(0)]],
    detalle: this.fb.array<FormGroup<DetalleFormGroup>>([this.buildLinea()]),
  });

  readonly isEditing = computed(() => !!this.editing());
  readonly title = computed(() => (this.editing() ? 'Editar compra' : 'Nueva compra'));

  get detalle() {
    return this.form.controls.detalle;
  }

  ngOnInit(): void {
    if (!this.products.items().length) {
      this.products.load();
    }
    if (!this.proveedores.items().length) {
      this.proveedores.load();
    }
    this.applyEditing();
  }

  todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private buildLinea(initial?: Partial<DetalleFormValue>): FormGroup<DetalleFormGroup> {
    return this.fb.group({
      productoId: this.fb.control(initial?.productoId ?? 0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
      cantidad: this.fb.control(initial?.cantidad ?? 1, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
      costoUnitario: this.fb.control(initial?.costoUnitario ?? 0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)],
      }),
    });
  }

  applyEditing(): void {
    const edit = this.editing();
    this.detalle.clear();

    if (edit) {
      this.form.patchValue({
        proveedorId: edit.proveedorId,
        fechaCompra: edit.fechaCompra,
        numeroFactura: edit.numeroFactura ?? '',
        impuesto: edit.impuesto,
      });
      edit.detalles.forEach((d) =>
        this.detalle.push(
          this.buildLinea({ productoId: d.productoId, cantidad: d.cantidad, costoUnitario: d.costoUnitario }),
        ),
      );
      // El backend no permite editar las líneas: solo lectura.
      this.detalle.disable();
    } else {
      this.form.reset({
        proveedorId: 0,
        fechaCompra: this.todayIso(),
        numeroFactura: '',
        impuesto: 0,
      });
      this.detalle.enable();
      this.detalle.push(this.buildLinea());
    }
  }

  addLinea(): void {
    this.detalle.push(this.buildLinea());
  }

  removeLinea(index: number): void {
    if (this.detalle.length === 1) return;
    this.detalle.removeAt(index);
  }

  onProductoChange(line: FormGroup<DetalleFormGroup>): void {
    const id = Number(line.controls.productoId.value);
    const producto = this.products.findById(id);
    if (producto) {
      line.controls.costoUnitario.setValue(producto.costoUnitario);
    }
  }

  lineaSubtotal(line: FormGroup<DetalleFormGroup>): number {
    const cantidad = Number(line.controls.cantidad.value) || 0;
    const costo = Number(line.controls.costoUnitario.value) || 0;
    return cantidad * costo;
  }

  subtotalDetalle(): number {
    return this.detalle.controls.reduce((acc, line) => acc + this.lineaSubtotal(line), 0);
  }

  impuestoValue(): number {
    return Number(this.form.controls.impuesto.value) || 0;
  }

  totalCompra(): number {
    return this.subtotalDetalle() + this.impuestoValue();
  }

  errMsg(control: { invalid: boolean; touched: boolean; dirty: boolean; hasError: (e: string) => boolean }): string | null {
    if (!control.invalid || (!control.touched && !control.dirty)) return null;
    if (control.hasError('required')) return 'Obligatorio.';
    if (control.hasError('min')) return 'Selecciona un valor válido.';
    if (control.hasError('maxlength')) return 'Texto demasiado largo.';
    return 'Inválido.';
  }

  inputCls(control: { invalid: boolean; touched: boolean; dirty: boolean }, extra = ''): string {
    const base =
      'w-full h-11 px-3.5 rounded-lg border bg-white text-[15px] focus:outline-none transition-all mt-1.5';
    const invalid = control.invalid && (control.touched || control.dirty);
    const tone = invalid
      ? 'border-[var(--color-danger-500)] focus:ring-2 focus:ring-[var(--color-danger-500)]/30'
      : 'border-[var(--color-border-soft)] focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25';
    return `${base} ${tone} ${extra}`;
  }

  submit(): void {
    this.detalle.markAllAsTouched();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const detalles: DetalleCompraPayload[] = v.detalle.map((d) => ({
      productoId: Number(d.productoId),
      cantidad: Number(d.cantidad),
      costoUnitario: Number(d.costoUnitario),
    }));

    const payload: CompraCreatePayload = {
      proveedorId: Number(v.proveedorId),
      fechaCompra: v.fechaCompra,
      numeroFactura: v.numeroFactura?.trim() || null,
      impuesto: Number(v.impuesto),
      detalles,
    };

    this.submitting.set(true);
    this.submitted.emit(payload);
  }

  finishSubmit(): void {
    this.submitting.set(false);
  }
}
