import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { toSignal } from '@angular/core/rxjs-interop';
import { SolicitudService } from '../../services/solicitud.service';
import {
  CreateSolicitudRequest,
  ModuloReferido,
  PrioridadSolicitud,
  TipoAcceso,
  TipoSolicitud,
} from '../../models/solicitud.model';
import { MODULO_LABEL, PRIORIDAD_LABEL, TIPO_LABEL } from '../../utils/solicitud-ui';

@Component({
  selector: 'app-nueva-solicitud',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-5 max-w-2xl">

      <button
        type="button"
        (click)="volver()"
        class="inline-flex items-center gap-1.5 text-sm text-[#2D2926]/60
               hover:text-[#C5A048] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Volver
      </button>

      <div>
        <h1 class="text-2xl font-bold text-[#2D2926]">Nueva solicitud</h1>
        <p class="text-sm text-[#2D2926]/55 mt-0.5">
          El código y la fecha se generan automáticamente al guardar.
        </p>
      </div>

      <form [formGroup]="form" (ngSubmit)="enviar()" class="space-y-5">

        <!-- Tipo de solicitud -->
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-5">
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
            Tipo de solicitud <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-2">
            @for (t of tipos; track t) {
              <button
                type="button"
                (click)="setTipo(t)"
                class="flex-1 h-10 rounded-lg text-sm font-medium transition-colors border"
                [class]="tipoSel() === t
                  ? 'bg-[#C5A048] text-white border-[#C5A048]'
                  : 'bg-white text-[#2D2926]/65 border-[#EEE3D1] hover:bg-[#F9F5F0]'">
                {{ tipoLabel(t) }}
              </button>
            }
          </div>
        </div>

        <!-- Bloque Información (siempre visible) -->
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-5 space-y-4">
          <h2 class="text-sm font-bold text-[#C5A048] uppercase tracking-widest">
            Información
          </h2>

          <!-- Asunto -->
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
              Asunto <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="asunto"
              maxlength="150"
              placeholder="Resumen breve de la solicitud"
              class="w-full h-10 px-3 rounded-lg border bg-white text-sm text-[#2D2926]
                     placeholder:text-[#2D2926]/35 focus:outline-none"
              [class]="claseCampo('asunto')" />
            @if (errorVisible('asunto')) {
              <p class="text-xs text-red-500 mt-1">Obligatorio (máx. 150 caracteres).</p>
            }
          </div>

          <!-- Descripción / Justificación -->
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
              {{ esAcceso() ? 'Justificación' : 'Descripción' }} <span class="text-red-500">*</span>
            </label>
            <textarea
              formControlName="descripcion"
              rows="4"
              maxlength="4000"
              [placeholder]="esAcceso()
                ? 'Justifica por qué necesitas este acceso'
                : 'Detalla tu solicitud'"
              class="w-full px-3 py-2 rounded-lg border bg-white text-sm text-[#2D2926]
                     placeholder:text-[#2D2926]/35 resize-none focus:outline-none"
              [class]="claseCampo('descripcion')"></textarea>
            @if (errorVisible('descripcion')) {
              <p class="text-xs text-red-500 mt-1">Obligatorio (máx. 4000 caracteres).</p>
            }
          </div>

          <div class="grid grid-cols-2 gap-3">
            <!-- Prioridad -->
            <div>
              <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Prioridad</label>
              <select
                formControlName="prioridad"
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
                formControlName="moduloReferido"
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

        <!-- Bloque Acceso (solo si tipo = ACCESO) -->
        @if (esAcceso()) {
          <div class="bg-white rounded-2xl border border-[#EEE3D1] p-5 space-y-4">
            <h2 class="text-sm font-bold text-[#C5A048] uppercase tracking-widest">
              Acceso
            </h2>

            <!-- Tipo de acceso -->
            <div>
              <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
                Tipo de acceso <span class="text-red-500">*</span>
              </label>
              <select
                formControlName="tipoAcceso"
                class="w-full h-10 px-3 rounded-lg border bg-white text-sm text-[#2D2926]
                       focus:outline-none"
                [class]="claseCampo('tipoAcceso')">
                <option value="">— Selecciona —</option>
                @for (ta of tiposAcceso; track ta) {
                  <option [value]="ta">{{ tipoAccesoLabel(ta) }}</option>
                }
              </select>
              @if (errorVisible('tipoAcceso')) {
                <p class="text-xs text-red-500 mt-1">Selecciona el tipo de acceso.</p>
              }
            </div>

            <!-- Rol solicitado (requerido condicional) -->
            <div>
              <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
                Rol solicitado
                @if (rolRequerido()) { <span class="text-red-500">*</span> }
              </label>
              <input
                type="text"
                formControlName="rolSolicitado"
                maxlength="20"
                placeholder="Ej. ADMIN, RECEPCION…"
                class="w-full h-10 px-3 rounded-lg border bg-white text-sm text-[#2D2926]
                       placeholder:text-[#2D2926]/35 focus:outline-none"
                [class]="claseCampo('rolSolicitado')" />
              @if (errorVisible('rolSolicitado')) {
                <p class="text-xs text-red-500 mt-1">
                  Requerido para cambio de rol o acceso a módulo (máx. 20 caracteres).
                </p>
              }
            </div>

            <!-- Periodo -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
                  Periodo — inicio
                </label>
                <input
                  type="date"
                  formControlName="periodoInicio"
                  class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                         text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
                  Periodo — fin
                </label>
                <input
                  type="date"
                  formControlName="periodoFin"
                  class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                         text-[#2D2926] focus:outline-none focus:border-[#C5A048]" />
              </div>
            </div>
          </div>
        }

        <!-- Acciones -->
        <div class="flex justify-end gap-2">
          <button
            type="button"
            (click)="volver()"
            class="h-10 px-5 rounded-lg text-sm font-medium text-[#2D2926]/70
                   hover:bg-[#F9F5F0] transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            [disabled]="form.invalid || enviando()"
            class="h-10 px-5 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                   hover:bg-[#8E6F2E] transition-colors disabled:opacity-40
                   disabled:cursor-not-allowed">
            {{ enviando() ? 'Enviando…' : 'Enviar solicitud' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class NuevaSolicitudPage {
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(SolicitudService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toastr = inject(ToastrService);

  readonly enviando = signal(false);

  readonly tipos: TipoSolicitud[] = ['INFORMACION', 'ACCESO'];
  readonly prioridades: PrioridadSolicitud[] = ['ALTA', 'MEDIA', 'BAJA'];
  readonly modulos: ModuloReferido[] = [
    'RESERVAS', 'HABITACIONES', 'PAGOS', 'EMPLEADOS', 'REPORTES', 'INVENTARIO', 'OTRO',
  ];
  readonly tiposAcceso: TipoAcceso[] = [
    'ACCESO_MODULO', 'CAMBIO_ROL', 'ACTIVACION', 'RECUPERACION',
  ];

  readonly form = this.fb.nonNullable.group({
    tipoSolicitud: ['INFORMACION' as TipoSolicitud, Validators.required],
    asunto: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', [Validators.required, Validators.maxLength(4000)]],
    prioridad: ['MEDIA' as PrioridadSolicitud],
    moduloReferido: ['' as ModuloReferido | ''],
    tipoAcceso: ['' as TipoAcceso | ''],
    rolSolicitado: ['', Validators.maxLength(20)],
    periodoInicio: [''],
    periodoFin: [''],
  });

  // Señal reactiva del valor del form para los @if del template
  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly tipoSel = computed<TipoSolicitud>(
    () => (this.value().tipoSolicitud as TipoSolicitud) ?? 'INFORMACION',
  );
  readonly esAcceso = computed(() => this.tipoSel() === 'ACCESO');
  readonly rolRequerido = computed(() => {
    const ta = this.value().tipoAcceso;
    return ta === 'CAMBIO_ROL' || ta === 'ACCESO_MODULO';
  });

  setTipo(t: TipoSolicitud): void {
    this.form.controls.tipoSolicitud.setValue(t);
    this.aplicarValidacionesAcceso();
  }

  private aplicarValidacionesAcceso(): void {
    const esAcceso = this.form.controls.tipoSolicitud.value === 'ACCESO';
    const tipoAcceso = this.form.controls.tipoAcceso;
    const rol = this.form.controls.rolSolicitado;

    // tipoAcceso obligatorio en UI cuando es ACCESO
    tipoAcceso.setValidators(esAcceso ? [Validators.required] : []);

    // rolSolicitado obligatorio solo si tipoAcceso ∈ {CAMBIO_ROL, ACCESO_MODULO}
    const ta = tipoAcceso.value;
    const rolReq = esAcceso && (ta === 'CAMBIO_ROL' || ta === 'ACCESO_MODULO');
    rol.setValidators(
      rolReq ? [Validators.required, Validators.maxLength(20)] : [Validators.maxLength(20)],
    );

    tipoAcceso.updateValueAndValidity({ emitEvent: false });
    rol.updateValueAndValidity({ emitEvent: false });
  }

  constructor() {
    // Reaccionar a cambios de tipoAcceso para recalcular si rolSolicitado es requerido
    this.form.controls.tipoAcceso.valueChanges.subscribe(() =>
      this.aplicarValidacionesAcceso(),
    );
  }

  claseCampo(campo: string): string {
    const base = 'border-[#EEE3D1] focus:border-[#C5A048]';
    return this.errorVisible(campo) ? 'border-red-400 focus:border-red-400' : base;
  }

  errorVisible(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  enviar(): void {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const payload: CreateSolicitudRequest = {
      tipoSolicitud: v.tipoSolicitud,
      asunto: v.asunto.trim(),
      descripcion: v.descripcion.trim(),
      prioridad: v.prioridad,
      moduloReferido: v.moduloReferido || undefined,
    };

    if (v.tipoSolicitud === 'ACCESO') {
      payload.tipoAcceso = (v.tipoAcceso || undefined) as TipoAcceso | undefined;
      payload.rolSolicitado = v.rolSolicitado.trim() || undefined;
      payload.periodoInicio = v.periodoInicio || undefined;
      payload.periodoFin = v.periodoFin || undefined;
    }

    this.enviando.set(true);
    this.svc.crear(payload).subscribe({
      next: (creada) => {
        this.enviando.set(false);
        this.toastr.success(`Solicitud ${creada.codigoSolicitud} registrada.`);
        this.router.navigate(['/solicitudes', creada.solicitudId]);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.enviando.set(false);
        this.toastr.error(
          err.friendlyMessage ?? 'No se pudo registrar la solicitud.',
          'Error',
        );
      },
    });
  }

  volver(): void {
    this.location.back();
  }

  tipoLabel(t: TipoSolicitud): string { return TIPO_LABEL[t]; }
  prioridadLabel(p: PrioridadSolicitud): string { return PRIORIDAD_LABEL[p]; }
  moduloLabel(m: ModuloReferido): string { return MODULO_LABEL[m]; }
  tipoAccesoLabel(ta: TipoAcceso): string {
    const map: Record<TipoAcceso, string> = {
      ACCESO_MODULO: 'Acceso a módulo',
      CAMBIO_ROL: 'Cambio de rol',
      ACTIVACION: 'Activación de cuenta',
      RECUPERACION: 'Recuperación de acceso',
    };
    return map[ta];
  }
}
