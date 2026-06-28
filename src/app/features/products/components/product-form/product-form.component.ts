import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiModalComponent } from '../../../../shared/ui/modal/ui-modal.component';
import { EstadoActivo, Producto, ProductoCreatePayload } from '../../models/product.model';
import { CategoriaProductoService } from '../../services/categoria-producto.service';

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
              maxlength="150" />
            @if (errMsg('nombre'); as msg) {
              <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
            }
          </div>

          <div>
            <label for="categoriaProductoId" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Categoría <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <select
              id="categoriaProductoId"
              formControlName="categoriaProductoId"
              [class]="inputCls(form.controls.categoriaProductoId)">
              <option [value]="0" disabled>Selecciona...</option>
              @for (cat of categorias.items(); track cat.categoriaProductoId) {
                <option [value]="cat.categoriaProductoId">{{ cat.nombre }}</option>
              }
            </select>
            @if (errMsg('categoriaProductoId'); as msg) {
              <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
            }
          </div>
        </div>

        <div class="grid sm:grid-cols-4 gap-4">
          <div>
            <label for="precioVenta" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Precio de venta <span class="text-[var(--color-danger-500)]">*</span>
            </label>
            <div class="relative mt-1.5">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] text-[13px]">S/</span>
              <input
                id="precioVenta"
                type="number"
                step="0.01"
                min="0"
                formControlName="precioVenta"
                [class]="inputCls(form.controls.precioVenta, 'pl-8 mt-0')"
                placeholder="0.00" />
            </div>
            @if (errMsg('precioVenta'); as msg) {
              <p class="text-xs text-[var(--color-danger-500)] mt-1.5" role="alert">{{ msg }}</p>
            }
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
              [class]="inputCls(form.controls.stockActual) + ' disabled:bg-[var(--color-surface)] disabled:text-[var(--color-ink-muted)]'"
              placeholder="0" />
            @if (isEditing()) {
              <p class="text-[11px] text-[var(--color-ink-muted)] mt-1">Se ajusta con compras/movimientos.</p>
            } @else if (errMsg('stockActual'); as msg) {
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
            maxlength="2000"
            class="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border-soft)] bg-white text-[15px] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 transition resize-y"
            placeholder="Notas adicionales sobre el producto..."></textarea>
          <p class="text-[11px] text-[var(--color-ink-muted)] mt-1 text-right">
            {{ descripcionLength() }}/2000
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
          {{ isEditing() ? 'Guardar cambios' : 'Crear producto' }}
        </ui-button>
      </ng-container>
    </ui-modal>
  `,
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly categorias = inject(CategoriaProductoService);

  readonly open = input.required<boolean>();
  readonly editing = input<Producto | null>(null);
  readonly submitting = signal(false);

  readonly closed = output<void>();
  readonly submitted = output<ProductoCreatePayload>();

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    categoriaProductoId: [0, [Validators.required, Validators.min(1)]],
    precioVenta: [0, [Validators.required, Validators.min(0)]],
    stockActual: [0, [Validators.required, Validators.min(0)]],
    stockMinimo: [0, [Validators.required, Validators.min(0)]],
    estado: ['ACTIVO' as EstadoActivo, [Validators.required]],
    descripcion: ['', [Validators.maxLength(2000)]],
  });

  readonly isEditing = computed(() => !!this.editing());
  readonly title = computed(() => (this.editing() ? 'Editar producto' : 'Nuevo producto'));
  readonly descripcionLength = computed(() => this.form.controls.descripcion.value?.length ?? 0);

  ngOnInit(): void {
    if (!this.categorias.items().length) {
      this.categorias.load();
    }
    this.applyEditing();
  }

  applyEditing(): void {
    const edit = this.editing();
    if (edit) {
      this.form.patchValue({
        nombre: edit.nombre,
        categoriaProductoId: edit.categoriaProductoId,
        precioVenta: Number(edit.precioVenta),
        stockActual: edit.stockActual,
        stockMinimo: edit.stockMinimo,
        estado: edit.estado,
        descripcion: edit.descripcion ?? '',
      });
      this.form.controls.stockActual.disable();
    } else {
      this.form.reset({
        nombre: '',
        categoriaProductoId: 0,
        precioVenta: 0,
        stockActual: 0,
        stockMinimo: 0,
        estado: 'ACTIVO',
        descripcion: '',
      });
      this.form.controls.stockActual.enable();
    }
  }

  errMsg(field: keyof typeof this.form.controls): string | null {
    const c = this.form.controls[field];
    if (!c.invalid || (!c.touched && !c.dirty)) return null;
    if (c.hasError('required')) return 'Obligatorio.';
    if (c.hasError('min')) return 'Selecciona un valor válido.';
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
      descripcion: v.descripcion?.trim() || null,
      precioVenta: Number(v.precioVenta),
      stockActual: Number(v.stockActual),
      stockMinimo: Number(v.stockMinimo),
      estado: v.estado,
      categoriaProductoId: Number(v.categoriaProductoId),
    };
    this.submitting.set(true);
    this.submitted.emit(payload);
  }

  finishSubmit(): void {
    this.submitting.set(false);
  }
}
