import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, debounceTime, switchMap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AsistenciaService } from '../../services/asistencia.service';
import { WebSocketService } from '../../../../core/websocket/websocket.service';
import { WS_TOPICS } from '../../../../core/websocket/websocket-channels';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { EmpleadoSelectorComponent } from '../../../../shared/components/empleado-selector/empleado-selector.component';
import { UsuarioResumen } from '../../../../core/usuarios/usuario-lookup.service';
import { PageResponse } from '../../../../core/api/api-response.interface';
import {
  AsistenciaFilterRequest,
  AsistenciaResponse,
  TipoAsistencia,
} from '../../models/asistencia.model';
import { TIPO_ASISTENCIA, TIPO_BADGE, TIPO_LABEL } from '../../utils/asistencia-ui';
import { AsistenciaEntradaModalComponent } from '../../components/asistencia-entrada-modal.component';
import { AsistenciaSalidaModalComponent } from '../../components/asistencia-salida-modal.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-asistencia-lista',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmpleadoSelectorComponent,
    AsistenciaEntradaModalComponent,
    AsistenciaSalidaModalComponent,
  ],
  template: `
    <div class="space-y-6">

      <!-- Cabecera -->
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-[#2D2926]">Asistencia</h1>
          <p class="text-sm text-[#2D2926]/55 mt-0.5">Marcaciones de entrada y salida del personal</p>
        </div>
        <button type="button" (click)="entradaAbierto.set(true)"
          class="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#C5A048] text-white
                 text-sm font-medium hover:bg-[#8E6F2E] transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Registrar entrada
        </button>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Empleado</label>
            <app-empleado-selector (elegido)="onEmpleado($event)" />
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
          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Tipo</label>
            <select [value]="fTipo()"
              (change)="onFiltro('tipo', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              <option value="">Todos</option>
              @for (t of tipos; track t.value) {
                <option [value]="t.value">{{ t.label }}</option>
              }
            </select>
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
            <p class="text-sm font-semibold text-[#2D2926]">Sin registros</p>
            <p class="text-xs text-[#2D2926]/45 mt-1">No hay asistencias con los filtros aplicados.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[900px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold w-8"></th>
                  <th class="px-4 py-3 font-semibold">Fecha</th>
                  <th class="px-4 py-3 font-semibold">Empleado</th>
                  <th class="px-4 py-3 font-semibold">Ingreso</th>
                  <th class="px-4 py-3 font-semibold">Egreso</th>
                  <th class="px-4 py-3 font-semibold">Horas</th>
                  <th class="px-4 py-3 font-semibold">Tipo</th>
                  <th class="px-4 py-3 font-semibold text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (a of filas(); track a.asistenciaId) {
                  <tr class="border-b border-[#EEE3D1] hover:bg-[#F9F5F0] transition-colors"
                      [style.background-color]="expandido() === a.asistenciaId ? '#F9F5F0' : null">
                    <td class="px-4 py-3 text-[#2D2926]/40 cursor-pointer" (click)="toggle(a.asistenciaId)">
                      <svg class="w-4 h-4 transition-transform"
                           [class.rotate-90]="expandido() === a.asistenciaId"
                           fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </td>
                    <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">{{ a.fecha }}</td>
                    <td class="px-4 py-3 text-[#2D2926] whitespace-nowrap">{{ a.usuarioNombreCompleto }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 font-mono">{{ a.horaIngreso.slice(0,5) }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 font-mono">
                      {{ a.horaEgreso ? a.horaEgreso.slice(0,5) : '—' }}
                    </td>
                    <td class="px-4 py-3 text-[#2D2926]/70">
                      {{ a.horasTrabajadas != null ? a.horasTrabajadas : '—' }}
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            [class]="tipoBadge(a.tipo)">{{ tipoLabel(a.tipo) }}</span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      <div class="flex items-center justify-end gap-2">
                        @if (!a.horaEgreso) {
                          <button type="button" (click)="abrirSalida(a)"
                            class="h-7 px-2.5 rounded-lg border border-[#C5A048] text-[#C5A048]
                                   text-xs font-medium hover:bg-[#C5A048]/5 transition-colors">
                            Registrar salida
                          </button>
                        }
                        <button type="button" (click)="eliminar(a)"
                          class="h-7 px-2.5 rounded-lg border border-red-200 text-red-600
                                 text-xs font-medium hover:bg-red-50 transition-colors">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>

                  @if (expandido() === a.asistenciaId) {
                    <tr class="bg-[#F9F5F0]/60 border-b border-[#EEE3D1]">
                      <td colspan="8" class="px-6 py-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Registro</p>
                            <p class="text-sm text-[#2D2926] font-mono">#{{ a.asistenciaId }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Horas trabajadas</p>
                            <p class="text-sm text-[#2D2926]">
                              {{ a.horasTrabajadas != null ? a.horasTrabajadas + ' h' : 'Sin egreso' }}
                            </p>
                          </div>
                          <div class="sm:col-span-2">
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Observaciones</p>
                            <p class="text-sm text-[#2D2926]">{{ a.observaciones ?? '—' }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Creado</p>
                            <p class="text-sm text-[#2D2926]">{{ a.fechaCreacion }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Modificado</p>
                            <p class="text-sm text-[#2D2926]">{{ a.fechaModificacion ?? '—' }}</p>
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

      <!-- Modales -->
      <app-asistencia-entrada-modal
        [open]="entradaAbierto()"
        (cerrar)="entradaAbierto.set(false)"
        (guardado)="onMutacion()" />

      <app-asistencia-salida-modal
        [open]="salidaAbierto()"
        [asistencia]="asistenciaSel()"
        (cerrar)="salidaAbierto.set(false)"
        (guardado)="onMutacion()" />

    </div>
  `,
})
export class AsistenciaListaPage {
  private readonly svc = inject(AsistenciaService);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly ws = inject(WebSocketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly page = signal<PageResponse<AsistenciaResponse> | null>(null);
  readonly pageIndex = signal(0);
  readonly expandido = signal<number | null>(null);

  readonly fUsuarioId = signal<number | null>(null);
  readonly fDesde = signal('');
  readonly fHasta = signal('');
  readonly fTipo = signal<TipoAsistencia | ''>('');

  readonly entradaAbierto = signal(false);
  readonly salidaAbierto = signal(false);
  readonly asistenciaSel = signal<AsistenciaResponse | null>(null);

  readonly tipos = TIPO_ASISTENCIA;

  readonly filas = computed(() => this.page()?.content ?? []);
  readonly totalElements = computed(() => this.page()?.totalElements ?? 0);
  readonly totalPages = computed(() => Math.max(1, this.page()?.totalPages ?? 1));
  readonly esUltima = computed(() => this.page()?.last ?? true);

  // switchMap cancela la petición anterior si llega una nueva carga: evita que
  // una respuesta lenta y obsoleta pise a la más reciente al cambiar filtros.
  private readonly cargar$ = new Subject<void>();

  constructor() {
    this.cargar$
      .pipe(
        switchMap(() =>
          this.svc.listarPaginado(this.construirFiltros()).pipe(
            catchError((err: HttpErrorResponse & { friendlyMessage?: string }) => {
              this.loading.set(false);
              this.toastr.error(
                err.friendlyMessage ?? 'No se pudieron cargar las asistencias.',
                'Error',
              );
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((p) => {
        this.page.set(p);
        this.loading.set(false);
      });
    this.cargar();
    this.ws
      .onTopic<unknown>(WS_TOPICS.asistencia, this.destroyRef)
      .pipe(debounceTime(300))
      .subscribe(() => this.cargar());
  }

  private construirFiltros(): AsistenciaFilterRequest {
    return {
      usuarioId: this.fUsuarioId() ?? undefined,
      fechaInicio: this.fDesde() || undefined,
      fechaFin: this.fHasta() || undefined,
      tipo: this.fTipo() || undefined,
      page: this.pageIndex(),
      size: PAGE_SIZE,
      sort: 'fecha,desc',
    };
  }

  private cargar(): void {
    this.loading.set(true);
    this.cargar$.next();
  }

  onEmpleado(u: UsuarioResumen | null): void {
    this.fUsuarioId.set(u?.usuarioId ?? null);
    this.pageIndex.set(0);
    this.expandido.set(null);
    this.cargar();
  }

  onFiltro(campo: 'desde' | 'hasta' | 'tipo', valor: string): void {
    if (campo === 'desde') this.fDesde.set(valor);
    else if (campo === 'hasta') this.fHasta.set(valor);
    else this.fTipo.set(valor as TipoAsistencia | '');
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

  abrirSalida(a: AsistenciaResponse): void {
    this.asistenciaSel.set(a);
    this.salidaAbierto.set(true);
  }

  onMutacion(): void {
    this.entradaAbierto.set(false);
    this.salidaAbierto.set(false);
    this.cargar();
  }

  async eliminar(a: AsistenciaResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Eliminar asistencia',
      message: `¿Eliminar el registro de ${a.usuarioNombreCompleto} del ${a.fecha}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.svc.eliminar(a.asistenciaId).subscribe({
      next: () => { this.toastr.success('Registro eliminado.'); this.cargar(); },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.toastr.error(err.friendlyMessage ?? 'No se pudo eliminar.', 'Error');
      },
    });
  }

  tipoLabel(t: TipoAsistencia): string { return TIPO_LABEL[t]; }
  tipoBadge(t: TipoAsistencia): string { return TIPO_BADGE[t]; }
}
