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
import { PedidosServicioService } from '../services/pedidos-servicio.service';
import { PedidoServicio } from '../models/servicio.model';

@Component({
  selector: 'app-rechazar-pedido-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule],
  template: `
    <ui-modal
      [open]="open()"
      [title]="'Rechazar pedido'"
      [subtitle]="pedido()?.tipoServicioNombre ?? ''"
      [size]="'sm'"
      (closed)="cerrar.emit()">

      <div class="space-y-4">
        @if (pedido(); as p) {
          <div class="bg-[#F9F5F0] rounded-lg px-4 py-3">
            <p class="text-sm font-semibold text-[#2D2926]">{{ p.tipoServicioNombre }}</p>
            <p class="text-xs text-[#2D2926]/55 mt-0.5">
              {{ p.solicitanteNombre }} · Reserva {{ p.codReserva }} · Cantidad: {{ p.cantidad }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Motivo del rechazo *</label>
            <textarea [(ngModel)]="motivo" rows="3" maxlength="2000"
              placeholder="Explica por qué se rechaza el pedido"
              class="w-full px-3 py-2 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] placeholder:text-[#2D2926]/35 resize-none
                     focus:outline-none focus:border-[#C5A048]"></textarea>
          </div>

          @if (errorMsg()) {
            <p class="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {{ errorMsg() }}
            </p>
          }
        }
      </div>

      <ng-container modal-footer>
        <button type="button" (click)="cerrar.emit()"
          class="h-9 px-4 rounded-lg text-sm font-medium text-[#2D2926]/70
                 hover:bg-[#F9F5F0] transition-colors">Cancelar</button>
        <button type="button" (click)="enviar()"
          [disabled]="!puedeEnviar() || enviando()"
          class="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-medium
                 hover:bg-red-700 transition-colors disabled:opacity-40
                 disabled:cursor-not-allowed">
          {{ enviando() ? 'Rechazando…' : 'Rechazar' }}
        </button>
      </ng-container>
    </ui-modal>
  `,
})
export class RechazarPedidoModalComponent {
  private readonly svc = inject(PedidosServicioService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly pedido = input<PedidoServicio | null>(null);
  readonly cerrar = output<void>();
  readonly rechazado = output<PedidoServicio>();

  readonly motivo = signal('');
  readonly enviando = signal(false);
  readonly errorMsg = signal('');

  constructor() {
    // Reinicia el formulario cada vez que cambia el pedido seleccionado.
    effect(() => {
      this.pedido();
      this.motivo.set('');
      this.errorMsg.set('');
    });
  }

  readonly puedeEnviar = computed(() => this.pedido() != null && this.motivo().trim().length > 0);

  enviar(): void {
    if (!this.puedeEnviar() || this.enviando()) return;
    const p = this.pedido()!;
    this.enviando.set(true);
    this.errorMsg.set('');
    this.svc.rechazar(p.pedidoServicioId, this.motivo().trim()).subscribe({
      next: (pedido) => {
        this.enviando.set(false);
        this.toastr.success('Pedido rechazado.');
        this.rechazado.emit(pedido);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.enviando.set(false);
        this.errorMsg.set(err.friendlyMessage ?? 'No se pudo rechazar el pedido.');
      },
    });
  }
}
