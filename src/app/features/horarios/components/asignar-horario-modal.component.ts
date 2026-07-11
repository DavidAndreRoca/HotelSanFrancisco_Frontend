import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { catchError, forkJoin, of } from 'rxjs';
import { UiModalComponent } from '../../../shared/ui/modal/ui-modal.component';
import { HorarioService } from '../services/horario.service';
import { AsignacionHorarioService } from '../services/asignacion-horario.service';
import { DetalleHorarioResponse, HorarioResponse } from '../models/horario.model';

const DIAS = [
  { v: 1, label: 'Lunes' },
  { v: 2, label: 'Martes' },
  { v: 3, label: 'Miércoles' },
  { v: 4, label: 'Jueves' },
  { v: 5, label: 'Viernes' },
  { v: 6, label: 'Sábado' },
  { v: 7, label: 'Domingo' },
];

@Component({
  selector: 'app-asignar-horario-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule],
  template: `
    <ui-modal
      [open]="open()"
      [title]="'Asignar horario'"
      [subtitle]="empleadoNombre()"
      [size]="'sm'"
      (closed)="cerrar.emit()">

      <div class="space-y-4">
        <!-- Horario -->
        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
            Turno <span class="text-red-500">*</span>
          </label>
          <select [(ngModel)]="horarioId"
            class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
            <option [ngValue]="null">— Selecciona un turno —</option>
            @for (h of horarios(); track h.horarioId) {
              <option [ngValue]="h.horarioId">
                {{ h.nombreTurno }} ({{ h.horaEntrada.slice(0,5) }}–{{ h.horaSalida.slice(0,5) }})
              </option>
            }
          </select>
        </div>

        <!-- Días de la semana -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-sm font-semibold text-[#2D2926]">
              Días de la semana <span class="text-red-500">*</span>
            </label>
            <button type="button" (click)="toggleLunVie()"
              class="text-[11px] font-medium text-[#C5A048] hover:text-[#8E6F2E] transition-colors">
              Lun–Vie
            </button>
          </div>
          <div class="grid grid-cols-4 gap-1.5">
            @for (d of dias; track d.v) {
              <button type="button" (click)="toggleDia(d.v)"
                class="h-9 rounded-lg border text-xs font-medium transition-colors"
                [class]="diaSel(d.v)
                  ? 'border-[#C5A048] bg-[#C5A048] text-white'
                  : 'border-[#EEE3D1] bg-white text-[#2D2926]/70 hover:border-[#C5A048]'">
                {{ d.label.slice(0, 3) }}
              </button>
            }
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- Vigencia inicio -->
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
              Vigencia desde <span class="text-red-500">*</span>
            </label>
            <input type="date" [(ngModel)]="vigInicio"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>
          <!-- Vigencia fin -->
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Vigencia hasta</label>
            <input type="date" [(ngModel)]="vigFin"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>
        </div>
        <p class="text-[11px] text-[#2D2926]/45">Deja “hasta” vacío para vigencia indefinida.</p>
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
          {{ guardando() ? 'Asignando…' : botonLabel() }}
        </button>
      </ng-container>
    </ui-modal>
  `,
})
export class AsignarHorarioModalComponent {
  private readonly horarioSvc = inject(HorarioService);
  private readonly asignacionSvc = inject(AsignacionHorarioService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly usuarioId = input.required<number>();
  readonly empleadoNombre = input<string>('');
  readonly cerrar = output<void>();
  readonly guardado = output<DetalleHorarioResponse>();

  readonly dias = DIAS;
  readonly horarios = signal<HorarioResponse[]>([]);

  readonly horarioId = signal<number | null>(null);
  readonly diasSel = signal<number[]>([]);
  readonly vigInicio = signal('');
  readonly vigFin = signal('');
  readonly guardando = signal(false);

  diaSel(v: number): boolean {
    return this.diasSel().includes(v);
  }

  toggleDia(v: number): void {
    this.diasSel.update((ds) =>
      ds.includes(v) ? ds.filter((d) => d !== v) : [...ds, v],
    );
  }

  toggleLunVie(): void {
    const lunVie = [1, 2, 3, 4, 5];
    const todos = lunVie.every((d) => this.diasSel().includes(d));
    this.diasSel.update((ds) =>
      todos ? ds.filter((d) => !lunVie.includes(d)) : [...new Set([...ds, ...lunVie])],
    );
  }

  constructor() {
    // Turnos activos para el select (lista completa sin paginar)
    this.horarioSvc
      .listarPorEstado('ACTIVO')
      .pipe(catchError(() => of([] as HorarioResponse[])))
      .subscribe((lista) => this.horarios.set(lista));
  }

  puedeGuardar(): boolean {
    return this.horarioId() != null && this.diasSel().length > 0 && !!this.vigInicio();
  }

  botonLabel(): string {
    const n = this.diasSel().length;
    return n > 1 ? `Asignar ${n} días` : 'Asignar';
  }

  guardar(): void {
    if (!this.puedeGuardar() || this.guardando()) return;
    this.guardando.set(true);

    // Una asignación por día. El backend responde 422 si el empleado ya tiene un
    // turno ese día; recogemos el resultado por día para informar sin abortar el resto.
    const dias = [...this.diasSel()].sort((a, b) => a - b);
    const peticiones = dias.map((diaSemana) =>
      this.asignacionSvc
        .asignar({
          horarioId: this.horarioId()!,
          usuarioId: this.usuarioId(),
          diaSemana,
          fechaVigenciaInicio: this.vigInicio(),
          fechaVigenciaFin: this.vigFin() || null,
        })
        .pipe(
          catchError((err: HttpErrorResponse & { friendlyMessage?: string }) =>
            of({ diaSemana, error: err.friendlyMessage ?? 'No se pudo asignar.' }),
          ),
        ),
    );

    forkJoin(peticiones).subscribe((resultados) => {
      this.guardando.set(false);
      const fallos = resultados.filter(
        (r): r is { diaSemana: number; error: string } => 'error' in r,
      );
      const exitos = resultados.filter(
        (r): r is DetalleHorarioResponse => !('error' in r),
      );

      if (exitos.length > 0) {
        this.toastr.success(
          exitos.length === 1 ? 'Horario asignado.' : `${exitos.length} días asignados.`,
        );
      }
      for (const f of fallos) {
        this.toastr.error(f.error, DIAS[f.diaSemana - 1]?.label ?? `Día ${f.diaSemana}`);
      }

      if (fallos.length === 0) this.reset();
      if (exitos.length > 0) this.guardado.emit(exitos[exitos.length - 1]);
    });
  }

  private reset(): void {
    this.horarioId.set(null);
    this.diasSel.set([]);
    this.vigInicio.set('');
    this.vigFin.set('');
  }
}
