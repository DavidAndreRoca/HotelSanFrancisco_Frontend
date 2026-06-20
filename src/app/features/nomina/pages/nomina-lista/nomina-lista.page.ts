import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { NominaService } from '../../services/nomina.service';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { EmpleadoSelectorComponent } from '../../../../shared/components/empleado-selector/empleado-selector.component';
import { UsuarioResumen } from '../../../../core/usuarios/usuario-lookup.service';
import { PageResponse } from '../../../../core/api/api-response.interface';
import {
  EstadoNomina,
  PagoNominaFilterRequest,
  PagoNominaResponse,
} from '../../models/nomina.model';
import { ESTADO_BADGE, ESTADO_LABEL, formatMonto } from '../../utils/nomina-ui';
import { NominaFormModalComponent } from '../../components/nomina-form-modal.component';
import { CambiarEstadoNominaModalComponent } from '../../components/cambiar-estado-nomina-modal.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-nomina-lista',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmpleadoSelectorComponent,
    NominaFormModalComponent,
    CambiarEstadoNominaModalComponent,
  ],
  template: `
    <div class="space-y-6">

      <!-- Cabecera -->
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-[#2D2926]">Nómina</h1>
          <p class="text-sm text-[#2D2926]/55 mt-0.5">Pagos de planilla del personal</p>
        </div>
        <button type="button" (click)="formAbierto.set(true)"
          class="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#C5A048] text-white
                 text-sm font-medium hover:bg-[#8E6F2E] transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo pago
        </button>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Período</label>
            <input type="text" [value]="fPeriodo()"
              (change)="onFiltro('periodo', $any($event.target).value)"
              placeholder="Ej. JUNIO-2026"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] placeholder:text-[#2D2926]/35
                     focus:outline-none focus:border-[#C5A048]" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Empleado</label>
            <app-empleado-selector (elegido)="onEmpleado($event)" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Estado</label>
            <select [value]="fEstado()"
              (change)="onFiltro('estado', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PAGADO">Pagado</option>
              <option value="ANULADO">Anulado</option>
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
            <p class="text-sm font-semibold text-[#2D2926]">Sin pagos</p>
            <p class="text-xs text-[#2D2926]/45 mt-1">No hay pagos con los filtros aplicados.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[960px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold w-8"></th>
                  <th class="px-4 py-3 font-semibold">Período</th>
                  <th class="px-4 py-3 font-semibold">Empleado</th>
                  <th class="px-4 py-3 font-semibold whitespace-nowrap">Emisión</th>
                  <th class="px-4 py-3 font-semibold text-right">Sueldo base</th>
                  <th class="px-4 py-3 font-semibold text-right">Descuentos</th>
                  <th class="px-4 py-3 font-semibold text-right">Monto neto</th>
                  <th class="px-4 py-3 font-semibold">Estado</th>
                  <th class="px-4 py-3 font-semibold text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (p of filas(); track p.pagoNominaId) {
                  <tr class="border-b border-[#EEE3D1] hover:bg-[#F9F5F0] transition-colors"
                      [style.background-color]="expandido() === p.pagoNominaId ? '#F9F5F0' : null">
                    <td class="px-4 py-3 text-[#2D2926]/40 cursor-pointer" (click)="toggle(p.pagoNominaId)">
                      <svg class="w-4 h-4 transition-transform"
                           [class.rotate-90]="expandido() === p.pagoNominaId"
                           fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </td>
                    <td class="px-4 py-3 font-medium text-[#2D2926] whitespace-nowrap">{{ p.periodo }}</td>
                    <td class="px-4 py-3 text-[#2D2926] whitespace-nowrap">{{ p.usuarioNombreCompleto }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">{{ p.fechaEmision }}</td>
                    <td class="px-4 py-3 text-right text-[#2D2926]/70 whitespace-nowrap">{{ monto(p.sueldoBase) }}</td>
                    <td class="px-4 py-3 text-right text-[#2D2926]/70 whitespace-nowrap">{{ monto(p.totalDescuentos) }}</td>
                    <td class="px-4 py-3 text-right font-bold text-[#2D2926] whitespace-nowrap">{{ monto(p.montoNeto) }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            [class]="estadoBadge(p.estado)">{{ estadoLabel(p.estado) }}</span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      <div class="flex items-center justify-end gap-2">
                        @if (p.estado === 'PENDIENTE') {
                          <button type="button" (click)="abrirEstado(p)"
                            class="h-7 px-2.5 rounded-lg border border-[#C5A048] text-[#C5A048]
                                   text-xs font-medium hover:bg-[#C5A048]/5 transition-colors">
                            Cambiar estado
                          </button>
                        }
                        @if (p.estado !== 'PAGADO') {
                          <button type="button" (click)="eliminar(p)"
                            class="h-7 px-2.5 rounded-lg border border-red-200 text-red-600
                                   text-xs font-medium hover:bg-red-50 transition-colors">
                            Eliminar
                          </button>
                        }
                      </div>
                    </td>
                  </tr>

                  @if (expandido() === p.pagoNominaId) {
                    <tr class="bg-[#F9F5F0]/60 border-b border-[#EEE3D1]">
                      <td colspan="9" class="px-6 py-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Sueldo base</p>
                            <p class="text-sm text-[#2D2926]">{{ monto(p.sueldoBase) }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Bonos</p>
                            <p class="text-sm text-[#2D2926]">+ {{ monto(p.totalBonos) }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Descuentos</p>
                            <p class="text-sm text-red-600">− {{ monto(p.totalDescuentos) }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Monto neto</p>
                            <p class="text-sm font-bold text-[#2D2926]">{{ monto(p.montoNeto) }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Registro</p>
                            <p class="text-sm text-[#2D2926] font-mono">#{{ p.pagoNominaId }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Creado</p>
                            <p class="text-sm text-[#2D2926]">{{ p.fechaCreacion }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] text-[#2D2926]/50 font-medium">Modificado</p>
                            <p class="text-sm text-[#2D2926]">{{ p.fechaModificacion ?? '—' }}</p>
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
              {{ totalElements() }} pago(s) · Página {{ pageIndex() + 1 }} de {{ totalPages() }}
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
      <app-nomina-form-modal
        [open]="formAbierto()"
        (cerrar)="formAbierto.set(false)"
        (guardado)="onMutacion()" />

      <app-cambiar-estado-nomina-modal
        [open]="estadoAbierto()"
        [pago]="pagoSel()"
        (cerrar)="estadoAbierto.set(false)"
        (guardado)="onMutacion()" />

    </div>
  `,
})
export class NominaListaPage {
  private readonly svc = inject(NominaService);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly page = signal<PageResponse<PagoNominaResponse> | null>(null);
  readonly pageIndex = signal(0);
  readonly expandido = signal<number | null>(null);

  readonly fPeriodo = signal('');
  readonly fUsuarioId = signal<number | null>(null);
  readonly fEstado = signal<EstadoNomina | ''>('');

  readonly formAbierto = signal(false);
  readonly estadoAbierto = signal(false);
  readonly pagoSel = signal<PagoNominaResponse | null>(null);

  readonly filas = computed(() => this.page()?.content ?? []);
  readonly totalElements = computed(() => this.page()?.totalElements ?? 0);
  readonly totalPages = computed(() => Math.max(1, this.page()?.totalPages ?? 1));
  readonly esUltima = computed(() => this.page()?.last ?? true);

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    const filtros: PagoNominaFilterRequest = {
      periodo: this.fPeriodo().trim() || undefined,
      usuarioId: this.fUsuarioId() ?? undefined,
      estado: this.fEstado() || undefined,
      page: this.pageIndex(),
      size: PAGE_SIZE,
      sort: 'fechaEmision,desc',
    };
    this.svc.listarPaginado(filtros).subscribe({
      next: (p) => { this.page.set(p); this.loading.set(false); },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.loading.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudieron cargar los pagos.', 'Error');
      },
    });
  }

  onEmpleado(u: UsuarioResumen | null): void {
    this.fUsuarioId.set(u?.usuarioId ?? null);
    this.pageIndex.set(0);
    this.expandido.set(null);
    this.cargar();
  }

  onFiltro(campo: 'periodo' | 'estado', valor: string): void {
    if (campo === 'periodo') this.fPeriodo.set(valor);
    else this.fEstado.set(valor as EstadoNomina | '');
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

  abrirEstado(p: PagoNominaResponse): void {
    this.pagoSel.set(p);
    this.estadoAbierto.set(true);
  }

  onMutacion(): void {
    this.formAbierto.set(false);
    this.estadoAbierto.set(false);
    this.cargar();
  }

  async eliminar(p: PagoNominaResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Eliminar pago de nómina',
      message: `¿Eliminar el pago de ${p.usuarioNombreCompleto} (${p.periodo})? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.svc.eliminar(p.pagoNominaId).subscribe({
      next: () => { this.toastr.success('Pago eliminado.'); this.cargar(); },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.toastr.error(err.friendlyMessage ?? 'No se pudo eliminar el pago.', 'Error');
      },
    });
  }

  monto(n: number): string { return formatMonto(n); }
  estadoLabel(e: EstadoNomina): string { return ESTADO_LABEL[e]; }
  estadoBadge(e: EstadoNomina): string { return ESTADO_BADGE[e]; }
}
