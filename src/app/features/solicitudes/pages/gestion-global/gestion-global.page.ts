import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { SolicitudService } from '../../services/solicitud.service';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { PageResponse } from '../../../../core/api/api-response.interface';
import {
  EstadoSolicitud,
  ModuloReferido,
  PrioridadSolicitud,
  SolicitudFilterRequest,
  SolicitudReporteResponse,
  SolicitudResponse,
  TipoSolicitud,
} from '../../models/solicitud.model';
import {
  ESTADO_BADGE,
  ESTADO_LABEL,
  PRIORIDAD_BADGE,
  PRIORIDAD_LABEL,
  TIPO_BADGE,
  TIPO_LABEL,
} from '../../utils/solicitud-ui';
import { AtenderSolicitudModalComponent } from '../../components/atender-solicitud-modal.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-gestion-global-solicitudes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AtenderSolicitudModalComponent],
  template: `
    <div class="space-y-6">

      <div>
        <h1 class="text-2xl font-bold text-[#2D2926]">Gestión Global de Solicitudes</h1>
        <p class="text-sm text-[#2D2926]/55 mt-0.5">Todas las solicitudes del sistema</p>
      </div>

      <!-- KPIs -->
      @if (reporte(); as r) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl border border-[#EEE3D1] p-5">
            <p class="text-xs text-[#2D2926]/50">Total solicitudes</p>
            <p class="text-2xl font-bold text-[#2D2926] mt-1">{{ r.total }}</p>
          </div>
          <div class="bg-white rounded-2xl border border-[#EEE3D1] p-5">
            <p class="text-xs text-[#2D2926]/50">Pendientes</p>
            <p class="text-2xl font-bold text-amber-600 mt-1">{{ r.pendientes }}</p>
          </div>
          <div class="bg-white rounded-2xl border border-[#EEE3D1] p-5">
            <p class="text-xs text-[#2D2926]/50">Cerradas</p>
            <p class="text-2xl font-bold text-[#2D2926] mt-1">{{ r.cerradas }}</p>
          </div>
          <div class="bg-white rounded-2xl border border-[#EEE3D1] p-5">
            <p class="text-xs text-[#2D2926]/50">Tasa de resolución</p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">{{ tasaResolucion() }}%</p>
          </div>
        </div>

        <!-- Desglose por estado -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-white rounded-2xl border border-[#EEE3D1] p-5">
            <h2 class="text-sm font-bold text-[#2D2926] mb-4">Por estado</h2>
            <div class="space-y-2.5">
              @for (e of estados; track e) {
                <div class="flex items-center gap-3">
                  <span class="w-28 text-xs text-[#2D2926]/65 shrink-0">{{ estadoLabel(e) }}</span>
                  <div class="flex-1 h-2.5 rounded-full bg-[#F9F5F0] overflow-hidden">
                    <div class="h-full rounded-full bg-[#C5A048]"
                         [style.width.%]="pct(r.porEstado[e], r.total)"></div>
                  </div>
                  <span class="w-8 text-right text-xs font-semibold text-[#2D2926]">
                    {{ r.porEstado[e] }}
                  </span>
                </div>
              }
            </div>
          </div>

          <!-- Desglose por tipo -->
          <div class="bg-white rounded-2xl border border-[#EEE3D1] p-5">
            <h2 class="text-sm font-bold text-[#2D2926] mb-4">Por tipo</h2>
            <div class="space-y-2.5">
              @for (t of tipos; track t) {
                <div class="flex items-center gap-3">
                  <span class="w-28 text-xs text-[#2D2926]/65 shrink-0">{{ tipoLabel(t) }}</span>
                  <div class="flex-1 h-2.5 rounded-full bg-[#F9F5F0] overflow-hidden">
                    <div class="h-full rounded-full bg-[#8E6F2E]"
                         [style.width.%]="pct(r.porTipo[t], r.total)"></div>
                  </div>
                  <span class="w-8 text-right text-xs font-semibold text-[#2D2926]">
                    {{ r.porTipo[t] }}
                  </span>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Filtros -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select [value]="fEstado()" (change)="onFiltro('estado', $any($event.target).value)"
            class="h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm text-[#2D2926]
                   focus:outline-none focus:border-[#C5A048]">
            <option value="">Estado: todos</option>
            @for (e of estados; track e) { <option [value]="e">{{ estadoLabel(e) }}</option> }
          </select>
          <select [value]="fTipo()" (change)="onFiltro('tipo', $any($event.target).value)"
            class="h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm text-[#2D2926]
                   focus:outline-none focus:border-[#C5A048]">
            <option value="">Tipo: todos</option>
            @for (t of tipos; track t) { <option [value]="t">{{ tipoLabel(t) }}</option> }
          </select>
          <select [value]="fPrioridad()" (change)="onFiltro('prioridad', $any($event.target).value)"
            class="h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm text-[#2D2926]
                   focus:outline-none focus:border-[#C5A048]">
            <option value="">Prioridad: todas</option>
            @for (p of prioridades; track p) { <option [value]="p">{{ prioridadLabel(p) }}</option> }
          </select>
          <input type="number" [value]="fResponsable()" placeholder="ID responsable"
            (change)="onFiltro('responsable', $any($event.target).value)"
            class="h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm text-[#2D2926]
                   placeholder:text-[#2D2926]/35 focus:outline-none focus:border-[#C5A048]" />
        </div>
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden">
        @if (loading()) {
          <div class="p-5 space-y-3">
            @for (_ of [1,2,3,4,5]; track $index) {
              <div class="h-12 bg-[#EEE3D1] rounded-lg animate-pulse"></div>
            }
          </div>
        } @else if (filas().length === 0) {
          <div class="py-16 text-center">
            <p class="text-sm font-semibold text-[#2D2926]">Sin solicitudes</p>
            <p class="text-xs text-[#2D2926]/45 mt-1">No hay solicitudes con los filtros aplicados.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[1000px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold">Código</th>
                  <th class="px-4 py-3 font-semibold">Tipo</th>
                  <th class="px-4 py-3 font-semibold">Asunto</th>
                  <th class="px-4 py-3 font-semibold">Solicitante</th>
                  <th class="px-4 py-3 font-semibold">Prioridad</th>
                  <th class="px-4 py-3 font-semibold">Estado</th>
                  <th class="px-4 py-3 font-semibold whitespace-nowrap">Responsable</th>
                  <th class="px-4 py-3 font-semibold text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (s of filas(); track s.solicitudId) {
                  <tr class="border-b border-[#EEE3D1] last:border-0 hover:bg-[#F9F5F0] transition-colors">
                    <td class="px-4 py-3 font-mono text-xs font-semibold text-[#C5A048] whitespace-nowrap
                               cursor-pointer" (click)="abrirAtender(s)">
                      {{ s.codigoSolicitud }}
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            [class]="tipoBadge(s)">{{ tipoLabel2(s) }}</span>
                    </td>
                    <td class="px-4 py-3 text-[#2D2926]" [title]="s.asunto">{{ truncar(s.asunto) }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70">{{ s.solicitanteNombre }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            [class]="prioridadBadge(s)">{{ prioridadLabel2(s) }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            [class]="estadoBadge(s.estado)">{{ estadoLabel(s.estado) }}</span>
                    </td>
                    <td class="px-4 py-3 text-[#2D2926]/70">{{ s.responsableNombre ?? '—' }}</td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      <div class="flex items-center justify-end gap-2">
                        <button type="button" (click)="abrirAtender(s)"
                          class="h-7 px-2.5 rounded-lg border border-[#C5A048] text-[#C5A048]
                                 text-xs font-medium hover:bg-[#C5A048]/5 transition-colors">
                          Atender
                        </button>
                        <button type="button" (click)="eliminar(s)"
                          class="h-7 px-2.5 rounded-lg border border-red-200 text-red-600
                                 text-xs font-medium hover:bg-red-50 transition-colors">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <div class="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#EEE3D1]">
            <p class="text-xs text-[#2D2926]/50">
              {{ totalElements() }} solicitud(es) · Página {{ pageIndex() + 1 }} de {{ totalPages() }}
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

      <!-- Modal Atender -->
      <app-atender-solicitud-modal
        [open]="atenderAbierto()"
        [solicitud]="solicitudSel()"
        (cerrar)="atenderAbierto.set(false)"
        (guardado)="onAtendida()" />

    </div>
  `,
})
export class GestionGlobalSolicitudesPage {
  private readonly svc = inject(SolicitudService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly page = signal<PageResponse<SolicitudResponse> | null>(null);
  readonly reporte = signal<SolicitudReporteResponse | null>(null);
  readonly pageIndex = signal(0);

  readonly fEstado = signal<EstadoSolicitud | ''>('');
  readonly fTipo = signal<TipoSolicitud | ''>('');
  readonly fPrioridad = signal<PrioridadSolicitud | ''>('');
  readonly fResponsable = signal<string>('');

  readonly atenderAbierto = signal(false);
  readonly solicitudSel = signal<SolicitudResponse | null>(null);

  readonly estados: EstadoSolicitud[] = [
    'REGISTRADA', 'EN_EVALUACION', 'ATENDIDA', 'APROBADA', 'RECHAZADA', 'CERRADA',
  ];
  readonly tipos: TipoSolicitud[] = ['INFORMACION', 'ACCESO'];
  readonly prioridades: PrioridadSolicitud[] = ['ALTA', 'MEDIA', 'BAJA'];

  readonly filas = computed(() => this.page()?.content ?? []);
  readonly totalElements = computed(() => this.page()?.totalElements ?? 0);
  readonly totalPages = computed(() => Math.max(1, this.page()?.totalPages ?? 1));
  readonly esUltima = computed(() => this.page()?.last ?? true);

  readonly tasaResolucion = computed(() => {
    const r = this.reporte();
    if (!r || r.total === 0) return 0;
    return Math.round(((r.total - r.pendientes) / r.total) * 100);
  });

  constructor() {
    this.cargarReporte();
    this.cargarTabla();
  }

  private cargarReporte(): void {
    this.svc
      .obtenerReporte()
      .pipe(catchError(() => of(null)))
      .subscribe((r) => this.reporte.set(r));
  }

  private cargarTabla(): void {
    this.loading.set(true);
    const filtros: SolicitudFilterRequest = {
      estado: this.fEstado() || undefined,
      tipoSolicitud: this.fTipo() || undefined,
      prioridad: this.fPrioridad() || undefined,
      responsableId: this.fResponsable() ? Number(this.fResponsable()) : undefined,
      page: this.pageIndex(),
      size: PAGE_SIZE,
      sort: 'fechaRegistro,desc',
    };
    this.svc.listar(filtros).subscribe({
      next: (p) => {
        this.page.set(p);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.loading.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudieron cargar las solicitudes.', 'Error');
      },
    });
  }

  onFiltro(campo: 'estado' | 'tipo' | 'prioridad' | 'responsable', valor: string): void {
    switch (campo) {
      case 'estado':      this.fEstado.set(valor as EstadoSolicitud | ''); break;
      case 'tipo':        this.fTipo.set(valor as TipoSolicitud | ''); break;
      case 'prioridad':   this.fPrioridad.set(valor as PrioridadSolicitud | ''); break;
      case 'responsable': this.fResponsable.set(valor); break;
    }
    this.pageIndex.set(0);
    this.cargarTabla();
  }

  paginaAnterior(): void {
    if (this.pageIndex() === 0) return;
    this.pageIndex.update((p) => p - 1);
    this.cargarTabla();
  }

  paginaSiguiente(): void {
    if (this.esUltima()) return;
    this.pageIndex.update((p) => p + 1);
    this.cargarTabla();
  }

  abrirAtender(s: SolicitudResponse): void {
    this.solicitudSel.set(s);
    this.atenderAbierto.set(true);
  }

  onAtendida(): void {
    this.atenderAbierto.set(false);
    this.cargarReporte();
    this.cargarTabla();
  }

  async eliminar(s: SolicitudResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Eliminar solicitud',
      message: `¿Eliminar definitivamente ${s.codigoSolicitud}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.svc.eliminar(s.solicitudId).subscribe({
      next: () => {
        this.toastr.success('Solicitud eliminada.');
        this.cargarReporte();
        this.cargarTabla();
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.toastr.error(err.friendlyMessage ?? 'No se pudo eliminar.', 'Error');
      },
    });
  }

  pct(valor: number | undefined, total: number): number {
    if (!total) return 0;
    return Math.round(((valor ?? 0) / total) * 100);
  }

  truncar(texto: string, max = 45): string {
    return texto.length > max ? texto.slice(0, max).trimEnd() + '…' : texto;
  }

  estadoLabel(e: EstadoSolicitud): string { return ESTADO_LABEL[e]; }
  estadoBadge(e: EstadoSolicitud): string { return ESTADO_BADGE[e]; }
  tipoLabel(t: TipoSolicitud): string { return TIPO_LABEL[t]; }
  tipoLabel2(s: SolicitudResponse): string { return TIPO_LABEL[s.tipoSolicitud]; }
  tipoBadge(s: SolicitudResponse): string { return TIPO_BADGE[s.tipoSolicitud]; }
  prioridadLabel(p: PrioridadSolicitud): string { return PRIORIDAD_LABEL[p]; }
  prioridadLabel2(s: SolicitudResponse): string { return PRIORIDAD_LABEL[s.prioridad]; }
  prioridadBadge(s: SolicitudResponse): string { return PRIORIDAD_BADGE[s.prioridad]; }
}
