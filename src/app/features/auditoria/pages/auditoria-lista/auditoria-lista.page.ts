import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuditoriaService } from '../../services/auditoria.service';
import { PageResponse } from '../../../../core/api/api-response.interface';
import {
  AuditoriaFilterRequest,
  RegistroAuditoriaResponse,
  ResultadoAuditoria,
} from '../../models/auditoria.model';
import {
  MODULOS_AUDITABLES,
  RESULTADO_BADGE,
  RESULTADO_LABEL,
  formatFechaHora,
  metodoBadge,
} from '../../utils/auditoria-ui';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-auditoria-lista',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">

      <!-- Cabecera -->
      <div>
        <h1 class="text-2xl font-bold text-[#2D2926]">Auditoría</h1>
        <p class="text-sm text-[#2D2926]/55 mt-0.5">
          Registro de acciones del sistema (solo lectura)
        </p>
      </div>

      <!-- Filtros server-side -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Usuario (ID)</label>
            <input type="number" [value]="fUsuarioId()"
              (change)="onFiltro('usuarioId', $any($event.target).value)"
              placeholder="Ej. 5"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] placeholder:text-[#2D2926]/35
                     focus:outline-none focus:border-[#C5A048]" />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Correo</label>
            <input type="text" [value]="fCorreo()"
              (change)="onFiltro('correo', $any($event.target).value)"
              placeholder="maria@…"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] placeholder:text-[#2D2926]/35
                     focus:outline-none focus:border-[#C5A048]" />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Acción</label>
            <input type="text" [value]="fAccion()"
              (change)="onFiltro('accion', $any($event.target).value)"
              placeholder="Ej. CREAR"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] placeholder:text-[#2D2926]/35
                     focus:outline-none focus:border-[#C5A048]" />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Módulo</label>
            <select [value]="fModulo()"
              (change)="onFiltro('modulo', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              <option value="">Todos</option>
              @for (m of modulos; track m) {
                <option [value]="m">{{ m }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Resultado</label>
            <select [value]="fResultado()"
              (change)="onFiltro('resultado', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              <option value="">Todos</option>
              <option value="EXITO">Éxito</option>
              <option value="ERROR">Error</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Desde</label>
            <input type="date" [value]="fDesde()"
              (change)="onFiltro('desde', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Hasta</label>
            <input type="date" [value]="fHasta()"
              (change)="onFiltro('hasta', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>

          <div class="flex items-end">
            <button type="button" (click)="limpiarFiltros()"
              class="h-9 px-4 rounded-lg border border-[#EEE3D1] text-sm font-medium
                     text-[#2D2926]/70 hover:bg-[#F9F5F0] transition-colors">
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden">

        @if (loading()) {
          <div class="p-5 space-y-3">
            @for (_ of [1,2,3,4,5,6]; track $index) {
              <div class="h-11 bg-[#EEE3D1] rounded-lg animate-pulse"></div>
            }
          </div>

        } @else if (filas().length === 0) {
          <div class="py-16 flex flex-col items-center gap-3">
            <div class="w-14 h-14 rounded-full bg-[#F9F5F0] flex items-center justify-center">
              <svg class="w-7 h-7 text-[#C5A048]/60" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0
                         01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <p class="text-sm font-semibold text-[#2D2926]">Sin registros</p>
            <p class="text-xs text-[#2D2926]/45">
              No hay registros de auditoría con los filtros aplicados.
            </p>
          </div>

        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[980px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold w-8"></th>
                  <th class="px-4 py-3 font-semibold">ID</th>
                  <th class="px-4 py-3 font-semibold whitespace-nowrap">Fecha / Hora</th>
                  <th class="px-4 py-3 font-semibold">Usuario</th>
                  <th class="px-4 py-3 font-semibold">Acción</th>
                  <th class="px-4 py-3 font-semibold">Módulo</th>
                  <th class="px-4 py-3 font-semibold">Descripción</th>
                  <th class="px-4 py-3 font-semibold">Método</th>
                  <th class="px-4 py-3 font-semibold">Resultado</th>
                </tr>
              </thead>
              <tbody>
                @for (r of filas(); track r.registroId) {
                  <!-- Fila principal -->
                  <tr
                    (click)="toggle(r.registroId)"
                    class="border-b border-[#EEE3D1] cursor-pointer hover:bg-[#F9F5F0]
                           transition-colors"
                    [style.background-color]="expandido() === r.registroId ? '#F9F5F0' : null">
                    <td class="px-4 py-3 text-[#2D2926]/40">
                      <svg class="w-4 h-4 transition-transform"
                           [class.rotate-90]="expandido() === r.registroId"
                           fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </td>
                    <td class="px-4 py-3 font-mono text-xs text-[#2D2926]/70">{{ r.registroId }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">
                      {{ formatFecha(r.fecha) }}
                    </td>
                    <td class="px-4 py-3 text-[#2D2926] whitespace-nowrap">
                      {{ r.usuarioCorreo ?? 'Sistema' }}
                    </td>
                    <td class="px-4 py-3 font-mono text-xs text-[#2D2926] whitespace-nowrap">
                      {{ r.accion }}
                    </td>
                    <td class="px-4 py-3 text-[#2D2926]/70">{{ r.modulo }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70">{{ r.descripcion ?? '—' }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide"
                            [class]="metodoBadge(r.metodoHttp)">
                        {{ r.metodoHttp ?? '—' }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            [class]="resultadoBadge(r.resultado)">
                        {{ resultadoLabel(r.resultado) }}
                      </span>
                    </td>
                  </tr>

                  <!-- Fila expandida (detalle) -->
                  @if (expandido() === r.registroId) {
                    <tr class="bg-[#F9F5F0]/60 border-b border-[#EEE3D1]">
                      <td colspan="9" class="px-6 py-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Registro</p>
                            <p class="text-sm text-[#2D2926] font-mono">#{{ r.registroId }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Usuario ID</p>
                            <p class="text-sm text-[#2D2926]">{{ r.usuarioId ?? '— (sistema)' }}</p>
                          </div>
                          <div class="sm:col-span-2">
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Correo</p>
                            <p class="text-sm text-[#2D2926]">{{ r.usuarioCorreo ?? 'Sistema' }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Método</p>
                            <p class="text-sm text-[#2D2926]">{{ r.metodoHttp ?? '—' }}</p>
                          </div>
                          <div class="sm:col-span-3">
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Ruta</p>
                            <p class="text-sm text-[#2D2926] font-mono break-all">{{ r.ruta ?? '—' }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">IP origen</p>
                            <p class="text-sm text-[#2D2926] font-mono">{{ r.ipOrigen ?? '—' }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Fecha / Hora</p>
                            <p class="text-sm text-[#2D2926]">{{ formatFecha(r.fecha) }}</p>
                          </div>

                          @if (r.resultado === 'ERROR' && r.detalleError) {
                            <div class="sm:col-span-2 lg:col-span-4">
                              <p class="text-[11px] text-red-500 font-semibold uppercase tracking-wide mb-1">
                                Detalle del error
                              </p>
                              <p class="text-sm text-red-700 bg-red-50 border border-red-200
                                        rounded-lg px-3 py-2 font-mono break-all">
                                {{ r.detalleError }}
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

          <!-- Paginación -->
          <div class="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#EEE3D1]">
            <p class="text-xs text-[#2D2926]/50">
              {{ totalElements() }} registro(s) · Página {{ pageIndex() + 1 }} de {{ totalPages() }}
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
export class AuditoriaListaPage {
  private readonly svc = inject(AuditoriaService);
  private readonly toastr = inject(ToastrService);

  readonly loading = signal(true);
  readonly page = signal<PageResponse<RegistroAuditoriaResponse> | null>(null);
  readonly pageIndex = signal(0);
  readonly expandido = signal<number | null>(null);

  // ── Filtros server-side ─────────────────────────────────────────────────────
  readonly fUsuarioId = signal<string>('');
  readonly fCorreo = signal<string>('');
  readonly fAccion = signal<string>('');
  readonly fModulo = signal<string>('');
  readonly fResultado = signal<ResultadoAuditoria | ''>('');
  readonly fDesde = signal<string>('');
  readonly fHasta = signal<string>('');

  readonly modulos = MODULOS_AUDITABLES;

  readonly filas = computed(() => this.page()?.content ?? []);
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
          err.friendlyMessage ?? 'No se pudieron cargar los registros de auditoría.',
          'Error',
        );
      },
    });
  }

  private construirFiltros(): AuditoriaFilterRequest {
    const uid = this.fUsuarioId().trim();
    return {
      usuarioId: uid ? Number(uid) : undefined,
      usuarioCorreo: this.fCorreo().trim() || undefined,
      accion: this.fAccion().trim() || undefined,
      modulo: this.fModulo() || undefined,
      resultado: this.fResultado() || undefined,
      fechaDesde: this.fDesde() || undefined,
      fechaHasta: this.fHasta() || undefined,
      page: this.pageIndex(),
      size: PAGE_SIZE,
      sort: 'fecha,desc',
    };
  }

  onFiltro(
    campo: 'usuarioId' | 'correo' | 'accion' | 'modulo' | 'resultado' | 'desde' | 'hasta',
    valor: string,
  ): void {
    switch (campo) {
      case 'usuarioId': this.fUsuarioId.set(valor); break;
      case 'correo':    this.fCorreo.set(valor); break;
      case 'accion':    this.fAccion.set(valor); break;
      case 'modulo':    this.fModulo.set(valor); break;
      case 'resultado': this.fResultado.set(valor as ResultadoAuditoria | ''); break;
      case 'desde':     this.fDesde.set(valor); break;
      case 'hasta':     this.fHasta.set(valor); break;
    }
    this.pageIndex.set(0);
    this.expandido.set(null);
    this.cargar();
  }

  limpiarFiltros(): void {
    this.fUsuarioId.set('');
    this.fCorreo.set('');
    this.fAccion.set('');
    this.fModulo.set('');
    this.fResultado.set('');
    this.fDesde.set('');
    this.fHasta.set('');
    this.pageIndex.set(0);
    this.expandido.set(null);
    this.cargar();
  }

  toggle(id: number): void {
    this.expandido.update((actual) => (actual === id ? null : id));
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

  // ── Formato (delegado a los helpers centralizados) ──────────────────────────
  formatFecha(iso: string): string { return formatFechaHora(iso); }
  metodoBadge(m: string | null): string { return metodoBadge(m); }
  resultadoBadge(r: ResultadoAuditoria): string { return RESULTADO_BADGE[r]; }
  resultadoLabel(r: ResultadoAuditoria): string { return RESULTADO_LABEL[r]; }
}
