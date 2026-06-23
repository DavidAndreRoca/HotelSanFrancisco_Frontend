import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { PedidosServicioService } from '../../services/pedidos-servicio.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { PageResponse } from '../../../../core/api/api-response.interface';
import { EstadoPedido, PedidoServicio } from '../../models/servicio.model';
import { RechazarPedidoModalComponent } from '../../components/rechazar-pedido-modal.component';

const PAGE_SIZE = 20;

type FiltroEstado = '' | EstadoPedido;

interface FiltroTab {
  value: FiltroEstado;
  label: string;
}

@Component({
  selector: 'app-bandeja-pedidos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RechazarPedidoModalComponent],
  template: `
    <div class="space-y-6">

      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-[#2D2926]">Pedidos de servicio</h1>
          <p class="text-sm text-[#2D2926]/55 mt-0.5">
            Aprueba o rechaza los servicios solicitados por los huéspedes.
          </p>
        </div>
      </div>

      <!-- Filtro por estado -->
      <div class="flex items-center gap-1.5 flex-wrap">
        @for (t of tabs; track t.value) {
          <button type="button" (click)="onFiltro(t.value)"
            class="h-9 px-4 rounded-lg text-sm font-medium transition-colors border"
            [class]="fEstado() === t.value
              ? 'bg-[#C5A048] text-white border-[#C5A048]'
              : 'bg-white text-[#2D2926]/70 border-[#EEE3D1] hover:bg-[#F9F5F0]'">
            {{ t.label }}
          </button>
        }
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden">
        @if (loading()) {
          <div class="p-5 space-y-3">
            @for (_ of [1,2,3,4,5]; track $index) {
              <div class="h-11 bg-[#EEE3D1] rounded-lg animate-pulse"></div>
            }
          </div>
        } @else if (filas().length === 0) {
          <div class="py-16 text-center">
            <p class="text-sm font-semibold text-[#2D2926]">Sin pedidos</p>
            <p class="text-xs text-[#2D2926]/45 mt-1">No hay pedidos con el filtro aplicado.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[960px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold w-8"></th>
                  <th class="px-4 py-3 font-semibold">Huésped</th>
                  <th class="px-4 py-3 font-semibold">Reserva</th>
                  <th class="px-4 py-3 font-semibold">Servicio</th>
                  <th class="px-4 py-3 font-semibold text-right">Cantidad</th>
                  <th class="px-4 py-3 font-semibold text-right">Subtotal</th>
                  <th class="px-4 py-3 font-semibold">Estado</th>
                  <th class="px-4 py-3 font-semibold whitespace-nowrap">Solicitado</th>
                  <th class="px-4 py-3 font-semibold text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (p of filas(); track p.pedidoServicioId) {
                  <tr class="border-b border-[#EEE3D1] hover:bg-[#F9F5F0] transition-colors"
                      [style.background-color]="expandido() === p.pedidoServicioId ? '#F9F5F0' : null">
                    <td class="px-4 py-3 text-[#2D2926]/40 cursor-pointer" (click)="toggle(p.pedidoServicioId)">
                      <svg class="w-4 h-4 transition-transform"
                           [class.rotate-90]="expandido() === p.pedidoServicioId"
                           fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </td>
                    <td class="px-4 py-3 font-medium text-[#2D2926] whitespace-nowrap">{{ p.solicitanteNombre }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 font-mono whitespace-nowrap">{{ p.codReserva }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">{{ p.tipoServicioNombre }}</td>
                    <td class="px-4 py-3 text-right text-[#2D2926]/70">{{ p.cantidad }}</td>
                    <td class="px-4 py-3 text-right font-bold text-[#2D2926] whitespace-nowrap">{{ formatMonto(p.subtotalEstimado) }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
                            [class]="estadoBadge(p.estado)">{{ estadoLabel(p.estado) }}</span>
                    </td>
                    <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">{{ formatFecha(p.fechaSolicitud) }}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      @if (p.estado === 'PENDIENTE' && puedeGestionar()) {
                        <div class="flex items-center justify-end gap-2">
                          <button type="button" (click)="aprobar(p)" [disabled]="procesandoId() === p.pedidoServicioId"
                            class="h-7 px-2.5 rounded-lg border border-emerald-300 text-emerald-700
                                   text-xs font-medium hover:bg-emerald-50 disabled:opacity-40
                                   disabled:cursor-not-allowed transition-colors">
                            {{ procesandoId() === p.pedidoServicioId ? 'Aprobando…' : 'Aprobar' }}
                          </button>
                          <button type="button" (click)="abrirRechazo(p)" [disabled]="procesandoId() === p.pedidoServicioId"
                            class="h-7 px-2.5 rounded-lg border border-red-200 text-red-600
                                   text-xs font-medium hover:bg-red-50 disabled:opacity-40
                                   disabled:cursor-not-allowed transition-colors">
                            Rechazar
                          </button>
                        </div>
                      } @else {
                        <span class="text-xs text-[#2D2926]/40">—</span>
                      }
                    </td>
                  </tr>

                  @if (expandido() === p.pedidoServicioId) {
                    <tr class="bg-[#F9F5F0]/60 border-b border-[#EEE3D1]">
                      <td colspan="9" class="px-6 py-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Precio unitario</p>
                            <p class="text-sm text-[#2D2926]">{{ formatMonto(p.costoBase) }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Estancia</p>
                            <p class="text-sm text-[#2D2926] font-mono">#{{ p.estanciaId }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Fecha de respuesta</p>
                            <p class="text-sm text-[#2D2926]">{{ p.fechaRespuesta ? formatFecha(p.fechaRespuesta) : '—' }}</p>
                          </div>
                          <div class="sm:col-span-2 lg:col-span-3">
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Observaciones del cliente</p>
                            <p class="text-sm text-[#2D2926]">{{ p.observaciones ?? '—' }}</p>
                          </div>
                          @if (p.estado === 'RECHAZADO' && p.motivoRespuesta) {
                            <div class="sm:col-span-2 lg:col-span-3">
                              <p class="text-[11px] text-[#2D2926]/50 font-medium">Motivo del rechazo</p>
                              <p class="text-sm text-red-600">{{ p.motivoRespuesta }}</p>
                            </div>
                          }
                          @if (p.estado === 'APROBADO') {
                            <div class="sm:col-span-2 lg:col-span-3">
                              <p class="text-sm text-emerald-700">
                                ✓ Aprobado — se generó el consumo facturable@if (p.servicioId) { (servicio #{{ p.servicioId }})}.
                              </p>
                            </div>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#EEE3D1]">
            <p class="text-xs text-[#2D2926]/50">
              {{ totalElements() }} pedido(s) · Página {{ pageIndex() + 1 }} de {{ totalPages() }}
            </p>
            <div class="flex items-center gap-2">
              <button type="button" (click)="paginaAnterior()" [disabled]="pageIndex() === 0"
                class="h-8 px-3 rounded-lg border border-[#EEE3D1] text-xs font-medium
                       text-[#2D2926]/70 hover:bg-[#F9F5F0] disabled:opacity-40
                       disabled:cursor-not-allowed transition-colors">Anterior</button>
              <button type="button" (click)="paginaSiguiente()" [disabled]="esUltima()"
                class="h-8 px-3 rounded-lg border border-[#EEE3D1] text-xs font-medium
                       text-[#2D2926]/70 hover:bg-[#F9F5F0] disabled:opacity-40
                       disabled:cursor-not-allowed transition-colors">Siguiente</button>
            </div>
          </div>
        }
      </div>

      <app-rechazar-pedido-modal
        [open]="modalAbierto()"
        [pedido]="pedidoSel()"
        (cerrar)="modalAbierto.set(false)"
        (rechazado)="onResuelto()" />

    </div>
  `,
})
export class BandejaPedidosPage {
  private readonly svc = inject(PedidosServicioService);
  private readonly store = inject(AuthStore);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly tabs: FiltroTab[] = [
    { value: 'PENDIENTE', label: 'Pendientes' },
    { value: 'APROBADO', label: 'Aprobados' },
    { value: 'RECHAZADO', label: 'Rechazados' },
    { value: 'CANCELADO', label: 'Cancelados' },
    { value: '', label: 'Todos' },
  ];

  readonly loading = signal(true);
  readonly page = signal<PageResponse<PedidoServicio> | null>(null);
  readonly pageIndex = signal(0);
  readonly expandido = signal<number | null>(null);
  readonly fEstado = signal<FiltroEstado>('PENDIENTE');
  readonly procesandoId = signal<number | null>(null);

  readonly modalAbierto = signal(false);
  readonly pedidoSel = signal<PedidoServicio | null>(null);

  readonly filas = computed(() => this.page()?.content ?? []);
  readonly totalElements = computed(() => this.page()?.totalElements ?? 0);
  readonly totalPages = computed(() => Math.max(1, this.page()?.totalPages ?? 1));
  readonly esUltima = computed(() => this.page()?.last ?? true);

  readonly puedeGestionar = computed(() => this.store.hasPermission('servicio:create'));

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.svc
      .listar({
        estado: this.fEstado() || undefined,
        page: this.pageIndex(),
        size: PAGE_SIZE,
      })
      .subscribe({
        next: (p) => { this.page.set(p); this.loading.set(false); },
        error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
          this.loading.set(false);
          this.toastr.error(err.friendlyMessage ?? 'No se pudieron cargar los pedidos.', 'Error');
        },
      });
  }

  onFiltro(estado: FiltroEstado): void {
    this.fEstado.set(estado);
    this.pageIndex.set(0);
    this.expandido.set(null);
    this.cargar();
  }

  toggle(id: number): void {
    this.expandido.update((a) => (a === id ? null : id));
  }

  paginaAnterior(): void {
    if (this.pageIndex() === 0) return;
    this.pageIndex.update((p) => p - 1);
    this.expandido.set(null);
    this.cargar();
  }

  paginaSiguiente(): void {
    if (this.esUltima()) return;
    this.pageIndex.update((p) => p + 1);
    this.expandido.set(null);
    this.cargar();
  }

  async aprobar(p: PedidoServicio): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Aprobar pedido',
      message: `¿Aprobar el pedido de "${p.tipoServicioNombre}" de ${p.solicitanteNombre}? Se generará el consumo facturable en su estadía.`,
      confirmText: 'Sí, aprobar',
      cancelText: 'Cancelar',
    });
    if (!ok) return;
    this.procesandoId.set(p.pedidoServicioId);
    this.svc.aprobar(p.pedidoServicioId).subscribe({
      next: () => {
        this.procesandoId.set(null);
        this.toastr.success('Pedido aprobado. Se generó el consumo.');
        this.cargar();
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.procesandoId.set(null);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo aprobar el pedido.', 'Error');
      },
    });
  }

  abrirRechazo(p: PedidoServicio): void {
    this.pedidoSel.set(p);
    this.modalAbierto.set(true);
  }

  onResuelto(): void {
    this.modalAbierto.set(false);
    this.cargar();
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
      month: 'short',
      year: 'numeric',
    });
  }
}
