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
import { SolicitudService } from '../services/solicitud.service';
import {
  ModuloReferido,
  PrioridadSolicitud,
  SolicitudResponse,
} from '../models/solicitud.model';
import { MODULO_LABEL, PRIORIDAD_LABEL } from '../utils/solicitud-ui';

@Component({
  selector: 'app-editar-solicitud-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule],
  template: `
    <ui-modal
      [open]="open()"
      [title]="'Editar solicitud'"
      [subtitle]="solicitud()?.codigoSolicitud ?? ''"
      [size]="'md'"
      (closed)="cerrar.emit()">

      <div class="space-y-4">
        <!-- Asunto -->
        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Asunto</label>
          <input
            type="text"
            [(ngModel)]="asunto"
            maxlength="150"
            class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          <p class="text-[11px] text-[#2D2926]/40 mt-1 text-right">{{ asunto().length }}/150</p>
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Descripción</label>
          <textarea
            [(ngModel)]="descripcion"
            rows="4"
            maxlength="4000"
            class="w-full px-3 py-2 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] resize-none focus:outline-none focus:border-[#C5A048]"></textarea>
          <p class="text-[11px] text-[#2D2926]/40 mt-1 text-right">{{ descripcion().length }}/4000</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- Prioridad -->
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Prioridad</label>
            <select
              [(ngModel)]="prioridad"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              @for (p of prioridades; track p) {
                <option [value]="p">{{ prioridadLabel(p) }}</option>
              }
            </select>
          </div>

          <!-- Módulo -->
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Módulo referido</label>
            <select
              [(ngModel)]="modulo"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              <option value="">— Ninguno —</option>
              @for (m of modulos; track m) {
                <option [value]="m">{{ moduloLabel(m) }}</option>
              }
            </select>
          </div>
        </div>
      </div>

      <ng-container modal-footer>
        <button
          type="button"
          (click)="cerrar.emit()"
          class="h-9 px-4 rounded-lg text-sm font-medium text-[#2D2926]/70
                 hover:bg-[#F9F5F0] transition-colors">
          Cancelar
        </button>
        <button
          type="button"
          (click)="guardar()"
          [disabled]="!puedeGuardar() || guardando()"
          class="h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                 hover:bg-[#8E6F2E] transition-colors disabled:opacity-40
                 disabled:cursor-not-allowed">
          {{ guardando() ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </ng-container>
    </ui-modal>
  `,
})
export class EditarSolicitudModalComponent {
  private readonly svc = inject(SolicitudService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly solicitud = input<SolicitudResponse | null>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<SolicitudResponse>();

  readonly asunto = signal('');
  readonly descripcion = signal('');
  readonly prioridad = signal<PrioridadSolicitud>('MEDIA');
  readonly modulo = signal<ModuloReferido | ''>('');
  readonly guardando = signal(false);

  readonly prioridades: PrioridadSolicitud[] = ['ALTA', 'MEDIA', 'BAJA'];
  readonly modulos: ModuloReferido[] = [
    'RESERVAS', 'HABITACIONES', 'PAGOS', 'EMPLEADOS', 'REPORTES', 'INVENTARIO', 'OTRO',
  ];

  constructor() {
    // Precargar el formulario cuando llega/cambia la solicitud
    effect(() => {
      const s = this.solicitud();
      if (!s) return;
      this.asunto.set(s.asunto);
      this.descripcion.set(s.descripcion);
      this.prioridad.set(s.prioridad);
      this.modulo.set(s.moduloReferido ?? '');
    });
  }

  puedeGuardar(): boolean {
    return this.asunto().trim().length > 0 && this.descripcion().trim().length > 0;
  }

  guardar(): void {
    const s = this.solicitud();
    if (!s || !this.puedeGuardar() || this.guardando()) return;

    this.guardando.set(true);
    this.svc
      .actualizar(s.solicitudId, {
        asunto: this.asunto().trim(),
        descripcion: this.descripcion().trim(),
        prioridad: this.prioridad(),
        moduloReferido: this.modulo() || undefined,
      })
      .subscribe({
        next: (actualizada) => {
          this.guardando.set(false);
          this.toastr.success('Solicitud actualizada correctamente.');
          this.guardado.emit(actualizada);
        },
        error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
          this.guardando.set(false);
          this.toastr.error(
            err.friendlyMessage ?? 'No se pudo actualizar la solicitud.',
            'Error',
          );
        },
      });
  }

  prioridadLabel(p: PrioridadSolicitud): string { return PRIORIDAD_LABEL[p]; }
  moduloLabel(m: ModuloReferido): string { return MODULO_LABEL[m]; }
}
