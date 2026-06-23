import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { MisServiciosService } from '../../services/mis-servicios.service';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { EstadoPedido, PedidoServicio } from '../../models/servicio.model';

// Tarjetas altas (crecen con el motivo de rechazo); 5 por página llena bien.
const PAGE_SIZE = 5;

@Component({
  selector: 'app-mis-pedidos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="space-y-6">

      <!-- Cabecera -->
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-[#2D2926]">Mis pedidos</h1>
          <p class="text-sm text-[#2D2926]/55 mt-0.5">
            Estado de los servicios que has solicitado.
          </p>
        </div>
        <a routerLink="/servicios-catalogo"
          class="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#C5A048] text-white
                 text-sm font-medium hover:bg-[#8E6F2E] transition-colors">
          Pedir servicio
        </a>
      </div>

      <!-- Skeleton de carga -->
      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1, 2, 3, 4]; track $index) {
            <div class="bg-white rounded-2xl border border-[#EEE3D1] h-24 animate-pulse"></div>
          }
        </div>

      <!-- Error -->
      } @else if (error()) {
        <div class="bg-white rounded-2xl border border-[#EEE3D1] py-16 flex flex-col items-center gap-3">
          <p class="text-sm font-semibold text-[#2D2926]">No se pudieron cargar tus pedidos</p>
          <button type="button" (click)="cargar()"
            class="mt-1 h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                   hover:bg-[#8E6F2E] transition-colors">Reintentar</button>
        </div>

      <!-- Vacío -->
      } @else if (pedidos().length === 0) {
        <div class="bg-white rounded-2xl border border-[#EEE3D1] py-16 flex flex-col items-center gap-3">
          <div class="w-14 h-14 rounded-full bg-[#F9F5F0] flex items-center justify-center">
            <svg class="w-7 h-7 text-[#C5A048]/60" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0
                       00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2
                       2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
          </div>
          <p class="text-sm font-semibold text-[#2D2926]">Aún no tienes pedidos</p>
          <p class="text-xs text-[#2D2926]/45">Pide un servicio desde el catálogo durante tu estadía.</p>
        </div>

      <!-- Lista -->
      } @else {
        <div class="space-y-3">
          @for (p of pedidosPagina(); track p.pedidoServicioId) {
            <div class="bg-white rounded-2xl border border-[#EEE3D1] p-5">
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-base font-semibold text-[#2D2926]">{{ p.tipoServicioNombre }}</span>
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                          [class]="estadoBadge(p.estado)">{{ estadoLabel(p.estado) }}</span>
                  </div>
                  <p class="text-xs text-[#2D2926]/55 mt-1">
                    Cantidad: {{ p.cantidad }} · {{ formatMonto(p.costoBase) }} c/u · {{ formatFecha(p.fechaSolicitud) }}
                  </p>
                  @if (p.observaciones) {
                    <p class="text-xs text-[#2D2926]/55 mt-1">
                      <span class="font-medium">Nota:</span> {{ p.observaciones }}
                    </p>
                  }
                  @if (p.estado === 'RECHAZADO' && p.motivoRespuesta) {
                    <p class="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-2">
                      <span class="font-semibold">Motivo del rechazo:</span> {{ p.motivoRespuesta }}
                    </p>
                  }
                </div>

                <div class="flex flex-row sm:flex-col items-center sm:items-end justify-between
                            gap-2 w-full sm:w-auto sm:shrink-0">
                  <span class="text-lg font-bold text-[#2D2926]">{{ formatMonto(p.subtotalEstimado) }}</span>
                  @if (p.estado === 'PENDIENTE') {
                    <button type="button" (click)="cancelar(p)" [disabled]="cancelandoId() === p.pedidoServicioId"
                      class="h-8 px-3 rounded-lg border border-red-200 text-red-600 text-xs font-medium
                             hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      {{ cancelandoId() === p.pedidoServicioId ? 'Cancelando…' : 'Cancelar' }}
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Paginación -->
        @if (totalPages() > 1) {
          <div class="flex items-center justify-between gap-3 pt-1">
            <p class="text-xs text-[#2D2926]/50">
              {{ pedidos().length }} pedido(s) · Página {{ pageIndex() + 1 }} de {{ totalPages() }}
            </p>
            <div class="flex items-center gap-2">
              <button type="button" (click)="paginaAnterior()" [disabled]="pageIndex() === 0"
                class="h-8 px-3 rounded-lg border border-[#EEE3D1] text-xs font-medium
                       text-[#2D2926]/70 hover:bg-[#F9F5F0] disabled:opacity-40
                       disabled:cursor-not-allowed transition-colors">Anterior</button>
              <button type="button" (click)="paginaSiguiente()" [disabled]="pageIndex() >= totalPages() - 1"
                class="h-8 px-3 rounded-lg border border-[#EEE3D1] text-xs font-medium
                       text-[#2D2926]/70 hover:bg-[#F9F5F0] disabled:opacity-40
                       disabled:cursor-not-allowed transition-colors">Siguiente</button>
            </div>
          </div>
        }
      }

    </div>
  `,
})
export class MisPedidosPage {
  private readonly svc = inject(MisServiciosService);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly pedidos = signal<PedidoServicio[]>([]);
  readonly cancelandoId = signal<number | null>(null);
  readonly pageIndex = signal(0);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.pedidos().length / PAGE_SIZE)),
  );

  readonly pedidosPagina = computed(() => {
    const start = this.pageIndex() * PAGE_SIZE;
    return this.pedidos().slice(start, start + PAGE_SIZE);
  });

  constructor() {
    this.cargar();
  }

  paginaAnterior(): void {
    if (this.pageIndex() === 0) return;
    this.pageIndex.update((p) => p - 1);
  }

  paginaSiguiente(): void {
    if (this.pageIndex() >= this.totalPages() - 1) return;
    this.pageIndex.update((p) => p + 1);
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(false);
    this.svc.listar().subscribe({
      next: (data) => {
        this.pedidos.set(data ?? []);
        this.pageIndex.set(0);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  async cancelar(p: PedidoServicio): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Cancelar pedido',
      message: `¿Cancelar el pedido de "${p.tipoServicioNombre}"?`,
      confirmText: 'Sí, cancelar',
      cancelText: 'No',
      variant: 'danger',
    });
    if (!ok) return;
    this.cancelandoId.set(p.pedidoServicioId);
    this.svc.cancelar(p.pedidoServicioId).subscribe({
      next: () => {
        this.cancelandoId.set(null);
        this.toastr.success('Pedido cancelado.');
        this.cargar();
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.cancelandoId.set(null);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo cancelar el pedido.', 'Error');
      },
    });
  }

  estadoLabel(e: EstadoPedido): string {
    const map: Record<EstadoPedido, string> = {
      PENDIENTE: 'Pendiente',
      APROBADO: 'Aprobado',
      RECHAZADO: 'Rechazado',
      CANCELADO: 'Cancelado',
    };
    return map[e];
  }

  estadoBadge(e: EstadoPedido): string {
    const map: Record<EstadoPedido, string> = {
      PENDIENTE: 'bg-amber-100 text-amber-800',
      APROBADO: 'bg-emerald-100 text-emerald-700',
      RECHAZADO: 'bg-red-100 text-red-600',
      CANCELADO: 'bg-gray-100 text-gray-600',
    };
    return map[e];
  }

  formatMonto(n: number): string {
    return 'S/. ' + n.toLocaleString('en-US');
  }

  formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
