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
import { TipoServicioService } from '../../services/tipo-servicio.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { PageResponse } from '../../../../core/api/api-response.interface';
import {
  EstadoActivo,
  TipoServicioFilterRequest,
  TipoServicioResponse,
} from '../../models/servicio.model';
import { TipoServicioFormModalComponent } from '../../components/tipo-servicio-form-modal.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-tipos-servicio-lista',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TipoServicioFormModalComponent],
  template: `
    <div class="space-y-6">

      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-[#2D2926]">Tipos de servicio</h1>
          <p class="text-sm text-[#2D2926]/55 mt-0.5">Catálogo de servicios del hotel</p>
        </div>
        <div class="flex items-center gap-2">
          <a routerLink="/servicios"
            class="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-[#EEE3D1]
                   text-sm font-medium text-[#2D2926]/70 hover:bg-[#F9F5F0] transition-colors">
            Consumos
          </a>
          @if (puedeGestionar()) {
            <button type="button" (click)="abrirNuevo()"
              class="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#C5A048] text-white
                     text-sm font-medium hover:bg-[#8E6F2E] transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Nuevo tipo
            </button>
          }
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="text" [value]="fNombre()" (change)="onFiltro('nombre', $any($event.target).value)"
            placeholder="Buscar servicio…"
            class="sm:col-span-2 h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] placeholder:text-[#2D2926]/35 focus:outline-none focus:border-[#C5A048]" />
          <select [value]="fEstado()" (change)="onFiltro('estado', $any($event.target).value)"
            class="h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm text-[#2D2926]
                   focus:outline-none focus:border-[#C5A048]">
            <option value="">Estado: todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden">
        @if (loading()) {
          <div class="p-5 space-y-3">
            @for (_ of [1,2,3,4]; track $index) {
              <div class="h-11 bg-[#EEE3D1] rounded-lg animate-pulse"></div>
            }
          </div>
        } @else if (filas().length === 0) {
          <div class="py-16 text-center">
            <p class="text-sm font-semibold text-[#2D2926]">Sin tipos de servicio</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[640px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold">Nombre</th>
                  <th class="px-4 py-3 font-semibold text-right">Costo base</th>
                  <th class="px-4 py-3 font-semibold">Descripción</th>
                  <th class="px-4 py-3 font-semibold">Estado</th>
                  <th class="px-4 py-3 font-semibold text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (t of filas(); track t.tipoServicioId) {
                  <tr class="border-b border-[#EEE3D1] last:border-0 hover:bg-[#F9F5F0] transition-colors">
                    <td class="px-4 py-3 font-medium text-[#2D2926] whitespace-nowrap">{{ t.nombre }}</td>
                    <td class="px-4 py-3 text-right text-[#2D2926]/70 whitespace-nowrap">S/. {{ t.costoBase }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70">{{ t.descripcion ?? '—' }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            [class]="estadoBadge(t.estado)">{{ estadoLabel(t.estado) }}</span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      @if (puedeGestionar()) {
                        <div class="flex items-center justify-end gap-2">
                          <button type="button" (click)="abrirEditar(t)"
                            class="h-7 px-2.5 rounded-lg border border-[#C5A048] text-[#C5A048]
                                   text-xs font-medium hover:bg-[#C5A048]/5 transition-colors">
                            Editar
                          </button>
                          <button type="button" (click)="eliminar(t)"
                            class="h-7 px-2.5 rounded-lg border border-red-200 text-red-600
                                   text-xs font-medium hover:bg-red-50 transition-colors">
                            Eliminar
                          </button>
                        </div>
                      } @else {
                        <span class="text-xs text-[#2D2926]/40">—</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#EEE3D1]">
            <p class="text-xs text-[#2D2926]/50">
              {{ totalElements() }} tipo(s) · Página {{ pageIndex() + 1 }} de {{ totalPages() }}
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

      <app-tipo-servicio-form-modal
        [open]="modalAbierto()"
        [tipo]="tipoSel()"
        (cerrar)="modalAbierto.set(false)"
        (guardado)="onMutacion()" />

    </div>
  `,
})
export class TiposServicioListaPage {
  private readonly svc = inject(TipoServicioService);
  private readonly store = inject(AuthStore);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly page = signal<PageResponse<TipoServicioResponse> | null>(null);
  readonly pageIndex = signal(0);

  readonly fNombre = signal('');
  readonly fEstado = signal<EstadoActivo | ''>('');

  readonly modalAbierto = signal(false);
  readonly tipoSel = signal<TipoServicioResponse | null>(null);

  readonly filas = computed(() => this.page()?.content ?? []);
  readonly totalElements = computed(() => this.page()?.totalElements ?? 0);
  readonly totalPages = computed(() => Math.max(1, this.page()?.totalPages ?? 1));
  readonly esUltima = computed(() => this.page()?.last ?? true);

  readonly puedeGestionar = computed(() => this.store.hasPermission('tipo-servicio:create'));

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    const filtros: TipoServicioFilterRequest = {
      nombre: this.fNombre().trim() || undefined,
      estado: this.fEstado() || undefined,
      page: this.pageIndex(),
      size: PAGE_SIZE,
      sort: 'nombre,asc',
    };
    this.svc.listarPaginado(filtros).subscribe({
      next: (p) => { this.page.set(p); this.loading.set(false); },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.loading.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudieron cargar los tipos.', 'Error');
      },
    });
  }

  onFiltro(campo: 'nombre' | 'estado', valor: string): void {
    if (campo === 'nombre') this.fNombre.set(valor);
    else this.fEstado.set(valor as EstadoActivo | '');
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

  abrirNuevo(): void { this.tipoSel.set(null); this.modalAbierto.set(true); }
  abrirEditar(t: TipoServicioResponse): void { this.tipoSel.set(t); this.modalAbierto.set(true); }

  onMutacion(): void {
    this.modalAbierto.set(false);
    this.cargar();
  }

  async eliminar(t: TipoServicioResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Eliminar tipo de servicio',
      message: `¿Eliminar "${t.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.svc.eliminar(t.tipoServicioId).subscribe({
      next: () => { this.toastr.success('Tipo de servicio eliminado.'); this.cargar(); },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.toastr.error(err.friendlyMessage ?? 'No se pudo eliminar.', 'Error');
      },
    });
  }

  estadoLabel(e: EstadoActivo): string { return e === 'ACTIVO' ? 'Activo' : 'Inactivo'; }
  estadoBadge(e: EstadoActivo): string {
    return e === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600';
  }
}
