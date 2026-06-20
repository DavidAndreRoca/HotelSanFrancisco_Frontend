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
import { EmpleadoSelectorComponent } from '../../../shared/components/empleado-selector/empleado-selector.component';
import { UsuarioResumen } from '../../../core/usuarios/usuario-lookup.service';
import { NominaService } from '../services/nomina.service';
import { PagoNominaResponse } from '../models/nomina.model';
import { formatMonto } from '../utils/nomina-ui';

@Component({
  selector: 'app-nomina-form-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule, EmpleadoSelectorComponent],
  template: `
    <ui-modal
      [open]="open()"
      [title]="'Nuevo pago de nómina'"
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
              Período <span class="text-red-500">*</span>
            </label>
            <input type="text" [(ngModel)]="periodo" placeholder="Ej. JUNIO-2026"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] placeholder:text-[#2D2926]/35
                     focus:outline-none focus:border-[#C5A048]" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
              Fecha de emisión <span class="text-red-500">*</span>
            </label>
            <input type="date" [(ngModel)]="fechaEmision"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
              Sueldo base <span class="text-red-500">*</span>
            </label>
            <input type="number" min="0" step="0.01" [(ngModel)]="sueldoBase"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
              Descuentos <span class="text-red-500">*</span>
            </label>
            <input type="number" min="0" step="0.01" [(ngModel)]="totalDescuentos"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
          </div>
        </div>

        <!-- Preview NO vinculante del monto neto -->
        <div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#F9F5F0]
                    border border-[#EEE3D1]">
          <span class="text-xs text-[#2D2926]/55">Monto neto estimado</span>
          <span class="text-sm font-bold text-[#2D2926]">{{ montoNetoPreview() }}</span>
        </div>
        <p class="text-[11px] text-[#2D2926]/45 -mt-2">
          Estimación local (sueldo − descuentos). El valor oficial lo calcula el sistema al guardar.
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
          {{ guardando() ? 'Guardando…' : 'Crear pago' }}
        </button>
      </ng-container>
    </ui-modal>
  `,
})
export class NominaFormModalComponent {
  private readonly svc = inject(NominaService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly cerrar = output<void>();
  readonly guardado = output<PagoNominaResponse>();

  readonly usuarioId = signal<number | null>(null);
  readonly periodo = signal('');
  readonly fechaEmision = signal('');
  readonly sueldoBase = signal<number | null>(null);
  readonly totalDescuentos = signal<number | null>(null);
  readonly guardando = signal(false);

  /** Solo preview visual — NO se envía ni reemplaza el cálculo del backend. */
  readonly montoNetoPreview = computed(() => {
    const base = Number(this.sueldoBase() ?? 0);
    const desc = Number(this.totalDescuentos() ?? 0);
    return formatMonto(Math.max(0, base - desc));
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        this.usuarioId.set(null);
        this.periodo.set('');
        this.fechaEmision.set(new Date().toISOString().slice(0, 10));
        this.sueldoBase.set(null);
        this.totalDescuentos.set(null);
      }
    });
  }

  onEmpleado(u: UsuarioResumen | null): void {
    this.usuarioId.set(u?.usuarioId ?? null);
  }

  puedeGuardar(): boolean {
    return (
      this.usuarioId() != null &&
      this.periodo().trim().length > 0 &&
      !!this.fechaEmision() &&
      this.sueldoBase() != null && Number(this.sueldoBase()) >= 0 &&
      this.totalDescuentos() != null && Number(this.totalDescuentos()) >= 0
    );
  }

  guardar(): void {
    if (!this.puedeGuardar() || this.guardando()) return;
    this.guardando.set(true);
    this.svc
      .crear({
        usuarioId: this.usuarioId()!,
        periodo: this.periodo().trim(),
        fechaEmision: this.fechaEmision(),
        sueldoBase: Number(this.sueldoBase()),
        totalDescuentos: Number(this.totalDescuentos()),
      })
      .subscribe({
        next: (creado) => {
          this.guardando.set(false);
          this.toastr.success('Pago de nómina creado.');
          this.guardado.emit(creado);
        },
        error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
          this.guardando.set(false);
          this.toastr.error(err.friendlyMessage ?? 'No se pudo crear el pago.', 'Error');
        },
      });
  }
}
