import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { catchError, of } from 'rxjs';
import { UiModalComponent } from '../../../shared/ui/modal/ui-modal.component';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { HorarioService } from '../../horarios/services/horario.service';
import { HorarioResponse } from '../../horarios/models/horario.model';
import { TurnoService } from '../services/turno.service';
import { EstadoTurno, TurnoResponse, UpdateTurnoRequest } from '../models/turno.model';
import { ESTADO_TURNO } from '../utils/turno-ui';

@Component({
  selector: 'app-turno-edit-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule],
  template: `
    <ui-modal
      [open]="open()"
      [title]="'Editar turno'"
      [subtitle]="turno()?.usuarioNombreCompleto ?? ''"
      [size]="'sm'"
      (closed)="cerrar.emit()">

      @if (turno(); as t) {
        <div class="space-y-4">
          <p class="text-[13px] text-[#2D2926]/60">
            {{ t.fecha }} · turno original <span class="font-medium">{{ t.horarioNombreTurno }}</span>
          </p>

          <!-- Estado -->
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Estado</label>
            <select [(ngModel)]="estado"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              @for (e of estados; track e.value) {
                <option [ngValue]="e.value">{{ e.label }}</option>
              }
            </select>
          </div>

          <!-- Turno / horario -->
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Turno</label>
            <select [(ngModel)]="horarioId"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              @for (h of horarios(); track h.horarioId) {
                <option [ngValue]="h.horarioId">
                  {{ h.nombreTurno }} ({{ h.horaEntrada.slice(0,5) }}–{{ h.horaSalida.slice(0,5) }})
                </option>
              }
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Hora inicio</label>
              <input type="time" [(ngModel)]="horaInicio"
                class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                       text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Hora fin</label>
              <input type="time" [(ngModel)]="horaFin"
                class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                       text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
            </div>
          </div>
        </div>
      }

      <ng-container modal-footer>
        @if (puedeCancelar()) {
          <button type="button" (click)="cancelarTurno()" [disabled]="guardando()"
            class="h-9 px-4 mr-auto rounded-lg border border-red-200 text-red-600 text-sm
                   font-medium hover:bg-red-50 transition-colors disabled:opacity-40">
            Cancelar turno
          </button>
        }
        <button type="button" (click)="cerrar.emit()"
          class="h-9 px-4 rounded-lg text-sm font-medium text-[#2D2926]/70
                 hover:bg-[#F9F5F0] transition-colors">Cerrar</button>
        @if (puedeEditar()) {
          <button type="button" (click)="guardar()" [disabled]="guardando()"
            class="h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                   hover:bg-[#8E6F2E] transition-colors disabled:opacity-40">
            {{ guardando() ? 'Guardando…' : 'Guardar' }}
          </button>
        }
      </ng-container>
    </ui-modal>
  `,
})
export class TurnoEditModalComponent {
  private readonly horarioSvc = inject(HorarioService);
  private readonly turnoSvc = inject(TurnoService);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly open = input.required<boolean>();
  readonly turno = input<TurnoResponse | null>(null);
  /** Puede editar (turnos:update). */
  readonly puedeEditar = input<boolean>(true);
  /** Puede cancelar (turnos:delete). */
  readonly puedeCancelar = input<boolean>(true);
  readonly cerrar = output<void>();
  readonly guardado = output<void>();

  readonly estados = ESTADO_TURNO;
  readonly horarios = signal<HorarioResponse[]>([]);

  readonly estado = signal<EstadoTurno>('PLANIFICADO');
  readonly horarioId = signal<number | null>(null);
  readonly horaInicio = signal('');
  readonly horaFin = signal('');
  readonly guardando = signal(false);

  constructor() {
    this.horarioSvc
      .listarPorEstado('ACTIVO')
      .pipe(catchError(() => of([] as HorarioResponse[])))
      .subscribe((lista) => this.horarios.set(lista));

    // Al abrir con un turno, precargar el formulario.
    effect(() => {
      const t = this.turno();
      if (t) {
        this.estado.set(t.estado);
        this.horarioId.set(t.horarioId);
        this.horaInicio.set(t.horaInicio.slice(0, 5));
        this.horaFin.set(t.horaFin.slice(0, 5));
      }
    });
  }

  guardar(): void {
    const t = this.turno();
    if (!t || this.guardando()) return;

    const payload: UpdateTurnoRequest = {
      estado: this.estado(),
      horarioId: this.horarioId() ?? undefined,
      horaInicio: this.horaInicio() ? `${this.horaInicio()}:00` : undefined,
      horaFin: this.horaFin() ? `${this.horaFin()}:00` : undefined,
    };

    this.guardando.set(true);
    this.turnoSvc.actualizar(t.turnoId, payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.toastr.success('Turno actualizado.');
        this.guardado.emit();
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.guardando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo actualizar el turno.', 'Error');
      },
    });
  }

  async cancelarTurno(): Promise<void> {
    const t = this.turno();
    if (!t || this.guardando()) return;

    const ok = await this.confirm.ask({
      title: 'Cancelar turno',
      message: `¿Cancelar el turno de ${t.usuarioNombreCompleto} del ${t.fecha}?`,
      confirmText: 'Sí, cancelar',
      cancelText: 'Volver',
      variant: 'danger',
    });
    if (!ok) return;

    this.guardando.set(true);
    this.turnoSvc.cancelar(t.turnoId).subscribe({
      next: () => {
        this.guardando.set(false);
        this.toastr.success('Turno cancelado.');
        this.guardado.emit();
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.guardando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo cancelar el turno.', 'Error');
      },
    });
  }
}
