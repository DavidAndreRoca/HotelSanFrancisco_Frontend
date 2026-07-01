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
import { MisServiciosService } from '../services/mis-servicios.service';
import { PedidoServicio, ServicioCatalogoItem } from '../models/servicio.model';

@Component({
  selector: 'app-pedir-servicio-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule],
  template: `
    <ui-modal
      [open]="open()"
      [title]="'Pedir servicio'"
      [subtitle]="servicio()?.nombre ?? ''"
      [size]="'sm'"
      (closed)="cerrar.emit()">

      <div class="space-y-4">
        @if (servicio(); as s) {
          <!-- Resumen del servicio -->
          <div class="bg-[#F9F5F0] rounded-lg px-4 py-3 flex items-center justify-between">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-[#2D2926] truncate">{{ s.nombre }}</p>
              @if (s.descripcion) {
                <p class="text-xs text-[#2D2926]/55 mt-0.5 line-clamp-2">{{ s.descripcion }}</p>
              }
            </div>
            <span class="text-sm font-bold text-[#C5A048] shrink-0 ml-3">
              {{ formatMonto(s.costoBase) }}
            </span>
          </div>

          <!-- Cantidad -->
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Cantidad *</label>
            <input type="number" min="1" [max]="cantidadMaxima" step="1" inputmode="numeric"
              [(ngModel)]="cantidad" (ngModelChange)="normalizarCantidad()"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
            <p class="text-[11px] text-[#2D2926]/45 mt-1">Entre 1 y {{ cantidadMaxima }} unidades.</p>
          </div>

          <!-- Observaciones -->
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Observaciones</label>
            <textarea [(ngModel)]="observaciones" rows="2" maxlength="2000" placeholder="Opcional"
              class="w-full px-3 py-2 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] placeholder:text-[#2D2926]/35 resize-none
                     focus:outline-none focus:border-[#C5A048]"></textarea>
          </div>

          <!-- Subtotal estimado -->
          <div class="flex items-center justify-between text-sm pt-1 border-t border-[#EEE3D1]">
            <span class="text-[#2D2926]/55 font-medium">Subtotal estimado</span>
            <span class="font-bold text-[#2D2926]">{{ formatMonto(subtotal()) }}</span>
          </div>

          <!-- Error de negocio (ej. sin estadía activa) -->
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
          class="h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                 hover:bg-[#8E6F2E] transition-colors disabled:opacity-40
                 disabled:cursor-not-allowed">
          {{ enviando() ? 'Enviando…' : 'Pedir' }}
        </button>
      </ng-container>
    </ui-modal>
  `,
})
export class PedirServicioModalComponent {
  private readonly svc = inject(MisServiciosService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly servicio = input<ServicioCatalogoItem | null>(null);
  readonly cerrar = output<void>();
  readonly pedidoCreado = output<PedidoServicio>();

  /**
   * Tope máximo por pedido (Fase 1). Coincide con el default global del backend.
   * Fase 2: reemplazar por `servicio()?.cantidadMaxima ?? CANTIDAD_MAXIMA` cuando
   * el catálogo exponga el tope por tipo de servicio.
   */
  readonly cantidadMaxima = 50;

  readonly cantidad = signal<number | null>(1);
  readonly observaciones = signal('');
  readonly enviando = signal(false);
  readonly errorMsg = signal('');

  readonly subtotal = computed(() => {
    const c = Number(this.cantidad());
    const base = this.servicio()?.costoBase ?? 0;
    return c > 0 ? c * base : 0;
  });

  constructor() {
    // Reinicia el formulario cada vez que cambia el servicio seleccionado.
    effect(() => {
      this.servicio();
      this.cantidad.set(1);
      this.observaciones.set('');
      this.errorMsg.set('');
    });
  }

  /** Recorta la cantidad a un entero dentro de [1, cantidadMaxima] mientras el usuario escribe. */
  normalizarCantidad(): void {
    const raw = this.cantidad();
    if (raw == null || Number.isNaN(Number(raw))) return; // deja el campo vacío para no pelear con el usuario
    let n = Math.trunc(Number(raw));
    if (n < 1) n = 1;
    if (n > this.cantidadMaxima) n = this.cantidadMaxima;
    if (n !== raw) this.cantidad.set(n);
  }

  private cantidadValida(): boolean {
    const n = Number(this.cantidad());
    return Number.isInteger(n) && n >= 1 && n <= this.cantidadMaxima;
  }

  puedeEnviar(): boolean {
    return this.servicio() != null && this.cantidadValida();
  }

  enviar(): void {
    if (!this.puedeEnviar() || this.enviando()) return;
    const s = this.servicio()!;
    this.enviando.set(true);
    this.errorMsg.set('');
    this.svc
      .crear({
        tipoServicioId: s.tipoServicioId,
        cantidad: Number(this.cantidad()),
        observaciones: this.observaciones().trim() || undefined,
      })
      .subscribe({
        next: (pedido) => {
          this.enviando.set(false);
          this.toastr.success('Pedido registrado. Recepción lo revisará.');
          this.pedidoCreado.emit(pedido);
        },
        error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
          this.enviando.set(false);
          // Muestra el mensaje del backend (ej. "No tienes una estadía activa…") inline.
          this.errorMsg.set(err.friendlyMessage ?? 'No se pudo registrar el pedido.');
        },
      });
  }

  formatMonto(n: number): string {
    return 'S/. ' + n.toLocaleString('en-US');
  }
}
