import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { debounceTime } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { VentaService } from '../../services/venta.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { WebSocketService } from '../../../../core/websocket/websocket.service';
import { WS_TOPICS } from '../../../../core/websocket/websocket-channels';
import { PageResponse } from '../../../../core/api/api-response.interface';
import {
  EstadoVenta,
  TipoVenta,
  VentaFilterRequest,
  VentaResponse,
} from '../../models/venta.model';
import {
  ESTADO_BADGE,
  ESTADO_LABEL,
  TIPOS_VENTA,
  TIPO_LABEL,
  formatMonto,
} from '../../utils/venta-ui';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-ventas-lista',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">

      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-[#2D2926]">Punto de venta</h1>
          <p class="text-sm text-[#2D2926]/55 mt-0.5">Ventas registradas en el sistema</p>
        </div>
        @if (puedeCrear()) {
          <button type="button" (click)="nuevaVenta()"
            class="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#C5A048] text-white
                   text-sm font-medium hover:bg-[#8E6F2E] transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Nueva venta
          </button>
        }
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input type="text" [value]="fCodigo()" (change)="onFiltro('codigo', $any($event.target).value)"
            placeholder="Código…"
            class="h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm text-[#2D2926]
                   placeholder:text-[#2D2926]/35 focus:outline-none focus:border-[#C5A048]" />
          <select [value]="fEstado()" (change)="onFiltro('estado', $any($event.target).value)"
            class="h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm text-[#2D2926]
                   focus:outline-none focus:border-[#C5A048]">
            <option value="">Estado: todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="COMPLETADA">Completada</option>
            <option value="ANULADA">Anulada</option>
          </select>
          <select [value]="fTipo()" (change)="onFiltro('tipo', $any($event.target).value)"
            class="h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm text-[#2D2926]
                   focus:outline-none focus:border-[#C5A048]">
            <option value="">Tipo: todos</option>
            @for (t of tipos; track t) { <option [value]="t">{{ tipoLabel(t) }}</option> }
          </select>
          <input type="date" [value]="fDesde()" (change)="onFiltro('desde', $any($event.target).value)"
            class="h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm text-[#2D2926]
                   focus:outline-none focus:border-[#C5A048]" />
          <input type="date" [value]="fHasta()" (change)="onFiltro('hasta', $any($event.target).value)"
            class="h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm text-[#2D2926]
                   focus:outline-none focus:border-[#C5A048]" />
        </div>
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
            <p class="text-sm font-semibold text-[#2D2926]">Sin ventas</p>
            <p class="text-xs text-[#2D2926]/45 mt-1">No hay ventas con los filtros aplicados.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[860px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold">Código</th>
                  <th class="px-4 py-3 font-semibold">Tipo</th>
                  <th class="px-4 py-3 font-semibold text-right">Total</th>
                  <th class="px-4 py-3 font-semibold">Cajero</th>
                  <th class="px-4 py-3 font-semibold whitespace-nowrap">Fecha</th>
                  <th class="px-4 py-3 font-semibold">Estado</th>
                  <th class="px-4 py-3 font-semibold text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (v of filas(); track v.ventaId) {
                  <tr (click)="verDetalle(v.ventaId)"
                    class="border-b border-[#EEE3D1] last:border-0 cursor-pointer
                           hover:bg-[#F9F5F0] transition-colors">
                    <td class="px-4 py-3 font-mono text-xs font-semibold text-[#C5A048] whitespace-nowrap">
                      {{ v.codigoVenta }}
                    </td>
                    <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">{{ tipoLabel(v.tipoVenta) }}</td>
                    <td class="px-4 py-3 text-right font-bold text-[#2D2926] whitespace-nowrap">{{ monto(v.montoTotal) }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">{{ v.usuarioNombre }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">{{ v.fechaVenta.slice(0,16).replace('T', ' ') }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            [class]="estadoBadge(v.estado)">{{ estadoLabel(v.estado) }}</span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      <button type="button" (click)="verDetalle(v.ventaId); $event.stopPropagation()"
                        class="h-7 px-2.5 rounded-lg border border-[#C5A048] text-[#C5A048]
                               text-xs font-medium hover:bg-[#C5A048]/5 transition-colors">
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#EEE3D1]">
            <p class="text-xs text-[#2D2926]/50">
              {{ totalElements() }} venta(s) · Página {{ pageIndex() + 1 }} de {{ totalPages() }}
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

    </div>
  `,
})
export class VentasListaPage {
  private readonly svc = inject(VentaService);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly ws = inject(WebSocketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly page = signal<PageResponse<VentaResponse> | null>(null);
  readonly pageIndex = signal(0);

  readonly fCodigo = signal('');
  readonly fEstado = signal<EstadoVenta | ''>('');
  readonly fTipo = signal<TipoVenta | ''>('');
  readonly fDesde = signal('');
  readonly fHasta = signal('');

  readonly tipos = TIPOS_VENTA;

  readonly filas = computed(() => this.page()?.content ?? []);
  readonly totalElements = computed(() => this.page()?.totalElements ?? 0);
  readonly totalPages = computed(() => Math.max(1, this.page()?.totalPages ?? 1));
  readonly esUltima = computed(() => this.page()?.last ?? true);

  readonly puedeCrear = computed(() => this.store.hasPermission('venta:create'));

  constructor() {
    this.cargar();
    this.ws
      .onTopic<unknown>(WS_TOPICS.ventas, this.destroyRef)
      .pipe(debounceTime(300))
      .subscribe(() => this.cargar());
  }

  private cargar(): void {
    this.loading.set(true);
    const filtros: VentaFilterRequest = {
      codigoVenta: this.fCodigo().trim() || undefined,
      estado: this.fEstado() || undefined,
      tipoVenta: this.fTipo() || undefined,
      fechaVentaDesde: this.fDesde() ? `${this.fDesde()}T00:00:00` : undefined,
      fechaVentaHasta: this.fHasta() ? `${this.fHasta()}T23:59:59` : undefined,
      page: this.pageIndex(),
      size: PAGE_SIZE,
      sort: 'fechaVenta,desc',
    };
    this.svc.listar(filtros).subscribe({
      next: (p) => { this.page.set(p); this.loading.set(false); },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.loading.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudieron cargar las ventas.', 'Error');
      },
    });
  }

  onFiltro(campo: 'codigo' | 'estado' | 'tipo' | 'desde' | 'hasta', valor: string): void {
    switch (campo) {
      case 'codigo': this.fCodigo.set(valor); break;
      case 'estado': this.fEstado.set(valor as EstadoVenta | ''); break;
      case 'tipo':   this.fTipo.set(valor as TipoVenta | ''); break;
      case 'desde':  this.fDesde.set(valor); break;
      case 'hasta':  this.fHasta.set(valor); break;
    }
    this.pageIndex.set(0);
    this.cargar();
  }

  paginaAnterior(): void {
    if (this.pageIndex() === 0) return;
    this.pageIndex.update((p) => p - 1);
    this.cargar();
  }

  paginaSiguiente(): void {
    if (this.esUltima()) return;
    this.pageIndex.update((p) => p + 1);
    this.cargar();
  }

  nuevaVenta(): void { this.router.navigate(['/pos/nueva']); }
  verDetalle(id: number): void { this.router.navigate(['/pos', id]); }

  estadoLabel(e: EstadoVenta): string { return ESTADO_LABEL[e]; }
  estadoBadge(e: EstadoVenta): string { return ESTADO_BADGE[e]; }
  tipoLabel(t: TipoVenta): string { return TIPO_LABEL[t]; }
  monto(n: number): string { return formatMonto(n); }
}
