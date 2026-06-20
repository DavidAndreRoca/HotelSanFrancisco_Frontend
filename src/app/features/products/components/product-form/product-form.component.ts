import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiModalComponent } from '../../../../shared/ui/modal/ui-modal.component';
import { CategoriaProducto, EstadoActivo, Producto, ProductoCreatePayload } from '../../models/product.model';

@Component({
  selector: 'app-product-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, UiButtonComponent, UiModalComponent],
  template: `
    <ui-modal
      [open]="open()"
      [title]="title()"
      subtitle="Define los datos comerciales y de inventario del producto."
      size="lg"
      (closed)="closed.emit()">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate id="product-form" class="space-y-4">
        <div class="grid sm:grid-cols-[2fr_1fr] gap-4">
          <div>
            <label for="nombre" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Nombre <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <input
              id="nombre"
              formControlName="nombre"
              [class]="inputCls(form.controls.nombre)"
              placeholder="Ej. Agua mineral 500ml"
              maxlength="120" />
            @if (errMsg('nombre'); as msg) {
              <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
            }
          </div>

          <div>
            <label for="sku" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              SKU <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <input
              id="sku"
              formControlName="sku"
              [class]="inputCls(form.controls.sku)"
              placeholder="Ej. BEB-0001"
              maxlength="30" />
            @if (errMsg('sku'); as msg) {
              <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
            }
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label for="categoria" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Categoría <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <select id="categoria" formControlName="categoria" [class]="inputCls(form.controls.categoria)">
              <option value="MINIBAR">Minibar</option>
              <option value="AMENITIES">Amenities</option>
              <option value="LIMPIEZA">Limpieza</option>
              <option value="ALIMENTOS">Alimentos</option>
              <option value="BEBIDAS">Bebidas</option>
              <option value="LENCERIA">Lencería</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="OTROS">Otros</option>
            </select>
          </div>

          <div>
            <label for="unidadMedida" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Unidad de medida <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <input
              id="unidadMedida"
              formControlName="unidadMedida"
              [class]="inputCls(form.controls.unidadMedida)"
              placeholder="Ej. unidad, caja, galón"
              maxlength="30" />
            @if (errMsg('unidadMedida'); as msg) {
              <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
            }
          </div>
        </div>

        <div class="grid sm:grid-cols-4 gap-4">
          <div>
            <label for="costoUnitario" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Costo unitario <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <div class="relative mt-1.5">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] text-[13px]">
                S/
              </span>
              <input
                id="costoUnitario"
                type="number"
                step="0.01"
                min="0"
                formControlName="costoUnitario"
                [class]="inputCls(form.controls.costoUnitario, 'pl-8 mt-0')"
                placeholder="0.00" />
            </div>
            @if (errMsg('costoUnitario'); as msg) {
              <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
            }
          </div>

          <div>
            <label for="precioVenta" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Precio de venta
            </label>
            <div class="relative mt-1.5">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] text-[13px]">
                S/
              </span>
              <input
                id="precioVenta"
                type="number"
                step="0.01"
                min="0"
                formControlName="precioVenta"
                [class]="inputCls(form.controls.precioVenta, 'pl-8 mt-0')"
                placeholder="0.00" />
            </div>
            <p class="text-[11px] text-[var(--color-ink-muted)] mt-1">Deja 0 si es de uso interno.</p>
          </div>

          <div>
            <label for="stockActual" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Stock actual <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <input
              id="stockActual"
              type="number"
              min="0"
              formControlName="stockActual"
              [class]="inputCls(form.controls.stockActual)"
              placeholder="0" />
            @if (errMsg('stockActual'); as msg) {
              <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
            }
          </div>

          <div>
            <label for="stockMinimo" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Stock mínimo <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <input
              id="stockMinimo"
              type="number"
              min="0"
              formControlName="stockMinimo"
              [class]="inputCls(form.controls.stockMinimo)"
              placeholder="0" />
            @if (errMsg('stockMinimo'); as msg) {
              <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
            }
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label for="proveedorPrincipal" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Proveedor principal
            </label>
            <input
              id="proveedorPrincipal"
              formControlName="proveedorPrincipal"
              [class]="inputCls(form.controls.proveedorPrincipal)"
              placeholder="Ej. Distribuidora San Martín"
              maxlength="120" />
          </div>

          <div>
            <label for="estado" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Estado <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <select id="estado" formControlName="estado" [class]="inputCls(form.controls.estado)">
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
        </div>

        <div>
          <label for="descripcion" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
            Descripción
          </label>
          <textarea
            id="descripcion"
            formControlName="descripcion"
            rows="3"
            maxlength="500"
            class="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border-soft)] bg-white text-[15px] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 transition resize-y"
            placeholder="Notas adicionales sobre el producto..."></textarea>
          <p class="text-[11px] text-[var(--color-ink-muted)] mt-1 text-right">
            {{ descripcionLength() }}/500
          </p>
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
          {{ editing() ? 'Guardar cambios' : 'Crear producto' }}
        </ui-button>
      </ng-container>
    </ui-modal>
  `,
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly open = input.required<boolean>();
  readonly editing = input<Producto | null>(null);
  readonly submitting = signal(false);

  readonly closed = output<void>();
  readonly submitted = output<ProductoCreatePayload>();

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    sku: ['', [Validators.required, Validators.maxLength(30)]],
    categoria: ['MINIBAR' as CategoriaProducto, [Validators.required]],
    unidadMedida: ['unidad', [Validators.required, Validators.maxLength(30)]],
    costoUnitario: [0, [Validators.required, Validators.min(0)]],
    precioVenta: [0, [Validators.min(0)]],
    stockActual: [0, [Validators.required, Validators.min(0)]],
    stockMinimo: [0, [Validators.required, Validators.min(0)]],
    proveedorPrincipal: ['', [Validators.maxLength(120)]],
    estado: ['ACTIVO' as EstadoActivo, [Validators.required]],
    descripcion: ['', [Validators.maxLength(500)]],
  });

  readonly title = computed(() => (this.editing() ? 'Editar producto' : 'Nuevo producto'));

  readonly descripcionLength = computed(() => this.form.controls.descripcion.value?.length ?? 0);

  ngOnInit(): void {
    this.applyEditing();
  }

  applyEditing(): void {
    const edit = this.editing();
    if (edit) {
      this.form.patchValue({
        nombre: edit.nombre,
        sku: edit.sku,
        categoria: edit.categoria,
        unidadMedida: edit.unidadMedida,
        costoUnitario: Number(edit.costoUnitario),
        precioVenta: Number(edit.precioVenta),
        stockActual: edit.stockActual,
        stockMinimo: edit.stockMinimo,
        proveedorPrincipal: edit.proveedorPrincipal ?? '',
        estado: edit.estado,
        descripcion: edit.descripcion ?? '',
      });
    } else {
      this.form.reset({
        nombre: '',
        sku: '',
        categoria: 'MINIBAR',
        unidadMedida: 'unidad',
        costoUnitario: 0,
        precioVenta: 0,
        stockActual: 0,
        stockMinimo: 0,
        proveedorPrincipal: '',
        estado: 'ACTIVO',
        descripcion: '',
      });
    }
  }

  errMsg(field: keyof typeof this.form.controls): string | null {
    const c = this.form.controls[field];
    if (!c.invalid || (!c.touched && !c.dirty)) return null;
    if (c.hasError('required')) return 'Obligatorio.';
    if (c.hasError('min')) return 'Valor demasiado bajo.';
    if (c.hasError('maxlength')) return 'Texto demasiado largo.';
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: ProductoCreatePayload = {
      nombre: v.nombre.trim(),
      sku: v.sku.trim().toUpperCase(),
      categoria: v.categoria,
      unidadMedida: v.unidadMedida.trim(),
      costoUnitario: Number(v.costoUnitario),
      precioVenta: Number(v.precioVenta),
      stockActual: Number(v.stockActual),
      stockMinimo: Number(v.stockMinimo),
      proveedorPrincipal: v.proveedorPrincipal?.trim() || null,
      estado: v.estado,
      descripcion: v.descripcion?.trim() || null,
    };
    this.submitting.set(true);
    this.submitted.emit(payload);
  }

  finishSubmit(): void {
    this.submitting.set(false);
  }
}
