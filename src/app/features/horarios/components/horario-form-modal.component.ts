import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { UiModalComponent } from '../../../shared/ui/modal/ui-modal.component';
import { HorarioService } from '../services/horario.service';
import { EstadoActivo, HorarioResponse } from '../models/horario.model';

@Component({
  selector: 'app-horario-form-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule],
  template: `
    <ui-modal
      [open]="open()"
      [title]="esEdicion() ? 'Editar horario' : 'Nuevo horario'"
      [size]="'sm'"
      (closed)="cerrar.emit()">

      <div class="space-y-4">
        <!-- Nombre del turno -->
        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
            Nombre del turno <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            [(ngModel)]="nombreTurno"
            maxlength="80"
            placeholder="Ej. Turno Mañana"
            class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] placeholder:text-[#2D2926]/35
                   focus:outline-none focus:border-[#C5A048]" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- Hora entrada -->
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
              Hora de entrada <span class="text-red-500">*</span>
            </label>
            <input
              type="time"
              [(ngModel)]="horaEntrada"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>

          <!-- Hora salida -->
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
              Hora de salida <span class="text-red-500">*</span>
            </label>
            <input
              type="time"
              [(ngModel)]="horaSalida"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>
        </div>

        @if (horasIguales()) {
          <p class="text-xs text-red-500">
            La hora de salida debe ser distinta a la de entrada.
          </p>
        }

        <!-- Estado (solo edición) -->
        @if (esEdicion()) {
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Estado</label>
            <select
              [(ngModel)]="estado"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
        }
      </div>

      <ng-container modal-footer>
        <button type="button" (click)="cerrar.emit()"
          class="h-9 px-4 rounded-lg text-sm font-medium text-[#2D2926]/70
                 hover:bg-[#F9F5F0] transition-colors">Cancelar</button>
        <button type="button" (click)="guardar()"
          [disabled]="!puedeGuardar() || guardando()"
          class="h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                 hover:bg-[#8E6F2E] transition-colors disabled:opacity-40
                 disabled:cursor-not-allowed">
          {{ guardando() ? 'Guardando…' : 'Guardar' }}
        </button>
      </ng-container>
    </ui-modal>
  `,
})
export class HorarioFormModalComponent {
  private readonly svc = inject(HorarioService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly horario = input<HorarioResponse | null>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<HorarioResponse>();

  readonly nombreTurno = signal('');
  readonly horaEntrada = signal(''); // "HH:mm" (input time)
  readonly horaSalida = signal('');
  readonly estado = signal<EstadoActivo>('ACTIVO');
  readonly guardando = signal(false);

  readonly esEdicion = computed(() => this.horario() != null);
  readonly horasIguales = computed(
    () => !!this.horaEntrada() && this.horaEntrada() === this.horaSalida(),
  );

  constructor() {
    effect(() => {
      const h = this.horario();
      if (h) {
        this.nombreTurno.set(h.nombreTurno);
        this.horaEntrada.set(h.horaEntrada.slice(0, 5));
        this.horaSalida.set(h.horaSalida.slice(0, 5));
        this.estado.set(h.estado);
      } else {
        this.nombreTurno.set('');
        this.horaEntrada.set('');
        this.horaSalida.set('');
        this.estado.set('ACTIVO');
      }
    });
  }

  puedeGuardar(): boolean {
    return (
      this.nombreTurno().trim().length > 0 &&
      !!this.horaEntrada() &&
      !!this.horaSalida() &&
      !this.horasIguales()
    );
  }

  /** input time → "HH:mm:ss" que espera el backend. */
  private aHHmmss(v: string): string {
    return v.length === 5 ? `${v}:00` : v;
  }

  guardar(): void {
    if (!this.puedeGuardar() || this.guardando()) return;
    this.guardando.set(true);

    const h = this.horario();
    const obs$ = h
      ? this.svc.actualizar(h.horarioId, {
          nombreTurno: this.nombreTurno().trim(),
          horaEntrada: this.aHHmmss(this.horaEntrada()),
          horaSalida: this.aHHmmss(this.horaSalida()),
          estado: this.estado(),
        })
      : this.svc.crear({
          nombreTurno: this.nombreTurno().trim(),
          horaEntrada: this.aHHmmss(this.horaEntrada()),
          horaSalida: this.aHHmmss(this.horaSalida()),
        });

    obs$.subscribe({
      next: (guardado) => {
        this.guardando.set(false);
        this.toastr.success(h ? 'Horario actualizado.' : 'Horario creado.');
        this.guardado.emit(guardado);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.guardando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo guardar el horario.', 'Error');
      },
    });
  }
}
