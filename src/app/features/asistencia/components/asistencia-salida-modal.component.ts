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
import { AsistenciaService } from '../services/asistencia.service';
import { AsistenciaResponse } from '../models/asistencia.model';

@Component({
  selector: 'app-asistencia-salida-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule],
  template: `
    <ui-modal
      [open]="open()"
      [title]="'Registrar salida'"
      [subtitle]="asistencia()?.usuarioNombreCompleto ?? ''"
      [size]="'sm'"
      (closed)="cerrar.emit()">

      @if (asistencia(); as a) {
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-[11px] text-[#2D2926]/50 font-medium">Fecha</p>
              <p class="font-medium text-[#2D2926]">{{ a.fecha }}</p>
            </div>
            <div>
              <p class="text-[11px] text-[#2D2926]/50 font-medium">Hora de ingreso</p>
              <p class="font-medium text-[#2D2926] font-mono">{{ a.horaIngreso.slice(0,5) }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
              Hora de egreso <span class="text-red-500">*</span>
            </label>
            <input type="time" [(ngModel)]="horaEgreso"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
            <p class="text-[11px] text-[#2D2926]/45 mt-1">
              Las horas trabajadas las calcula el sistema al guardar.
            </p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Observaciones</label>
            <textarea [(ngModel)]="observaciones" rows="2" placeholder="Opcional"
              class="w-full px-3 py-2 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] placeholder:text-[#2D2926]/35 resize-none
                     focus:outline-none focus:border-[#C5A048]"></textarea>
          </div>
        </div>
      }

      <ng-container modal-footer>
        <button type="button" (click)="cerrar.emit()"
          class="h-9 px-4 rounded-lg text-sm font-medium text-[#2D2926]/70
                 hover:bg-[#F9F5F0] transition-colors">Cancelar</button>
        <button type="button" (click)="guardar()"
          [disabled]="!horaEgreso() || guardando()"
          class="h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                 hover:bg-[#8E6F2E] transition-colors disabled:opacity-40
                 disabled:cursor-not-allowed">
          {{ guardando() ? 'Guardando…' : 'Registrar salida' }}
        </button>
      </ng-container>
    </ui-modal>
  `,
})
export class AsistenciaSalidaModalComponent {
  private readonly svc = inject(AsistenciaService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly asistencia = input<AsistenciaResponse | null>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<AsistenciaResponse>();

  readonly horaEgreso = signal('');
  readonly observaciones = signal('');
  readonly guardando = signal(false);

  constructor() {
    effect(() => {
      const a = this.asistencia();
      this.horaEgreso.set(a?.horaEgreso ? a.horaEgreso.slice(0, 5) : '');
      this.observaciones.set(a?.observaciones ?? '');
    });
  }

  private aHHmmss(v: string): string {
    return v.length === 5 ? `${v}:00` : v;
  }

  guardar(): void {
    const a = this.asistencia();
    if (!a || !this.horaEgreso() || this.guardando()) return;
    this.guardando.set(true);
    this.svc
      .registrarSalida(a.asistenciaId, {
        horaEgreso: this.aHHmmss(this.horaEgreso()),
        observaciones: this.observaciones().trim() || undefined,
      })
      .subscribe({
        next: (actualizada) => {
          this.guardando.set(false);
          this.toastr.success('Salida registrada.');
          this.guardado.emit(actualizada);
        },
        error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
          this.guardando.set(false);
          this.toastr.error(err.friendlyMessage ?? 'No se pudo registrar la salida.', 'Error');
        },
      });
  }
}
