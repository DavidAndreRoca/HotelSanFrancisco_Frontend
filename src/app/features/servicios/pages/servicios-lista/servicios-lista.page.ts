import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { catchError, debounceTime, of } from 'rxjs';
import { ServicioService } from '../../services/servicio.service';
import { TipoServicioService } from '../../services/tipo-servicio.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { WebSocketService } from '../../../../core/websocket/websocket.service';
import { WS_TOPICS } from '../../../../core/websocket/websocket-channels';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { PageResponse } from '../../../../core/api/api-response.interface';
import {
  ServicioFilterRequest,
  ServicioResponse,
  TipoServicioResponse,
} from '../../models/servicio.model';
import { ServicioFormModalComponent } from '../../components/servicio-form-modal.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-servicios-lista',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ServicioFormModalComponent],
  template: `
    <div class="space-y-6">

      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-[#2D2926]">Consumos de servicio</h1>
          <p class="text-sm text-[#2D2926]/55 mt-0.5">Servicios cargados a las estancias</p>
        </div>
        <div class="flex items-center gap-2">
          <a routerLink="/tipos-servicio"
            class="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-[#EEE3D1]
                   text-sm font-medium text-[#2D2926]/70 hover:bg-[#F9F5F0] transition-colors">
            Catálogo
          </a>
          @if (puedeCrear()) {
            <button type="button" (click)="abrirNuevo()"
              class="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#C5A048] text-white
                     text-sm font-medium hover:bg-[#8E6F2E] transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Registrar consumo
            </button>
          }
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Tipo de servicio</label>
            <select [value]="fTipo()" (change)="onFiltro('tipo', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              <option value="">Todos</option>
              @for (t of tipos(); track t.tipoServicioId) {
                <option [value]="t.tipoServicioId">{{ t.nombre }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Estancia (ID)</label>
            <input type="number" [value]="fEstancia()" (change)="onFiltro('estancia', $any($event.target).value)"
              placeholder="ID estancia"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] placeholder:text-[#2D2926]/35 focus:outline-none focus:border-[#C5A048]" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Desde</label>
            <input type="date" [value]="fDesde()" (change)="onFiltro('desde', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Hasta</label>
            <input type="date" [value]="fHasta()" (change)="onFiltro('hasta', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>
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
            <p class="text-sm font-semibold text-[#2D2926]">Sin consumos</p>
            <p class="text-xs text-[#2D2926]/45 mt-1">No hay servicios con los filtros aplicados.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[860px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold w-8"></th>
                  <th class="px-4 py-3 font-semibold">Servicio</th>
                  <th class="px-4 py-3 font-semibold">Estancia</th>
                  <th class="px-4 py-3 font-semibold text-right">Cantidad</th>
                  <th class="px-4 py-3 font-semibold text-right">Precio</th>
                  <th class="px-4 py-3 font-semibold text-right">Subtotal</th>
                  <th class="px-4 py-3 font-semibold whitespace-nowrap">Fecha</th>
                  <th class="px-4 py-3 font-semibold text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (s of filas(); track s.servicioId) {
                  <tr class="border-b border-[#EEE3D1] hover:bg-[#F9F5F0] transition-colors"
                      [style.background-color]="expandido() === s.servicioId ? '#F9F5F0' : null">
                    <td class="px-4 py-3 text-[#2D2926]/40 cursor-pointer" (click)="toggle(s.servicioId)">
                      <svg class="w-4 h-4 transition-transform"
                           [class.rotate-90]="expandido() === s.servicioId"
                           fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </td>
                    <td class="px-4 py-3 font-medium text-[#2D2926] whitespace-nowrap">{{ s.tipoServicioNombre }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 font-mono">#{{ s.estanciaId }}</td>
                    <td class="px-4 py-3 text-right text-[#2D2926]/70">{{ s.cantidad }}</td>
                    <td class="px-4 py-3 text-right text-[#2D2926]/70 whitespace-nowrap">S/. {{ s.precioAplicado }}</td>
                    <td class="px-4 py-3 text-right font-bold text-[#2D2926] whitespace-nowrap">S/. {{ s.subtotal }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">{{ s.fechaConsumo.slice(0,10) }}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      @if (puedeEditar() || puedeEliminar()) {
                        <div class="flex items-center justify-end gap-2">
                          @if (puedeEditar()) {
                            <button type="button" (click)="abrirEditar(s)"
                              class="h-7 px-2.5 rounded-lg border border-[#C5A048] text-[#C5A048]
                                     text-xs font-medium hover:bg-[#C5A048]/5 transition-colors">
                              Editar
                            </button>
                          }
                          @if (puedeEliminar()) {
                            <button type="button" (click)="eliminar(s)"
                              class="h-7 px-2.5 rounded-lg border border-red-200 text-red-600
                                     text-xs font-medium hover:bg-red-50 transition-colors">
                              Eliminar
                            </button>
                          }
                        </div>
                      } @else {
                        <span class="text-xs text-[#2D2926]/40">—</span>
                      }
                    </td>
                  </tr>

                  @if (expandido() === s.servicioId) {
                    <tr class="bg-[#F9F5F0]/60 border-b border-[#EEE3D1]">
                      <td colspan="8" class="px-6 py-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Registro</p>
                            <p class="text-sm text-[#2D2926] font-mono">#{{ s.servicioId }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Fecha de consumo</p>
                            <p class="text-sm text-[#2D2926]">{{ s.fechaConsumo }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Subtotal</p>
                            <p class="text-sm font-bold text-[#2D2926]">S/. {{ s.subtotal }}</p>
                          </div>
                          <div class="sm:col-span-2 lg:col-span-3">
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Observaciones</p>
                            <p class="text-sm text-[#2D2926]">{{ s.observaciones ?? '—' }}</p>
                          </div>
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
              {{ totalElements() }} consumo(s) · Página {{ pageIndex() + 1 }} de {{ totalPages() }}
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

      <app-servicio-form-modal
        [open]="modalAbierto()"
        [servicio]="servicioSel()"
        (cerrar)="modalAbierto.set(false)"
        (guardado)="onMutacion()" />

    </div>
  `,
})
export class ServiciosListaPage {
  private readonly svc = inject(ServicioService);
  private readonly tipoSvc = inject(TipoServicioService);
  private readonly store = inject(AuthStore);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly ws = inject(WebSocketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly page = signal<PageResponse<ServicioResponse> | null>(null);
  readonly pageIndex = signal(0);
  readonly expandido = signal<number | null>(null);
  readonly tipos = signal<TipoServicioResponse[]>([]);

  readonly fTipo = signal<string>('');
  readonly fEstancia = signal<string>('');
  readonly fDesde = signal('');
  readonly fHasta = signal('');

  readonly modalAbierto = signal(false);
  readonly servicioSel = signal<ServicioResponse | null>(null);

  readonly filas = computed(() => this.page()?.content ?? []);
  readonly totalElements = computed(() => this.page()?.totalElements ?? 0);
  readonly totalPages = computed(() => Math.max(1, this.page()?.totalPages ?? 1));
  readonly esUltima = computed(() => this.page()?.last ?? true);

  readonly puedeCrear = computed(() => this.store.hasPermission('servicio:create'));
  readonly puedeEditar = computed(() => this.store.hasPermission('servicio:update'));
  readonly puedeEliminar = computed(() => this.store.hasPermission('servicio:delete'));

  constructor() {
    this.tipoSvc
      .listarPorEstado('ACTIVO')
      .pipe(catchError(() => of([] as TipoServicioResponse[])))
      .subscribe((t) => this.tipos.set(t));
    this.cargar();
    this.ws
      .onTopic<unknown>(WS_TOPICS.servicios, this.destroyRef)
      .pipe(debounceTime(300))
      .subscribe(() => this.cargar());
  }

  private cargar(): void {
    this.loading.set(true);
    const filtros: ServicioFilterRequest = {
      tipoServicioId: this.fTipo() ? Number(this.fTipo()) : undefined,
      estanciaId: this.fEstancia() ? Number(this.fEstancia()) : undefined,
      fechaConsumoDesde: this.fDesde() || undefined,
      fechaConsumoHasta: this.fHasta() || undefined,
      page: this.pageIndex(),
      size: PAGE_SIZE,
      sort: 'fechaConsumo,desc',
    };
    this.svc.listar(filtros).subscribe({
      next: (p) => { this.page.set(p); this.loading.set(false); },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.loading.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudieron cargar los consumos.', 'Error');
      },
    });
  }

  onFiltro(campo: 'tipo' | 'estancia' | 'desde' | 'hasta', valor: string): void {
    switch (campo) {
      case 'tipo':     this.fTipo.set(valor); break;
      case 'estancia': this.fEstancia.set(valor); break;
      case 'desde':    this.fDesde.set(valor); break;
      case 'hasta':    this.fHasta.set(valor); break;
    }
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

  abrirNuevo(): void { this.servicioSel.set(null); this.modalAbierto.set(true); }
  abrirEditar(s: ServicioResponse): void { this.servicioSel.set(s); this.modalAbierto.set(true); }

  onMutacion(): void {
    this.modalAbierto.set(false);
    this.cargar();
  }

  async eliminar(s: ServicioResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Eliminar consumo',
      message: `¿Eliminar el consumo de "${s.tipoServicioNombre}" (estancia #${s.estanciaId})? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.svc.eliminar(s.servicioId).subscribe({
      next: () => { this.toastr.success('Consumo eliminado.'); this.cargar(); },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.toastr.error(err.friendlyMessage ?? 'No se pudo eliminar.', 'Error');
      },
    });
  }
}
