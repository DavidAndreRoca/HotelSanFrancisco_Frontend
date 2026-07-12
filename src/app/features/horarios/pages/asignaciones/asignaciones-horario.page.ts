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
import { AuthStore } from '../../../../core/auth/auth.store';
import { AsignacionHorarioService } from '../../services/asignacion-horario.service';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { EmpleadoSelectorComponent } from '../../../../shared/components/empleado-selector/empleado-selector.component';
import { UsuarioResumen } from '../../../../core/usuarios/usuario-lookup.service';
import { DetalleHorarioResponse, EstadoActivo } from '../../models/horario.model';
import { AsignarHorarioModalComponent } from '../../components/asignar-horario-modal.component';

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

@Component({
  selector: 'app-asignaciones-horario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmpleadoSelectorComponent, AsignarHorarioModalComponent],
  template: `
    <div class="space-y-6 max-w-4xl">

      <!-- Cabecera -->
      <div class="flex items-center gap-3">
        <a routerLink="/horarios"
          class="inline-flex items-center gap-1.5 text-sm text-[#2D2926]/60
                 hover:text-[#C5A048] transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Horarios
        </a>
      </div>
      <div>
        <h1 class="text-2xl font-bold text-[#2D2926]">Asignación de horarios</h1>
        <p class="text-sm text-[#2D2926]/55 mt-0.5">
          Selecciona un empleado para ver y gestionar sus turnos asignados
        </p>
      </div>

      <!-- Selector de empleado -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Empleado</label>
        <app-empleado-selector
          placeholder="Buscar empleado por nombre…"
          (elegido)="onEmpleado($event)" />
      </div>

      <!-- Asignaciones del empleado -->
      @if (empleado(); as emp) {
        <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden">
          <div class="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#EEE3D1]">
            <p class="text-sm font-semibold text-[#2D2926]">Turnos de {{ emp.nombreCompleto }}</p>
            @if (puedeCrear()) {
              <button type="button" (click)="modalAbierto.set(true)"
                class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#C5A048] text-white
                       text-xs font-medium hover:bg-[#8E6F2E] transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Asignar horario
              </button>
            }
          </div>

          @if (cargando()) {
            <div class="p-5 space-y-3">
              @for (_ of [1,2,3]; track $index) {
                <div class="h-11 bg-[#EEE3D1] rounded-lg animate-pulse"></div>
              }
            </div>
          } @else if (asignaciones().length === 0) {
            <div class="py-12 text-center">
              <p class="text-sm text-[#2D2926]/45">Este empleado no tiene turnos asignados.</p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full min-w-[680px] text-sm">
                <thead>
                  <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                             tracking-wide text-[#2D2926]/50">
                    <th class="px-4 py-3 font-semibold">Turno</th>
                    <th class="px-4 py-3 font-semibold">Día</th>
                    <th class="px-4 py-3 font-semibold whitespace-nowrap">Vigencia</th>
                    <th class="px-4 py-3 font-semibold">Estado</th>
                    <th class="px-4 py-3 font-semibold text-right whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of asignaciones(); track a.detalleHorarioId) {
                    <tr class="border-b border-[#EEE3D1] last:border-0 hover:bg-[#F9F5F0] transition-colors">
                      <td class="px-4 py-3 font-medium text-[#2D2926]">{{ a.horarioNombreTurno }}</td>
                      <td class="px-4 py-3 text-[#2D2926]/70">{{ diaLabel(a.diaSemana) }}</td>
                      <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">
                        {{ a.fechaVigenciaInicio }} → {{ a.fechaVigenciaFin ?? 'indefinido' }}
                      </td>
                      <td class="px-4 py-3">
                        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                              [class]="estadoBadge(a.estado)">{{ estadoLabel(a.estado) }}</span>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-right">
                        @if (puedeEliminar() && a.estado === 'ACTIVO') {
                          <button type="button" (click)="remover(a)"
                            class="h-7 px-2.5 rounded-lg border border-red-200 text-red-600
                                   text-xs font-medium hover:bg-red-50 transition-colors">
                            Remover
                          </button>
                        } @else {
                          <span class="text-xs text-[#2D2926]/40">—</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Modal asignar -->
        <app-asignar-horario-modal
          [open]="modalAbierto()"
          [usuarioId]="emp.usuarioId"
          [empleadoNombre]="emp.nombreCompleto"
          (cerrar)="modalAbierto.set(false)"
          (guardado)="onAsignado()" />
      }

    </div>
  `,
})
export class AsignacionesHorarioPage {
  private readonly svc = inject(AsignacionHorarioService);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly auth = inject(AuthStore);

  readonly puedeCrear    = computed(() => this.auth.hasPermission('asignacion-horario:create'));
  readonly puedeEliminar = computed(() => this.auth.hasPermission('asignacion-horario:delete'));

  readonly empleado = signal<UsuarioResumen | null>(null);
  readonly asignaciones = signal<DetalleHorarioResponse[]>([]);
  readonly cargando = signal(false);
  readonly modalAbierto = signal(false);

  onEmpleado(u: UsuarioResumen | null): void {
    this.empleado.set(u);
    this.asignaciones.set([]);
    if (u) this.cargar(u.usuarioId);
  }

  private cargar(usuarioId: number): void {
    this.cargando.set(true);
    this.svc.obtenerPorUsuario(usuarioId).subscribe({
      next: (lista) => { this.asignaciones.set(lista); this.cargando.set(false); },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.cargando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudieron cargar las asignaciones.', 'Error');
      },
    });
  }

  onAsignado(): void {
    this.modalAbierto.set(false);
    const emp = this.empleado();
    if (emp) this.cargar(emp.usuarioId);
  }

  async remover(a: DetalleHorarioResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Remover asignación',
      message: `¿Remover el turno "${a.horarioNombreTurno}"? Pasará a Inactivo.`,
      confirmText: 'Sí, remover',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.svc.remover(a.detalleHorarioId).subscribe({
      next: () => {
        this.toastr.success('Asignación removida.');
        const emp = this.empleado();
        if (emp) this.cargar(emp.usuarioId);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.toastr.error(err.friendlyMessage ?? 'No se pudo remover.', 'Error');
      },
    });
  }

  diaLabel(d: number): string { return DIAS[d] ?? String(d); }
  estadoLabel(e: EstadoActivo): string { return e === 'ACTIVO' ? 'Activo' : 'Inactivo'; }
  estadoBadge(e: EstadoActivo): string {
    return e === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600';
  }
}
