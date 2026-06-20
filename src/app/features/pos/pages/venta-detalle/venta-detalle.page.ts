import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { VentaService } from '../../services/venta.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { EstadoVenta, TipoVenta, VentaResponse } from '../../models/venta.model';
import {
  ESTADO_BADGE,
  ESTADO_LABEL,
  TIPO_LABEL,
  formatMonto,
  transicionesVenta,
} from '../../utils/venta-ui';
import { CambiarEstadoVentaModalComponent } from '../../components/cambiar-estado-venta-modal.component';

@Component({
  selector: 'app-venta-detalle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CambiarEstadoVentaModalComponent],
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

      @if (loading()) {
        <div class="bg-white rounded-2xl border border-[#EEE3D1] h-96 animate-pulse"></div>
      } @else if (venta(); as v) {
        <!-- Cabecera -->
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-6">
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <span class="font-mono text-sm font-bold text-[#C5A048]">{{ v.codigoVenta }}</span>
              <h1 class="text-xl font-bold text-[#2D2926] mt-1">{{ tipoLabel(v.tipoVenta) }}</h1>
            </div>
            <span class="px-3 py-1 rounded-full text-[11px] font-semibold"
                  [class]="estadoBadge(v.estado)">{{ estadoLabel(v.estado) }}</span>
          </div>

          <hr class="border-[#EEE3D1] my-4" />

          <div class="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <p class="text-[11px] text-[#2D2926]/50 font-medium">Cajero</p>
              <p class="font-medium text-[#2D2926] mt-0.5">{{ v.usuarioNombre }}</p>
            </div>
            <div>
              <p class="text-[11px] text-[#2D2926]/50 font-medium">Fecha de venta</p>
              <p class="font-medium text-[#2D2926] mt-0.5">{{ v.fechaVenta }}</p>
            </div>
            @if (v.estanciaId != null) {
              <div>
                <p class="text-[11px] text-[#2D2926]/50 font-medium">Estancia</p>
                <p class="font-medium text-[#2D2926] mt-0.5 font-mono">#{{ v.estanciaId }}</p>
              </div>
            }
            @if (v.huespedNombre) {
              <div>
                <p class="text-[11px] text-[#2D2926]/50 font-medium">Huésped</p>
                <p class="font-medium text-[#2D2926] mt-0.5">{{ v.huespedNombre }}</p>
              </div>
            }
          </div>
        </div>

        <!-- Detalles -->
        <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden">
          <div class="px-5 py-3.5 border-b border-[#EEE3D1]">
            <h2 class="text-sm font-semibold text-[#2D2926]">Detalle ({{ v.detalles.length }} ítems)</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[600px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold">Producto</th>
                  <th class="px-4 py-3 font-semibold text-right">Cantidad</th>
                  <th class="px-4 py-3 font-semibold text-right">Precio</th>
                  <th class="px-4 py-3 font-semibold text-right">Descuento</th>
                  <th class="px-4 py-3 font-semibold text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                @for (d of v.detalles; track d.productoId) {
                  <tr class="border-b border-[#EEE3D1] last:border-0">
                    <td class="px-4 py-3 text-[#2D2926]">{{ d.productoNombre }}</td>
                    <td class="px-4 py-3 text-right text-[#2D2926]/70">{{ d.cantidad }}</td>
                    <td class="px-4 py-3 text-right text-[#2D2926]/70 whitespace-nowrap">{{ monto(d.precioUnitario) }}</td>
                    <td class="px-4 py-3 text-right text-[#2D2926]/70 whitespace-nowrap">{{ monto(d.descuentoUnitario) }}</td>
                    <td class="px-4 py-3 text-right font-medium text-[#2D2926] whitespace-nowrap">{{ monto(d.subtotal) }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="border-t-2 border-[#EEE3D1]">
                  <td colspan="4" class="px-4 py-3 text-right text-sm font-semibold text-[#2D2926]/70">
                    Monto total
                  </td>
                  <td class="px-4 py-3 text-right text-base font-bold text-[#2D2926] whitespace-nowrap">
                    {{ monto(v.montoTotal) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Acciones -->
        @if (puedeGestionar() && hayTransiciones()) {
          <div class="flex items-center justify-end gap-2">
            <button type="button" (click)="estadoAbierto.set(true)"
              class="h-10 px-5 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                     hover:bg-[#8E6F2E] transition-colors">
              Cambiar estado
            </button>
            @if (puedeEliminar() && (v.estado === 'PENDIENTE' || v.estado === 'ANULADA')) {
              <button type="button" (click)="eliminar(v)"
                class="h-10 px-5 rounded-lg border border-red-200 text-red-600 text-sm font-medium
                       hover:bg-red-50 transition-colors">
                Eliminar
              </button>
            }
          </div>
        }

        <app-cambiar-estado-venta-modal
          [open]="estadoAbierto()"
          [venta]="venta()"
          (cerrar)="estadoAbierto.set(false)"
          (guardado)="onActualizada($event)" />

      } @else {
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-12 text-center">
          <p class="text-[#2D2926]/45 text-sm">No se encontró la venta.</p>
        </div>
      }
    </div>
  `,
})
export class VentaDetallePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly svc = inject(VentaService);
  private readonly store = inject(AuthStore);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly venta = signal<VentaResponse | null>(null);
  readonly estadoAbierto = signal(false);

  readonly puedeGestionar = computed(() => this.store.hasPermission('venta:change-status'));
  readonly puedeEliminar = computed(() => this.store.hasPermission('venta:delete'));
  readonly hayTransiciones = computed(() => {
    const v = this.venta();
    return v ? transicionesVenta(v.estado).length > 0 : false;
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.cargar(id);
  }

  private cargar(id: number): void {
    this.loading.set(true);
    this.svc.obtenerPorId(id).subscribe({
      next: (v) => { this.venta.set(v); this.loading.set(false); },
      error: () => { this.venta.set(null); this.loading.set(false); },
    });
  }

  onActualizada(v: VentaResponse): void {
    this.venta.set(v);
    this.estadoAbierto.set(false);
  }

  async eliminar(v: VentaResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Eliminar venta',
      message: `¿Eliminar la venta ${v.codigoVenta}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.svc.eliminar(v.ventaId).subscribe({
      next: () => {
        this.toastr.success('Venta eliminada.');
        this.router.navigate(['/pos']);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.toastr.error(err.friendlyMessage ?? 'No se pudo eliminar la venta.', 'Error');
      },
    });
  }

  volver(): void { this.location.back(); }

  estadoLabel(e: EstadoVenta): string { return ESTADO_LABEL[e]; }
  estadoBadge(e: EstadoVenta): string { return ESTADO_BADGE[e]; }
  tipoLabel(t: TipoVenta): string { return TIPO_LABEL[t]; }
  monto(n: number): string { return formatMonto(n); }
}
