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
import { catchError, of } from 'rxjs';
import { UiModalComponent } from '../../../shared/ui/modal/ui-modal.component';
import { EstanciaSelectorComponent } from '../../../shared/components/estancia-selector/estancia-selector.component';
import { TipoServicioService } from '../services/tipo-servicio.service';
import { ServicioService } from '../services/servicio.service';
import { ServicioResponse, TipoServicioResponse } from '../models/servicio.model';

@Component({
  selector: 'app-servicio-form-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule, EstanciaSelectorComponent],
  template: `
    <ui-modal
      [open]="open()"
      [title]="esEdicion() ? 'Editar consumo' : 'Registrar consumo'"
      [size]="'sm'"
      (closed)="cerrar.emit()">

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Tipo de servicio *</label>
          <select [(ngModel)]="tipoServicioId" (ngModelChange)="onTipo($event)"
            class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
            <option [ngValue]="null">— Selecciona —</option>
            @for (t of tipos(); track t.tipoServicioId) {
              <option [ngValue]="t.tipoServicioId">{{ t.nombre }} (S/. {{ t.costoBase }})</option>
            }
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Estancia *</label>
          @if (esEdicion() && estanciaId() != null) {
            <p class="text-[11px] text-[#2D2926]/45 mb-1">
              Estancia actual: #{{ estanciaId() }} — elige otra reserva para cambiarla.
            </p>
          }
          <app-estancia-selector (estanciaElegida)="onEstancia($event)" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Cantidad *</label>
            <input type="number" min="0.01" step="0.01" [(ngModel)]="cantidad"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Precio aplicado</label>
            <input type="number" min="0" step="0.01" [(ngModel)]="precioAplicado"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Fecha de consumo</label>
          <input type="datetime-local" [(ngModel)]="fechaConsumo"
            class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
        </div>

        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Observaciones</label>
          <textarea [(ngModel)]="observaciones" rows="2" maxlength="2000" placeholder="Opcional"
            class="w-full px-3 py-2 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] placeholder:text-[#2D2926]/35 resize-none
                   focus:outline-none focus:border-[#C5A048]"></textarea>
        </div>

        <!-- Preview no vinculante -->
        <div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#F9F5F0]
                    border border-[#EEE3D1]">
          <span class="text-xs text-[#2D2926]/55">Subtotal estimado</span>
          <span class="text-sm font-bold text-[#2D2926]">S/. {{ subtotalPreview() }}</span>
        </div>
        <p class="text-[11px] text-[#2D2926]/45 -mt-2">
          Estimación local. El subtotal oficial lo calcula el sistema al guardar.
        </p>
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
export class ServicioFormModalComponent {
  private readonly tipoSvc = inject(TipoServicioService);
  private readonly svc = inject(ServicioService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly servicio = input<ServicioResponse | null>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<ServicioResponse>();

  readonly tipos = signal<TipoServicioResponse[]>([]);

  readonly tipoServicioId = signal<number | null>(null);
  readonly estanciaId = signal<number | null>(null);
  readonly cantidad = signal<number | null>(null);
  readonly precioAplicado = signal<number | null>(null);
  readonly fechaConsumo = signal('');
  readonly observaciones = signal('');
  readonly guardando = signal(false);

  readonly esEdicion = computed(() => this.servicio() != null);

  readonly subtotalPreview = computed(() => {
    const c = Number(this.cantidad() ?? 0);
    const p = Number(this.precioAplicado() ?? 0);
    return (c * p).toFixed(2);
  });

  constructor() {
    this.tipoSvc
      .listarPorEstado('ACTIVO')
      .pipe(catchError(() => of([] as TipoServicioResponse[])))
      .subscribe((t) => this.tipos.set(t));

    effect(() => {
      const s = this.servicio();
      if (s) {
        this.tipoServicioId.set(s.tipoServicioId);
        this.estanciaId.set(s.estanciaId);
        this.cantidad.set(s.cantidad);
        this.precioAplicado.set(s.precioAplicado);
        this.fechaConsumo.set(s.fechaConsumo ? s.fechaConsumo.slice(0, 16) : '');
        this.observaciones.set(s.observaciones ?? '');
      } else {
        this.tipoServicioId.set(null);
        this.estanciaId.set(null);
        this.cantidad.set(null);
        this.precioAplicado.set(null);
        this.fechaConsumo.set('');
        this.observaciones.set('');
      }
    });
  }

  onEstancia(id: number | null): void {
    this.estanciaId.set(id);
  }

  /** Al elegir tipo, sugiere su costoBase como precio aplicado (editable). */
  onTipo(id: number | null): void {
    if (id == null) return;
    const t = this.tipos().find((x) => x.tipoServicioId === id);
    if (t && this.precioAplicado() == null) this.precioAplicado.set(t.costoBase);
  }

  puedeGuardar(): boolean {
    return (
      this.tipoServicioId() != null &&
      this.estanciaId() != null && Number(this.estanciaId()) > 0 &&
      this.cantidad() != null && Number(this.cantidad()) > 0
    );
  }

  guardar(): void {
    if (!this.puedeGuardar() || this.guardando()) return;
    this.guardando.set(true);
    const s = this.servicio();

    const payload = {
      tipoServicioId: this.tipoServicioId()!,
      estanciaId: Number(this.estanciaId()),
      cantidad: Number(this.cantidad()),
      precioAplicado: this.precioAplicado() != null ? Number(this.precioAplicado()) : undefined,
      observaciones: this.observaciones().trim() || undefined,
      fechaConsumo: this.fechaConsumo() ? `${this.fechaConsumo()}:00` : undefined,
    };

    const obs$ = s ? this.svc.actualizar(s.servicioId, payload) : this.svc.crear(payload);
    obs$.subscribe({
      next: (saved) => {
        this.guardando.set(false);
        this.toastr.success(s ? 'Consumo actualizado.' : 'Consumo registrado.');
        this.guardado.emit(saved);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.guardando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo guardar el consumo.', 'Error');
      },
    });
  }
}
