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
import { VentaService } from '../services/venta.service';
import { EstadoVenta, VentaResponse } from '../models/venta.model';
import { ESTADO_LABEL, transicionesVenta } from '../utils/venta-ui';

@Component({
  selector: 'app-cambiar-estado-venta-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule],
  template: `
    <ui-modal
      [open]="open()"
      [title]="'Cambiar estado de venta'"
      [subtitle]="venta()?.codigoVenta ?? ''"
      [size]="'sm'"
      (closed)="cerrar.emit()">

      @if (venta(); as v) {
        <div class="space-y-4">
          <div class="text-sm">
            <p class="text-[11px] text-[#2D2926]/50 font-medium">Estado actual</p>
            <p class="font-medium text-[#2D2926]">{{ estadoLabel(v.estado) }}</p>
          </div>

          @if (estadosPosibles().length > 0) {
            <div>
              <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Nuevo estado *</label>
              <select [(ngModel)]="nuevoEstado"
                class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                       text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
                <option value="">— Selecciona —</option>
                @for (e of estadosPosibles(); track e) {
                  <option [value]="e">{{ estadoLabel(e) }}</option>
                }
              </select>
              @if (nuevoEstado() === 'COMPLETADA') {
                <p class="text-[11px] text-amber-700 mt-1.5">
                  Al completar se descontará el stock de cada producto.
                </p>
              }
              @if (nuevoEstado() === 'ANULADA' && v.estado === 'COMPLETADA') {
                <p class="text-[11px] text-amber-700 mt-1.5">
                  Al anular una venta completada se devolverá el stock.
                </p>
              }
            </div>

            <div>
              <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Motivo</label>
              <textarea [(ngModel)]="motivo" rows="2" maxlength="500" placeholder="Opcional"
                class="w-full px-3 py-2 rounded-lg border border-[#EEE3D1] bg-white text-sm
                       text-[#2D2926] placeholder:text-[#2D2926]/35 resize-none
                       focus:outline-none focus:border-[#C5A048]"></textarea>
              <p class="text-[11px] text-[#2D2926]/45 mt-1">El motivo es informativo; no se almacena.</p>
            </div>
          } @else {
            <p class="text-sm text-[#2D2926]/55 italic">
              Esta venta está en un estado terminal ({{ estadoLabel(v.estado) }}) y no admite cambios.
            </p>
          }
        </div>
      }

      <ng-container modal-footer>
        <button type="button" (click)="cerrar.emit()"
          class="h-9 px-4 rounded-lg text-sm font-medium text-[#2D2926]/70
                 hover:bg-[#F9F5F0] transition-colors">Cancelar</button>
        <button type="button" (click)="guardar()" [disabled]="nuevoEstado() === '' || guardando()"
          class="h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                 hover:bg-[#8E6F2E] transition-colors disabled:opacity-40
                 disabled:cursor-not-allowed">
          {{ guardando() ? 'Guardando…' : 'Confirmar' }}
        </button>
      </ng-container>
    </ui-modal>
  `,
})
export class CambiarEstadoVentaModalComponent {
  private readonly svc = inject(VentaService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly venta = input<VentaResponse | null>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<VentaResponse>();

  readonly nuevoEstado = signal<EstadoVenta | ''>('');
  readonly motivo = signal('');
  readonly guardando = signal(false);

  readonly estadosPosibles = computed<EstadoVenta[]>(() => {
    const v = this.venta();
    return v ? transicionesVenta(v.estado) : [];
  });

  constructor() {
    effect(() => {
      this.venta();
      this.nuevoEstado.set('');
      this.motivo.set('');
    });
  }

  guardar(): void {
    const v = this.venta();
    const estado = this.nuevoEstado();
    if (!v || estado === '' || this.guardando()) return;
    this.guardando.set(true);
    this.svc.cambiarEstado(v.ventaId, { nuevoEstado: estado, motivo: this.motivo().trim() || undefined }).subscribe({
      next: (saved) => {
        this.guardando.set(false);
        this.toastr.success('Estado de venta actualizado.');
        this.guardado.emit(saved);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.guardando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo cambiar el estado.', 'Error');
      },
    });
  }

  estadoLabel(e: EstadoVenta): string { return ESTADO_LABEL[e]; }
}
