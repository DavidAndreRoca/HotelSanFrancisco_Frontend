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
import { TipoServicioService } from '../services/tipo-servicio.service';
import { EstadoActivo, TipoServicioResponse } from '../models/servicio.model';

@Component({
  selector: 'app-tipo-servicio-form-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule],
  template: `
    <ui-modal
      [open]="open()"
      [title]="esEdicion() ? 'Editar tipo de servicio' : 'Nuevo tipo de servicio'"
      [size]="'sm'"
      (closed)="cerrar.emit()">

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Nombre *</label>
          <input type="text" [(ngModel)]="nombre" maxlength="100" placeholder="Ej. Lavandería"
            class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] placeholder:text-[#2D2926]/35
                   focus:outline-none focus:border-[#C5A048]" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Costo base *</label>
          <input type="number" min="0" step="0.01" [(ngModel)]="costoBase"
            class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Descripción</label>
          <textarea [(ngModel)]="descripcion" rows="2" maxlength="2000" placeholder="Opcional"
            class="w-full px-3 py-2 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] placeholder:text-[#2D2926]/35 resize-none
                   focus:outline-none focus:border-[#C5A048]"></textarea>
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Estado *</label>
          <select [(ngModel)]="estado"
            class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
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
          {{ guardando() ? 'Guardando…' : 'Guardar' }}
        </button>
      </ng-container>
    </ui-modal>
  `,
})
export class TipoServicioFormModalComponent {
  private readonly svc = inject(TipoServicioService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly tipo = input<TipoServicioResponse | null>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<TipoServicioResponse>();

  readonly nombre = signal('');
  readonly costoBase = signal<number | null>(null);
  readonly descripcion = signal('');
  readonly estado = signal<EstadoActivo>('ACTIVO');
  readonly guardando = signal(false);

  readonly esEdicion = computed(() => this.tipo() != null);

  constructor() {
    effect(() => {
      const t = this.tipo();
      this.nombre.set(t?.nombre ?? '');
      this.costoBase.set(t?.costoBase ?? null);
      this.descripcion.set(t?.descripcion ?? '');
      this.estado.set(t?.estado ?? 'ACTIVO');
    });
  }

  puedeGuardar(): boolean {
    return this.nombre().trim().length > 0 && this.costoBase() != null && Number(this.costoBase()) >= 0;
  }

  guardar(): void {
    if (!this.puedeGuardar() || this.guardando()) return;
    this.guardando.set(true);
    const t = this.tipo();
    const payload = {
      nombre: this.nombre().trim(),
      costoBase: Number(this.costoBase()),
      descripcion: this.descripcion().trim() || undefined,
      estado: this.estado(),
    };
    const obs$ = t ? this.svc.actualizar(t.tipoServicioId, payload) : this.svc.crear(payload);
    obs$.subscribe({
      next: (saved) => {
        this.guardando.set(false);
        this.toastr.success(t ? 'Tipo de servicio actualizado.' : 'Tipo de servicio creado.');
        this.guardado.emit(saved);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.guardando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo guardar.', 'Error');
      },
    });
  }
}
