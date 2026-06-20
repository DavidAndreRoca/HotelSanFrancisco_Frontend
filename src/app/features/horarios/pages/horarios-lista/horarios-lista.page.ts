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
import { HorarioService } from '../../services/horario.service';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { PageResponse } from '../../../../core/api/api-response.interface';
import {
  EstadoActivo,
  HorarioFilterRequest,
  HorarioResponse,
} from '../../models/horario.model';
import { HorarioFormModalComponent } from '../../components/horario-form-modal.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-horarios-lista',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, HorarioFormModalComponent],
  template: `
    <div class="space-y-6">

      <!-- Cabecera -->
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-[#2D2926]">Horarios</h1>
          <p class="text-sm text-[#2D2926]/55 mt-0.5">Turnos laborales del personal</p>
        </div>
        <div class="flex items-center gap-2">
          <a routerLink="/horarios/asignaciones"
            class="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-[#EEE3D1]
                   text-sm font-medium text-[#2D2926]/70 hover:bg-[#F9F5F0] transition-colors">
            Asignaciones
          </a>
          <button type="button" (click)="abrirNuevo()"
            class="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#C5A048] text-white
                   text-sm font-medium hover:bg-[#8E6F2E] transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo horario
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="sm:col-span-2">
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Nombre del turno</label>
            <input type="text" [value]="fNombre()"
              (change)="onFiltro('nombre', $any($event.target).value)"
              placeholder="Buscar turno…"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] placeholder:text-[#2D2926]/35
                     focus:outline-none focus:border-[#C5A048]" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Estado</label>
            <select [value]="fEstado()"
              (change)="onFiltro('estado', $any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              <option value="">Todos</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
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
            <p class="text-sm font-semibold text-[#2D2926]">Sin horarios</p>
            <p class="text-xs text-[#2D2926]/45 mt-1">No hay turnos con los filtros aplicados.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[700px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold">Turno</th>
                  <th class="px-4 py-3 font-semibold">Entrada</th>
                  <th class="px-4 py-3 font-semibold">Salida</th>
                  <th class="px-4 py-3 font-semibold">Estado</th>
                  <th class="px-4 py-3 font-semibold text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (h of filas(); track h.horarioId) {
                  <tr class="border-b border-[#EEE3D1] last:border-0 hover:bg-[#F9F5F0] transition-colors">
                    <td class="px-4 py-3 font-medium text-[#2D2926]">{{ h.nombreTurno }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 font-mono">{{ h.horaEntrada.slice(0,5) }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 font-mono">{{ h.horaSalida.slice(0,5) }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            [class]="estadoBadge(h.estado)">{{ estadoLabel(h.estado) }}</span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      <div class="flex items-center justify-end gap-2">
                        <button type="button" (click)="abrirEditar(h)"
                          class="h-7 px-2.5 rounded-lg border border-[#C5A048] text-[#C5A048]
                                 text-xs font-medium hover:bg-[#C5A048]/5 transition-colors">
                          Editar
                        </button>
                        @if (h.estado === 'ACTIVO') {
                          <button type="button" (click)="inhabilitar(h)"
                            class="h-7 px-2.5 rounded-lg border border-red-200 text-red-600
                                   text-xs font-medium hover:bg-red-50 transition-colors">
                            Inhabilitar
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#EEE3D1]">
            <p class="text-xs text-[#2D2926]/50">
              {{ totalElements() }} horario(s) · Página {{ pageIndex() + 1 }} de {{ totalPages() }}
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

      <!-- Modal crear/editar -->
      <app-horario-form-modal
        [open]="modalAbierto()"
        [horario]="horarioSel()"
        (cerrar)="modalAbierto.set(false)"
        (guardado)="onGuardado()" />

    </div>
  `,
})
export class HorariosListaPage {
  private readonly svc = inject(HorarioService);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly page = signal<PageResponse<HorarioResponse> | null>(null);
  readonly pageIndex = signal(0);

  readonly fNombre = signal('');
  readonly fEstado = signal<EstadoActivo | ''>('');

  readonly modalAbierto = signal(false);
  readonly horarioSel = signal<HorarioResponse | null>(null);

  readonly filas = computed(() => this.page()?.content ?? []);
  readonly totalElements = computed(() => this.page()?.totalElements ?? 0);
  readonly totalPages = computed(() => Math.max(1, this.page()?.totalPages ?? 1));
  readonly esUltima = computed(() => this.page()?.last ?? true);

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    const filtros: HorarioFilterRequest = {
      nombreTurno: this.fNombre().trim() || undefined,
      estado: this.fEstado() || undefined,
      page: this.pageIndex(),
      size: PAGE_SIZE,
      sort: 'nombreTurno,asc',
    };
    this.svc.listarPaginado(filtros).subscribe({
      next: (p) => { this.page.set(p); this.loading.set(false); },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.loading.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudieron cargar los horarios.', 'Error');
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

  abrirNuevo(): void {
    this.horarioSel.set(null);
    this.modalAbierto.set(true);
  }

  abrirEditar(h: HorarioResponse): void {
    this.horarioSel.set(h);
    this.modalAbierto.set(true);
  }

  onGuardado(): void {
    this.modalAbierto.set(false);
    this.cargar();
  }

  async inhabilitar(h: HorarioResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Inhabilitar horario',
      message: `¿Dar de baja el turno "${h.nombreTurno}"? Pasará a estado Inactivo.`,
      confirmText: 'Sí, inhabilitar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.svc.inhabilitar(h.horarioId).subscribe({
      next: () => { this.toastr.success('Horario inhabilitado.'); this.cargar(); },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.toastr.error(err.friendlyMessage ?? 'No se pudo inhabilitar.', 'Error');
      },
    });
  }

  estadoLabel(e: EstadoActivo): string { return e === 'ACTIVO' ? 'Activo' : 'Inactivo'; }
  estadoBadge(e: EstadoActivo): string {
    return e === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600';
  }
}
