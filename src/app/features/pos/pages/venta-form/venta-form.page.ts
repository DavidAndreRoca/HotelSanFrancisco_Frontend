import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthStore } from '../../../../core/auth/auth.store';
import { ProductoResumen } from '../../../../core/productos/producto-lookup.service';
import { ClienteResumen } from '../../../../core/clientes/cliente-lookup.service';
import { ProductoSelectorComponent } from '../../../../shared/components/producto-selector/producto-selector.component';
import { ClienteSelectorComponent } from '../../../../shared/components/cliente-selector/cliente-selector.component';
import { EstanciaSelectorComponent } from '../../../../shared/components/estancia-selector/estancia-selector.component';
import { VentaService } from '../../services/venta.service';
import { CreateVentaRequest, TipoVenta } from '../../models/venta.model';
import { TIPOS_VENTA, TIPO_LABEL, formatMonto } from '../../utils/venta-ui';

interface LineaEditable {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  descuentoUnitario: number;
}

@Component({
  selector: 'app-venta-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ProductoSelectorComponent, ClienteSelectorComponent, EstanciaSelectorComponent],
  template: `
    <div class="space-y-5 max-w-3xl">

      <button type="button" (click)="volver()"
        class="inline-flex items-center gap-1.5 text-sm text-[#2D2926]/60
               hover:text-[#C5A048] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Ventas
      </button>

      <h1 class="text-2xl font-bold text-[#2D2926]">Nueva venta</h1>

      <!-- Cabecera -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-5 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Código de venta *</label>
            <input type="text" [(ngModel)]="codigoVenta" (ngModelChange)="onCodigo($event)"
              placeholder="VEN-2026-001"
              class="w-full h-10 px-3 rounded-lg border bg-white text-sm text-[#2D2926]
                     placeholder:text-[#2D2926]/35 focus:outline-none"
              [class]="codigoValido() ? 'border-[#EEE3D1] focus:border-[#C5A048]' : 'border-red-400'" />
            @if (codigoVenta() && !codigoValido()) {
              <p class="text-[11px] text-red-500 mt-1">Solo mayúsculas, números y guiones.</p>
            }
          </div>
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Tipo de venta *</label>
            <select [(ngModel)]="tipoVenta"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              @for (t of tipos; track t) { <option [value]="t">{{ tipoLabel(t) }}</option> }
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Fecha de venta *</label>
            <input type="datetime-local" [(ngModel)]="fechaVenta"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>
          @if (tipoVenta() === 'CARGO_HABITACION') {
            <div>
              <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Estancia *</label>
              <app-estancia-selector (estanciaElegida)="estanciaId.set($event)" />
            </div>
          }
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Huésped (opcional)</label>
          <app-cliente-selector (elegido)="onHuesped($event)" />
        </div>
      </div>

      <!-- Líneas -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-5 space-y-4">
        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Agregar producto</label>
          <app-producto-selector (elegido)="agregarProducto($event)" />
        </div>

        @if (lineas().length === 0) {
          <p class="text-sm text-[#2D2926]/45 text-center py-4">
            Agrega al menos un producto a la venta.
          </p>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[640px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-2 py-2 font-semibold">Producto</th>
                  <th class="px-2 py-2 font-semibold w-24">Cantidad</th>
                  <th class="px-2 py-2 font-semibold w-28">Precio</th>
                  <th class="px-2 py-2 font-semibold w-28">Descuento</th>
                  <th class="px-2 py-2 font-semibold text-right w-24">Subtotal</th>
                  <th class="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                @for (l of lineas(); track l.productoId; let i = $index) {
                  <tr class="border-b border-[#EEE3D1] last:border-0">
                    <td class="px-2 py-2 text-[#2D2926]">{{ l.productoNombre }}</td>
                    <td class="px-2 py-2">
                      <input type="number" min="0.01" step="0.01" [ngModel]="l.cantidad"
                        (ngModelChange)="setLinea(i, 'cantidad', $event)"
                        class="w-20 h-8 px-2 rounded border border-[#EEE3D1] text-sm
                               focus:outline-none focus:border-[#C5A048]" />
                    </td>
                    <td class="px-2 py-2">
                      <input type="number" min="0" step="0.01" [ngModel]="l.precioUnitario"
                        (ngModelChange)="setLinea(i, 'precioUnitario', $event)"
                        class="w-24 h-8 px-2 rounded border border-[#EEE3D1] text-sm
                               focus:outline-none focus:border-[#C5A048]" />
                    </td>
                    <td class="px-2 py-2">
                      <input type="number" min="0" step="0.01" [ngModel]="l.descuentoUnitario"
                        (ngModelChange)="setLinea(i, 'descuentoUnitario', $event)"
                        class="w-24 h-8 px-2 rounded border border-[#EEE3D1] text-sm
                               focus:outline-none focus:border-[#C5A048]" />
                    </td>
                    <td class="px-2 py-2 text-right font-medium text-[#2D2926] whitespace-nowrap">
                      {{ monto(subtotalLinea(l)) }}
                    </td>
                    <td class="px-2 py-2 text-right">
                      <button type="button" (click)="quitar(i)"
                        class="text-red-500 hover:text-red-700 text-lg leading-none"
                        aria-label="Quitar">×</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2 border-t border-[#EEE3D1]">
            <span class="text-sm text-[#2D2926]/55">Total estimado</span>
            <span class="text-lg font-bold text-[#2D2926]">{{ monto(totalPreview()) }}</span>
          </div>
          <p class="text-[11px] text-[#2D2926]/45 text-right -mt-2">
            Estimación local. El monto oficial lo calcula el sistema al guardar.
          </p>
        }
      </div>

      <div class="flex justify-end gap-2">
        <button type="button" (click)="volver()"
          class="h-10 px-5 rounded-lg text-sm font-medium text-[#2D2926]/70
                 hover:bg-[#F9F5F0] transition-colors">Cancelar</button>
        <button type="button" (click)="guardar()"
          [disabled]="!puedeGuardar() || guardando()"
          class="h-10 px-5 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                 hover:bg-[#8E6F2E] transition-colors disabled:opacity-40
                 disabled:cursor-not-allowed">
          {{ guardando() ? 'Guardando…' : 'Crear venta' }}
        </button>
      </div>

    </div>
  `,
})
export class VentaFormPage {
  private readonly svc = inject(VentaService);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toastr = inject(ToastrService);

  readonly tipos = TIPOS_VENTA;

  readonly codigoVenta = signal('');
  readonly tipoVenta = signal<TipoVenta>('DIRECTA');
  readonly fechaVenta = signal(new Date().toISOString().slice(0, 16));
  readonly estanciaId = signal<number | null>(null);
  readonly huespedId = signal<number | null>(null);
  readonly lineas = signal<LineaEditable[]>([]);
  readonly guardando = signal(false);

  readonly codigoValido = computed(() => /^[A-Z0-9\-]+$/.test(this.codigoVenta()));

  readonly totalPreview = computed(() =>
    this.lineas().reduce((acc, l) => acc + this.subtotalLinea(l), 0),
  );

  onCodigo(v: string): void {
    // Normaliza a mayúsculas para cumplir el patrón del backend
    this.codigoVenta.set(v.toUpperCase());
  }

  onHuesped(c: ClienteResumen | null): void {
    this.huespedId.set(c?.huespedId ?? null);
  }

  agregarProducto(p: ProductoResumen): void {
    const existente = this.lineas().find((l) => l.productoId === p.productoId);
    if (existente) {
      // El backend rechaza productos duplicados → incrementamos la cantidad
      this.setLinea(this.lineas().indexOf(existente), 'cantidad', existente.cantidad + 1);
      this.toastr.info('El producto ya estaba en la venta; se aumentó la cantidad.');
      return;
    }
    this.lineas.update((ls) => [
      ...ls,
      {
        productoId: p.productoId,
        productoNombre: p.nombre,
        cantidad: 1,
        precioUnitario: p.precioVenta,
        descuentoUnitario: 0,
      },
    ]);
  }

  setLinea(i: number, campo: 'cantidad' | 'precioUnitario' | 'descuentoUnitario', valor: number): void {
    this.lineas.update((ls) =>
      ls.map((l, idx) => (idx === i ? { ...l, [campo]: Number(valor) || 0 } : l)),
    );
  }

  quitar(i: number): void {
    this.lineas.update((ls) => ls.filter((_, idx) => idx !== i));
  }

  subtotalLinea(l: LineaEditable): number {
    return Math.max(0, (l.precioUnitario - l.descuentoUnitario) * l.cantidad);
  }

  puedeGuardar(): boolean {
    if (!this.codigoValido() || this.lineas().length === 0) return false;
    if (this.tipoVenta() === 'CARGO_HABITACION' && !this.estanciaId()) return false;
    return this.lineas().every((l) => l.cantidad > 0 && l.precioUnitario >= 0);
  }

  guardar(): void {
    if (!this.puedeGuardar() || this.guardando()) return;
    const usuarioId = this.store.user()?.usuarioId;
    if (usuarioId == null) {
      this.toastr.error('No se pudo identificar al cajero.', 'Error');
      return;
    }

    this.guardando.set(true);
    const payload: CreateVentaRequest = {
      codigoVenta: this.codigoVenta().trim(),
      tipoVenta: this.tipoVenta(),
      fechaVenta: `${this.fechaVenta()}:00`,
      usuarioId,
      estanciaId: this.estanciaId() ?? undefined,
      huespedId: this.huespedId() ?? undefined,
      detalles: this.lineas().map((l) => ({
        productoId: l.productoId,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        descuentoUnitario: l.descuentoUnitario || undefined,
      })),
    };

    this.svc.crear(payload).subscribe({
      next: (venta) => {
        this.guardando.set(false);
        this.toastr.success(`Venta ${venta.codigoVenta} creada.`);
        this.router.navigate(['/pos', venta.ventaId]);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.guardando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo crear la venta.', 'Error');
      },
    });
  }

  volver(): void { this.location.back(); }

  tipoLabel(t: TipoVenta): string { return TIPO_LABEL[t]; }
  monto(n: number): string { return formatMonto(n); }
}
