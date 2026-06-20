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
import { UiModalComponent } from '../../../shared/ui/modal/ui-modal.component';
import { EmpleadoSelectorComponent } from '../../../shared/components/empleado-selector/empleado-selector.component';
import { UsuarioResumen } from '../../../core/usuarios/usuario-lookup.service';
import { AsistenciaService } from '../services/asistencia.service';
import { AsistenciaResponse, TipoAsistencia } from '../models/asistencia.model';
import { TIPO_ASISTENCIA } from '../utils/asistencia-ui';

@Component({
  selector: 'app-asistencia-entrada-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule, EmpleadoSelectorComponent],
  template: `
    <ui-modal
      [open]="open()"
      [title]="'Registrar entrada'"
      [size]="'sm'"
      (closed)="cerrar.emit()">

      <div class="space-y-4">
        <!-- Empleado -->
        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
            Empleado <span class="text-red-500">*</span>
          </label>
          <app-empleado-selector (elegido)="onEmpleado($event)" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
              Fecha <span class="text-red-500">*</span>
            </label>
            <input type="date" [(ngModel)]="fecha"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
              Hora de ingreso <span class="text-red-500">*</span>
            </label>
            <input type="time" [(ngModel)]="horaIngreso"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
            Tipo <span class="text-red-500">*</span>
          </label>
          <select [(ngModel)]="tipo"
            class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
            @for (t of tipos; track t.value) {
              <option [value]="t.value">{{ t.label }}</option>
            }
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Observaciones</label>
          <textarea [(ngModel)]="observaciones" rows="2" placeholder="Opcional"
            class="w-full px-3 py-2 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] placeholder:text-[#2D2926]/35 resize-none
                   focus:outline-none focus:border-[#C5A048]"></textarea>
        </div>
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
          {{ guardando() ? 'Guardando…' : 'Registrar' }}
        </button>
      </ng-container>
    </ui-modal>
  `,
})
export class AsistenciaEntradaModalComponent {
  private readonly svc = inject(AsistenciaService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly cerrar = output<void>();
  readonly guardado = output<AsistenciaResponse>();

  readonly tipos = TIPO_ASISTENCIA;

  readonly usuarioId = signal<number | null>(null);
  readonly fecha = signal('');
  readonly horaIngreso = signal('');
  readonly tipo = signal<TipoAsistencia>('NORMAL');
  readonly observaciones = signal('');
  readonly guardando = signal(false);

  constructor() {
    // Form fresco cada vez que se abre (el selector se recrea solo dentro del modal)
    effect(() => {
      if (this.open()) {
        this.usuarioId.set(null);
        this.fecha.set(new Date().toISOString().slice(0, 10));
        this.horaIngreso.set('');
        this.tipo.set('NORMAL');
        this.observaciones.set('');
      }
    });
  }

  onEmpleado(u: UsuarioResumen | null): void {
    this.usuarioId.set(u?.usuarioId ?? null);
  }

  puedeGuardar(): boolean {
    return this.usuarioId() != null && !!this.fecha() && !!this.horaIngreso();
  }

  private aHHmmss(v: string): string {
    return v.length === 5 ? `${v}:00` : v;
  }

  guardar(): void {
    if (!this.puedeGuardar() || this.guardando()) return;
    this.guardando.set(true);
    this.svc
      .registrarEntrada({
        usuarioId: this.usuarioId()!,
        fecha: this.fecha(),
        horaIngreso: this.aHHmmss(this.horaIngreso()),
        tipo: this.tipo(),
        observaciones: this.observaciones().trim() || undefined,
      })
      .subscribe({
        next: (creada) => {
          this.guardando.set(false);
          this.toastr.success('Entrada registrada.');
          this.guardado.emit(creada);
        },
        error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
          this.guardando.set(false);
          this.toastr.error(err.friendlyMessage ?? 'No se pudo registrar la entrada.', 'Error');
        },
      });
  }
}
