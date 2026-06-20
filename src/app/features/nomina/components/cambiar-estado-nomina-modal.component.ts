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
import { NominaService } from '../services/nomina.service';
import { EstadoNomina, PagoNominaResponse } from '../models/nomina.model';
import { ESTADO_LABEL, transicionesNomina } from '../utils/nomina-ui';

@Component({
  selector: 'app-cambiar-estado-nomina-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule],
  template: `
    <ui-modal
      [open]="open()"
      [title]="'Cambiar estado del pago'"
      [subtitle]="pago()?.periodo ?? ''"
      [size]="'sm'"
      (closed)="cerrar.emit()">

      @if (pago(); as p) {
        <div class="space-y-4">
          <div class="text-sm">
            <p class="text-[11px] text-[#2D2926]/50 font-medium">Estado actual</p>
            <p class="font-medium text-[#2D2926]">{{ estadoLabel(p.estado) }}</p>
          </div>

          @if (estadosPosibles().length > 0) {
            <div>
              <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
                Nuevo estado <span class="text-red-500">*</span>
              </label>
              <select [(ngModel)]="nuevoEstado"
                class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                       text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
                <option value="">— Selecciona —</option>
                @for (e of estadosPosibles(); track e) {
                  <option [value]="e">{{ estadoLabel(e) }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Motivo</label>
              <textarea [(ngModel)]="motivo" rows="2" placeholder="Opcional"
                class="w-full px-3 py-2 rounded-lg border border-[#EEE3D1] bg-white text-sm
                       text-[#2D2926] placeholder:text-[#2D2926]/35 resize-none
                       focus:outline-none focus:border-[#C5A048]"></textarea>
              <p class="text-[11px] text-[#2D2926]/45 mt-1">
                El motivo es informativo; no queda almacenado en el sistema.
              </p>
            </div>
          } @else {
            <p class="text-sm text-[#2D2926]/55 italic">
              Este pago está en un estado terminal ({{ estadoLabel(p.estado) }}) y no admite cambios.
            </p>
          }
        </div>
      }

      <ng-container modal-footer>
        <button type="button" (click)="cerrar.emit()"
          class="h-9 px-4 rounded-lg text-sm font-medium text-[#2D2926]/70
                 hover:bg-[#F9F5F0] transition-colors">Cancelar</button>
        <button type="button" (click)="guardar()"
          [disabled]="nuevoEstado() === '' || guardando()"
          class="h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                 hover:bg-[#8E6F2E] transition-colors disabled:opacity-40
                 disabled:cursor-not-allowed">
          {{ guardando() ? 'Guardando…' : 'Confirmar' }}
        </button>
      </ng-container>
    </ui-modal>
  `,
})
export class CambiarEstadoNominaModalComponent {
  private readonly svc = inject(NominaService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly pago = input<PagoNominaResponse | null>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<PagoNominaResponse>();

  readonly nuevoEstado = signal<EstadoNomina | ''>('');
  readonly motivo = signal('');
  readonly guardando = signal(false);

  readonly estadosPosibles = computed<EstadoNomina[]>(() => {
    const p = this.pago();
    return p ? transicionesNomina(p.estado) : [];
  });

  constructor() {
    effect(() => {
      // Reset al cambiar de pago / reabrir
      this.pago();
      this.nuevoEstado.set('');
      this.motivo.set('');
    });
  }

  guardar(): void {
    const p = this.pago();
    const estado = this.nuevoEstado();
    if (!p || estado === '' || this.guardando()) return;
    this.guardando.set(true);
    this.svc
      .cambiarEstado(p.pagoNominaId, {
        nuevoEstado: estado,
        motivo: this.motivo().trim() || undefined,
      })
      .subscribe({
        next: (actualizado) => {
          this.guardando.set(false);
          this.toastr.success('Estado actualizado.');
          this.guardado.emit(actualizado);
        },
        error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
          this.guardando.set(false);
          this.toastr.error(err.friendlyMessage ?? 'No se pudo cambiar el estado.', 'Error');
        },
      });
  }

  estadoLabel(e: EstadoNomina): string { return ESTADO_LABEL[e]; }
}
