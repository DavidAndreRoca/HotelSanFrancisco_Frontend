import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SolicitudService } from '../../services/solicitud.service';
import { PageResponse } from '../../../../core/api/api-response.interface';
import {
  EstadoSolicitud,
  ModuloReferido,
  PrioridadSolicitud,
  SolicitudFilterRequest,
  SolicitudResponse,
  TipoSolicitud,
} from '../../models/solicitud.model';
import {
  ESTADO_BADGE,
  ESTADO_LABEL,
  MODULO_LABEL,
  PRIORIDAD_BADGE,
  PRIORIDAD_LABEL,
  TIPO_BADGE,
  TIPO_LABEL,
  resolverTier,
} from '../../utils/solicitud-ui';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-mis-solicitudes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">

      <!-- Cabecera -->
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-[#2D2926]">Mis Solicitudes</h1>
          <p class="text-sm text-[#2D2926]/55 mt-0.5">
            Tus solicitudes de información y acceso
          </p>
        </div>
        <button
          type="button"
          (click)="nuevaSolicitud()"
          class="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#C5A048] text-white
                 text-sm font-medium transition-colors hover:bg-[#8E6F2E]">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nueva solicitud
        </button>
      </div>

      <!-- Filtros (server-side) -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Estado</label>
            <select
              [value]="fEstado()"
              (change)="onFiltro('estado', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              <option value="">Todos</option>
              @for (e of estados; track e) {
                <option [value]="e">{{ estadoLabel(e) }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Tipo</label>
            <select
              [value]="fTipo()"
              (change)="onFiltro('tipo', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              <option value="">Todos</option>
              @for (t of tipos; track t) {
                <option [value]="t">{{ tipoLabel(t) }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Prioridad</label>
            <select
              [value]="fPrioridad()"
              (change)="onFiltro('prioridad', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              <option value="">Todas</option>
              @for (p of prioridades; track p) {
                <option [value]="p">{{ prioridadLabel(p) }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Módulo</label>
            <select
              [value]="fModulo()"
              (change)="onFiltro('modulo', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              <option value="">Todos</option>
              @for (m of modulos; track m) {
                <option [value]="m">{{ moduloLabel(m) }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Desde</label>
            <input
              type="date"
              [value]="fDesde()"
              (change)="onFiltro('desde', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Hasta</label>
            <input
              type="date"
              [value]="fHasta()"
              (change)="onFiltro('hasta', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>

          <!-- Buscador (solo sobre la página cargada) -->
          <div class="sm:col-span-2">
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">
              Buscar por código o asunto
            </label>
            <input
              type="text"
              [value]="busqueda()"
              (input)="busqueda.set($any($event.target).value)"
              placeholder="SOL-2026-001 o palabra clave…"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] placeholder:text-[#2D2926]/35
                     focus:outline-none focus:border-[#C5A048]" />
          </div>
        </div>

        @if (busqueda().trim()) {
          <p class="text-[11px] text-amber-700 mt-2 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            La búsqueda filtra solo las {{ filas().length }} solicitudes de la página actual,
            no todo el historial.
          </p>
        }
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden">

        @if (loading()) {
          <div class="p-5 space-y-3">
            @for (_ of [1,2,3,4,5]; track $index) {
              <div class="h-12 bg-[#EEE3D1] rounded-lg animate-pulse"></div>
            }
          </div>

        } @else if (filasFiltradas().length === 0) {
          <div class="py-16 flex flex-col items-center gap-3">
            <div class="w-14 h-14 rounded-full bg-[#F9F5F0] flex items-center justify-center">
              <svg class="w-7 h-7 text-[#C5A048]/60" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0
                         01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <p class="text-sm font-semibold text-[#2D2926]">Sin solicitudes</p>
            <p class="text-xs text-[#2D2926]/45">
              No hay solicitudes que coincidan con los filtros aplicados.
            </p>
          </div>

        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold">Código</th>
                  <th class="px-4 py-3 font-semibold">Fecha</th>
                  <th class="px-4 py-3 font-semibold">Tipo</th>
                  <th class="px-4 py-3 font-semibold">Asunto</th>
                  <th class="px-4 py-3 font-semibold">Prioridad</th>
                  <th class="px-4 py-3 font-semibold">Estado</th>
                  @if (showResponsable()) {
                    <th class="px-4 py-3 font-semibold whitespace-nowrap">Responsable</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (s of filasFiltradas(); track s.solicitudId) {
                  <tr
                    (click)="abrirDetalle(s.solicitudId)"
                    class="border-b border-[#EEE3D1] last:border-0 cursor-pointer
                           hover:bg-[#F9F5F0] transition-colors">
                    <td class="px-4 py-3 font-mono text-xs font-semibold text-[#C5A048] whitespace-nowrap">
                      {{ s.codigoSolicitud }}
                    </td>
                    <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">
                      {{ formatFecha(s.fechaRegistro) }}
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            [class]="tipoBadge(s.tipoSolicitud)">
                        {{ tipoLabel(s.tipoSolicitud) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-[#2D2926]" [title]="s.asunto">
                      {{ truncar(s.asunto) }}
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            [class]="prioridadBadge(s.prioridad)">
                        {{ prioridadLabel(s.prioridad) }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            [class]="estadoBadge(s.estado)">
                        {{ estadoLabel(s.estado) }}
                      </span>
                    </td>
                    @if (showResponsable()) {
                      <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">
                        {{ s.responsableNombre ?? '—' }}
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Paginación server-side -->
          <div class="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#EEE3D1]">
            <p class="text-xs text-[#2D2926]/50">
              {{ totalElements() }} solicitud(es) · Página {{ pageIndex() + 1 }} de {{ totalPages() }}
            </p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="paginaAnterior()"
                [disabled]="pageIndex() === 0"
                class="h-8 px-3 rounded-lg border border-[#EEE3D1] text-xs font-medium
                       text-[#2D2926]/70 hover:bg-[#F9F5F0] disabled:opacity-40
                       disabled:cursor-not-allowed transition-colors">
                Anterior
              </button>
              <button
                type="button"
                (click)="paginaSiguiente()"
                [disabled]="esUltima()"
                class="h-8 px-3 rounded-lg border border-[#EEE3D1] text-xs font-medium
                       text-[#2D2926]/70 hover:bg-[#F9F5F0] disabled:opacity-40
                       disabled:cursor-not-allowed transition-colors">
                Siguiente
              </button>
            </div>
          </div>
        }
      </div>

    </div>
  `,
})
export class MisSolicitudesPage {
  private readonly svc = inject(SolicitudService);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  // ── Estado de datos ─────────────────────────────────────────────────────────
  readonly loading = signal(true);
  readonly page = signal<PageResponse<SolicitudResponse> | null>(null);
  readonly pageIndex = signal(0);

  // ── Filtros server-side ─────────────────────────────────────────────────────
  readonly fEstado = signal<EstadoSolicitud | ''>('');
  readonly fTipo = signal<TipoSolicitud | ''>('');
  readonly fPrioridad = signal<PrioridadSolicitud | ''>('');
  readonly fModulo = signal<ModuloReferido | ''>('');
  readonly fDesde = signal<string>('');
  readonly fHasta = signal<string>('');

  // ── Búsqueda client-side (solo sobre la página cargada) ─────────────────────
  readonly busqueda = signal('');

  // ── Opciones de selects ─────────────────────────────────────────────────────
  readonly estados: EstadoSolicitud[] = [
    'REGISTRADA', 'EN_EVALUACION', 'ATENDIDA', 'APROBADA', 'RECHAZADA', 'CERRADA',
  ];
  readonly tipos: TipoSolicitud[] = ['INFORMACION', 'ACCESO'];
  readonly prioridades: PrioridadSolicitud[] = ['ALTA', 'MEDIA', 'BAJA'];
  readonly modulos: ModuloReferido[] = [
    'RESERVAS', 'HABITACIONES', 'PAGOS', 'EMPLEADOS', 'REPORTES', 'INVENTARIO', 'OTRO',
  ];

  // ── Derivados ───────────────────────────────────────────────────────────────
  private readonly tier = computed(() => resolverTier(this.auth.rol()));
  readonly showResponsable = computed(() => this.tier() === 1 || this.tier() === 2);

  readonly filas = computed(() => this.page()?.content ?? []);

  readonly filasFiltradas = computed(() => {
    const term = this.busqueda().trim().toLowerCase();
    const lista = this.filas();
    if (!term) return lista;
    return lista.filter(
      (s) =>
        s.codigoSolicitud.toLowerCase().includes(term) ||
        s.asunto.toLowerCase().includes(term),
    );
  });

  readonly totalElements = computed(() => this.page()?.totalElements ?? 0);
  readonly totalPages = computed(() => Math.max(1, this.page()?.totalPages ?? 1));
  readonly esUltima = computed(() => this.page()?.last ?? true);

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.svc.listar(this.construirFiltros()).subscribe({
      next: (page) => {
        this.page.set(page);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.loading.set(false);
        this.toastr.error(
          err.friendlyMessage ?? 'No se pudieron cargar las solicitudes.',
          'Error',
        );
      },
    });
  }

  private construirFiltros(): SolicitudFilterRequest {
    const desde = this.fDesde();
    const hasta = this.fHasta();
    return {
      estado: this.fEstado() || undefined,
      tipoSolicitud: this.fTipo() || undefined,
      prioridad: this.fPrioridad() || undefined,
      moduloReferido: this.fModulo() || undefined,
      fechaRegistroDesde: desde || undefined,
      fechaRegistroHasta: hasta || undefined,
      page: this.pageIndex(),
      size: PAGE_SIZE,
      sort: 'fechaRegistro,desc',
    };
  }

  onFiltro(campo: 'estado' | 'tipo' | 'prioridad' | 'modulo' | 'desde' | 'hasta', valor: string): void {
    switch (campo) {
      case 'estado':    this.fEstado.set(valor as EstadoSolicitud | ''); break;
      case 'tipo':      this.fTipo.set(valor as TipoSolicitud | ''); break;
      case 'prioridad': this.fPrioridad.set(valor as PrioridadSolicitud | ''); break;
      case 'modulo':    this.fModulo.set(valor as ModuloReferido | ''); break;
      case 'desde':     this.fDesde.set(valor); break;
      case 'hasta':     this.fHasta.set(valor); break;
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

  abrirDetalle(id: number): void {
    this.router.navigate(['/solicitudes', id]);
  }

  nuevaSolicitud(): void {
    this.router.navigate(['/solicitudes/nueva']);
  }

  // ── Formato (delegado a los mapas centralizados del módulo) ─────────────────
  formatFecha(iso: string): string {
    const [fecha] = iso.split('T');
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  truncar(texto: string, max = 50): string {
    return texto.length > max ? texto.slice(0, max).trimEnd() + '…' : texto;
  }

  estadoLabel(e: EstadoSolicitud): string { return ESTADO_LABEL[e]; }
  estadoBadge(e: EstadoSolicitud): string { return ESTADO_BADGE[e]; }
  prioridadLabel(p: PrioridadSolicitud): string { return PRIORIDAD_LABEL[p]; }
  prioridadBadge(p: PrioridadSolicitud): string { return PRIORIDAD_BADGE[p]; }
  tipoLabel(t: TipoSolicitud): string { return TIPO_LABEL[t]; }
  tipoBadge(t: TipoSolicitud): string { return TIPO_BADGE[t]; }
  moduloLabel(m: ModuloReferido): string { return MODULO_LABEL[m]; }
}
