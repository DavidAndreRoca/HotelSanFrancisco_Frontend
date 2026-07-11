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
import { AuthStore } from '../../../core/auth/auth.store';
import { NominaService } from '../services/nomina.service';
import { CalculoNominaResponse, PagoNominaResponse } from '../models/nomina.model';
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
            <input type="month" [(ngModel)]="periodo"
              class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
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

        <!-- Cálculo asistido desde asistencia -->
        @if (puedeCalcular()) {
          <div>
            <button type="button" (click)="calcular()"
              [disabled]="usuarioId() == null || !periodo() || calculando()"
              class="w-full h-9 rounded-lg border border-[#C5A048] text-[#8E6F2E] text-sm
                     font-medium hover:bg-[#F9F5F0] transition-colors disabled:opacity-40
                     disabled:cursor-not-allowed">
              {{ calculando() ? 'Calculando…' : 'Calcular desde asistencia' }}
            </button>
            @if (usuarioId() == null || !periodo()) {
              <p class="text-[11px] text-[#2D2926]/45 mt-1">
                Elige empleado y período para calcular.
              </p>
            }
          </div>

          @if (calculo(); as c) {
            <div class="rounded-lg border border-[#EEE3D1] bg-[#FBF8F3] p-3 space-y-1.5 text-[13px]">
              <div class="flex justify-between"><span class="text-[#2D2926]/60">Días laborables</span><span class="font-medium">{{ c.diasLaborables }}</span></div>
              <div class="flex justify-between"><span class="text-[#2D2926]/60">Horas reales</span><span class="font-medium">{{ c.horasReales }} h</span></div>
              <div class="flex justify-between"><span class="text-[#2D2926]/60">Tardanzas</span><span class="font-medium">{{ c.tardanzas }}</span></div>
              <div class="flex justify-between"><span class="text-[#2D2926]/60">Descuento faltas</span><span class="font-medium">{{ fmt(c.descuentoFaltas) }}</span></div>
              <div class="flex justify-between"><span class="text-[#2D2926]/60">Descuento tardanzas</span><span class="font-medium">{{ fmt(c.descuentoTardanzas) }}</span></div>
              <div class="flex justify-between"><span class="text-[#2D2926]/60">Total bonos</span><span class="font-medium">{{ fmt(c.totalBonos) }}</span></div>
              <div class="flex justify-between border-t border-[#EEE3D1] pt-1.5 mt-1.5">
                <span class="text-[#2D2926]/70 font-semibold">Neto estimado (incluye bonos)</span>
                <span class="font-bold text-[#2D2926]">{{ fmt(c.montoNeto) }}</span>
              </div>
              <p class="text-[11px] text-[#2D2926]/45 pt-1">
                Este neto incluye bonos y es solo referencial. Al guardar, el pago se crea con
                bonos en 0 (se enlazan al liquidar), así que el neto oficial puede diferir.
                Solo se precargan sueldo base y descuentos.
              </p>
            </div>
          }
        }

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
  private readonly store = inject(AuthStore);

  readonly open = input.required<boolean>();
  readonly cerrar = output<void>();
  readonly guardado = output<PagoNominaResponse>();

  readonly usuarioId = signal<number | null>(null);
  readonly periodo = signal('');
  readonly fechaEmision = signal('');
  readonly sueldoBase = signal<number | null>(null);
  readonly totalDescuentos = signal<number | null>(null);
  readonly guardando = signal(false);

  readonly calculando = signal(false);
  readonly calculo = signal<CalculoNominaResponse | null>(null);
  // El endpoint POST /pagos-nomina/calcular exige nomina:create (no :read).
  readonly puedeCalcular = computed(() => this.store.hasPermission('nomina:create'));

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
        this.calculo.set(null);
      }
    });
  }

  onEmpleado(u: UsuarioResumen | null): void {
    this.usuarioId.set(u?.usuarioId ?? null);
    this.calculo.set(null); // el desglose deja de ser válido para otro empleado
  }

  /** Preview asistido: precarga sueldoBase y totalDescuentos. No guarda nada. */
  calcular(): void {
    const uid = this.usuarioId();
    const periodo = this.periodo();
    if (uid == null || !periodo || this.calculando()) return;

    this.calculando.set(true);
    this.svc.calcular({ usuarioId: uid, periodo }).subscribe({
      next: (c) => {
        this.calculando.set(false);
        this.calculo.set(c);
        this.sueldoBase.set(c.sueldoBase);
        this.totalDescuentos.set(c.totalDescuentos);
        this.toastr.success('Cálculo cargado desde asistencia.');
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.calculando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo calcular.', 'Error');
      },
    });
  }

  fmt(v: number): string { return formatMonto(v); }

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
