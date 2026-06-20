import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { HabitacionService } from '../../services/habitacion.service';
import { RoomTypesService } from '../../../rooms/services/room-types.service';
import {
  EstadoHabitacion,
  Habitacion,
  ESTADO_HABITACION_CONFIG,
} from '../../models/habitacion.model';

type FiltroEstado = EstadoHabitacion | '';

@Component({
  selector: 'app-habitaciones-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="space-y-6">

      <!-- Cabecera -->
      <header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-[11px] uppercase tracking-[0.3em] text-[#C5A048] font-semibold mb-1">
            Recepción
          </p>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-[#2D2926]">
            Habitaciones
          </h1>
          <p class="text-[15px] text-[#2D2926]/55 mt-1">
            Gestiona el inventario de habitaciones físicas del hotel.
          </p>
        </div>
        <button
          type="button"
          (click)="abrirCrear()"
          class="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#C5A048] text-white
                 text-sm font-semibold hover:bg-[#8E6F2E] transition-colors shrink-0">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" aria-hidden="true">
            <path stroke-linecap="round" d="M12 5v14M5 12h14"/>
          </svg>
          Nueva habitación
        </button>
      </header>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
          <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Disponibles</p>
          <p class="mt-1.5 text-2xl font-bold text-emerald-600">{{ conteo().disponible }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
          <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Ocupadas</p>
          <p class="mt-1.5 text-2xl font-bold text-red-600">{{ conteo().ocupada }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
          <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Limpieza</p>
          <p class="mt-1.5 text-2xl font-bold text-amber-600">{{ conteo().limpieza }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
          <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Mantenimiento</p>
          <p class="mt-1.5 text-2xl font-bold text-[#2D2926]/50">{{ conteo().mantenimiento }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
          <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Bloqueadas</p>
          <p class="mt-1.5 text-2xl font-bold text-[#2D2926]">{{ conteo().bloqueada }}</p>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <div class="grid grid-cols-1 sm:grid-cols-[1fr_180px_140px] gap-3">
          <label class="flex flex-col gap-1">
            <span class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">
              Buscar
            </span>
            <span class="relative">
              <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#2D2926]/40"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="7"/>
                <path stroke-linecap="round" d="m21 21-3.5-3.5"/>
              </svg>
              <input
                type="search"
                [value]="busqueda()"
                (input)="busqueda.set($any($event.target).value)"
                placeholder="Número o tipo..."
                class="w-full h-11 pl-9 pr-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                       focus:outline-none focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20 transition" />
            </span>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">
              Estado
            </span>
            <select
              [value]="filtroEstado()"
              (change)="filtroEstado.set($any($event.target).value)"
              class="h-11 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     focus:outline-none focus:border-[#C5A048] transition">
              <option value="">Todos</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="OCUPADA">Ocupada</option>
              <option value="LIMPIEZA">En limpieza</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="BLOQUEADA">Bloqueada</option>
            </select>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">
              Piso
            </span>
            <select
              [value]="filtroPiso()"
              (change)="filtroPiso.set($any($event.target).value === '' ? null : +$any($event.target).value)"
              class="h-11 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     focus:outline-none focus:border-[#C5A048] transition">
              <option value="">Todos</option>
              @for (p of pisos(); track p) {
                <option [value]="p">Piso {{ p }}</option>
              }
            </select>
          </label>
        </div>
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden">

        @if (svc.loading()) {
          <div class="p-5 space-y-3">
            @for (_ of [1,2,3,4,5,6]; track $index) {
              <div class="h-12 bg-[#EEE3D1] rounded-lg animate-pulse"></div>
            }
          </div>
        } @else if (visible().length === 0) {
          <div class="py-16 text-center">
            <p class="text-sm font-semibold text-[#2D2926]">Sin habitaciones</p>
            <p class="text-xs text-[#2D2926]/45 mt-1">
              No hay habitaciones con los filtros aplicados.
            </p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[700px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold">Número</th>
                  <th class="px-4 py-3 font-semibold">Piso</th>
                  <th class="px-4 py-3 font-semibold">Tipo</th>
                  <th class="px-4 py-3 font-semibold">Precio/noche</th>
                  <th class="px-4 py-3 font-semibold">Estado</th>
                  <th class="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (h of visible(); track h.habitacionId) {
                  <tr class="border-b border-[#EEE3D1] last:border-0 hover:bg-[#F9F5F0] transition-colors">
                    <td class="px-4 py-3 font-bold text-[#2D2926]">{{ h.numero }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70">{{ h.piso }}</td>
                    <td class="px-4 py-3 text-[#2D2926]">
                      {{ h.tipoHabitacionNombre ?? '—' }}
                    </td>
                    <td class="px-4 py-3 text-[#2D2926]">
                      @if (h.precioBase !== null) {
                        S/. {{ h.precioBase | number:'1.2-2' }}
                      } @else {
                        <span class="text-[#2D2926]/40">—</span>
                      }
                    </td>
                    <td class="px-4 py-3">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                   text-[11px] font-semibold"
                            [class]="badgeCls(h.estado)">
                        <span class="w-1.5 h-1.5 rounded-full" [class]="dotCls(h.estado)"></span>
                        {{ estadoLabel(h.estado) }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          (click)="abrirEditar(h)"
                          class="h-7 px-2.5 rounded-lg border border-[#EEE3D1] text-[#2D2926]/70
                                 text-xs font-medium hover:border-[#C5A048] hover:text-[#C5A048]
                                 transition-colors">
                          Editar
                        </button>
                        <button
                          type="button"
                          (click)="eliminar(h)"
                          class="h-7 px-2.5 rounded-lg border border-red-100 text-red-500
                                 text-xs font-medium hover:bg-red-50 transition-colors">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

    </div>

    <!-- Modal crear / editar -->
    @if (modalAbierto()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in"
        role="dialog"
        aria-modal="true"
        (click)="cerrarModal()">

        <div
          class="w-full max-w-lg bg-white rounded-2xl shadow-2xl"
          (click)="$event.stopPropagation()">

          <!-- Header modal -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-[#EEE3D1]">
            <div>
              <h2 class="text-base font-bold text-[#2D2926]">
                {{ editando() ? 'Editar habitación' : 'Nueva habitación' }}
              </h2>
              <p class="text-xs text-[#2D2926]/50 mt-0.5">
                {{ editando() ? 'Modifica los datos de la habitación.' : 'Registra una nueva habitación física.' }}
              </p>
            </div>
            <button
              type="button"
              (click)="cerrarModal()"
              class="w-8 h-8 rounded-lg flex items-center justify-center
                     text-[#2D2926]/40 hover:text-[#2D2926] hover:bg-[#F9F5F0] transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2.5">
                <path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Body modal -->
          <form [formGroup]="form" (ngSubmit)="guardar()" novalidate class="px-6 py-5 space-y-4">

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="text-[13px] font-medium text-[#2D2926]/70">
                  Número <span class="text-red-500">*</span>
                </label>
                <input
                  formControlName="numero"
                  placeholder="101"
                  maxlength="10"
                  [class]="inputCls('numero')" />
                @if (errMsg('numero'); as msg) {
                  <p class="text-xs text-red-500 mt-1" role="alert">{{ msg }}</p>
                }
              </div>

              <div>
                <label class="text-[13px] font-medium text-[#2D2926]/70">
                  Piso <span class="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  formControlName="piso"
                  placeholder="1"
                  min="1"
                  max="30"
                  [class]="inputCls('piso')" />
                @if (errMsg('piso'); as msg) {
                  <p class="text-xs text-red-500 mt-1" role="alert">{{ msg }}</p>
                }
              </div>
            </div>

            <div>
              <label class="text-[13px] font-medium text-[#2D2926]/70">
                Tipo de habitación
              </label>
              <select formControlName="tipoHabitacionId" [class]="inputCls('tipoHabitacionId')">
                <option [ngValue]="null">Sin tipo asignado</option>
                @for (t of tipos(); track t.tipoHabitacionId) {
                  <option [value]="t.tipoHabitacionId">
                    {{ t.nombre }} — S/. {{ t.precioBase | number:'1.2-2' }}
                  </option>
                }
              </select>
            </div>

            @if (editando()) {
              <div>
                <label class="text-[13px] font-medium text-[#2D2926]/70">
                  Estado <span class="text-red-500">*</span>
                </label>
                <select formControlName="estado" [class]="inputCls('estado')">
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="OCUPADA">Ocupada</option>
                  <option value="LIMPIEZA">En limpieza</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="BLOQUEADA">Bloqueada</option>
                </select>
              </div>
            }

            <div>
              <label class="text-[13px] font-medium text-[#2D2926]/70">Descripción</label>
              <textarea
                formControlName="descripcion"
                rows="2"
                maxlength="500"
                placeholder="Vista, características especiales..."
                class="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-[#EEE3D1] bg-white
                       text-sm focus:outline-none focus:border-[#C5A048] focus:ring-2
                       focus:ring-[#C5A048]/20 transition resize-none"></textarea>
            </div>

          </form>

          <!-- Footer modal -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#EEE3D1]">
            <button
              type="button"
              (click)="cerrarModal()"
              [disabled]="guardando()"
              class="h-9 px-4 rounded-xl border border-[#EEE3D1] text-sm font-medium
                     text-[#2D2926]/70 hover:bg-[#F9F5F0] transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button
              type="button"
              (click)="guardar()"
              [disabled]="form.invalid || guardando()"
              class="h-9 px-5 rounded-xl bg-[#C5A048] text-white text-sm font-semibold
                     hover:bg-[#8E6F2E] transition-colors disabled:opacity-50">
              @if (guardando()) { Guardando... } @else {
                {{ editando() ? 'Guardar cambios' : 'Crear habitación' }}
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class HabitacionesListPage implements OnInit {
  protected readonly svc = inject(HabitacionService);
  private readonly roomTypesSvc = inject(RoomTypesService);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);

  readonly busqueda = signal('');
  readonly filtroEstado = signal<FiltroEstado>('');
  readonly filtroPiso = signal<number | null>(null);
  readonly modalAbierto = signal(false);
  readonly editando = signal<Habitacion | null>(null);
  readonly guardando = signal(false);

  readonly tipos = this.roomTypesSvc.items;
  readonly conteo = this.svc.conteoEstados;

  readonly pisos = computed(() => {
    const set = new Set(this.svc.habitaciones().map((h) => h.piso));
    return [...set].sort((a, b) => a - b);
  });

  readonly visible = computed(() => {
    const q = this.busqueda().toLowerCase();
    const estado = this.filtroEstado();
    const piso = this.filtroPiso();
    return this.svc.habitaciones().filter((h) => {
      if (estado && h.estado !== estado) return false;
      if (piso !== null && h.piso !== piso) return false;
      if (q) {
        const match =
          h.numero.toLowerCase().includes(q) ||
          (h.tipoHabitacionNombre?.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }
      return true;
    });
  });

  readonly form = this.fb.nonNullable.group({
    numero: ['', [Validators.required, Validators.maxLength(10)]],
    piso: [1, [Validators.required, Validators.min(1), Validators.max(30)]],
    tipoHabitacionId: [null as number | null],
    estado: ['DISPONIBLE' as EstadoHabitacion, [Validators.required]],
    descripcion: ['', [Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    this.svc.load();
    this.roomTypesSvc.load({ size: 100, sort: 'nombre,asc' });
  }

  abrirCrear(): void {
    this.editando.set(null);
    this.form.reset({
      numero: '',
      piso: 1,
      tipoHabitacionId: null,
      estado: 'DISPONIBLE',
      descripcion: '',
    });
    this.modalAbierto.set(true);
  }

  abrirEditar(h: Habitacion): void {
    this.editando.set(h);
    this.form.reset({
      numero: h.numero,
      piso: h.piso,
      tipoHabitacionId: h.tipoHabitacionId,
      estado: h.estado,
      descripcion: h.descripcion ?? '',
    });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    if (this.guardando()) return;
    this.modalAbierto.set(false);
    this.editando.set(null);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const edit = this.editando();
    this.guardando.set(true);

    const op$ = edit
      ? this.svc.update(edit.habitacionId, {
          numero: v.numero.trim().toUpperCase(),
          piso: v.piso,
          tipoHabitacionId: v.tipoHabitacionId,
          estado: v.estado,
          descripcion: v.descripcion || undefined,
        })
      : this.svc.create({
          numero: v.numero.trim().toUpperCase(),
          piso: v.piso,
          tipoHabitacionId: v.tipoHabitacionId,
          estado: 'DISPONIBLE',
          descripcion: v.descripcion || undefined,
        });

    op$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.toastr.success(edit ? 'Habitación actualizada.' : 'Habitación creada.');
        this.cerrarModal();
      },
      error: (err: { friendlyMessage?: string }) => {
        this.guardando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo guardar.', 'Error');
      },
    });
  }

  async eliminar(h: Habitacion): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Eliminar habitación',
      message: `¿Eliminar la habitación ${h.numero}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;

    this.svc.delete(h.habitacionId).subscribe({
      next: () => this.toastr.success(`Habitación ${h.numero} eliminada.`),
      error: (err: { friendlyMessage?: string }) =>
        this.toastr.error(err.friendlyMessage ?? 'No se pudo eliminar.', 'Error'),
    });
  }

  badgeCls(estado: EstadoHabitacion): string {
    const cfg = ESTADO_HABITACION_CONFIG[estado];
    return `${cfg.bgColor} ${cfg.textColor} border ${cfg.borderColor}`;
  }

  dotCls(estado: EstadoHabitacion): string {
    return ESTADO_HABITACION_CONFIG[estado].dotColor;
  }

  estadoLabel(estado: EstadoHabitacion): string {
    return ESTADO_HABITACION_CONFIG[estado].label;
  }

  inputCls(field: string): string {
    const ctrl = this.form.get(field);
    const invalid = ctrl ? ctrl.invalid && (ctrl.touched || ctrl.dirty) : false;
    const base = 'mt-1.5 w-full h-10 px-3.5 rounded-lg border bg-white text-sm focus:outline-none transition';
    return invalid
      ? `${base} border-red-400 focus:ring-2 focus:ring-red-400/20`
      : `${base} border-[#EEE3D1] focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20`;
  }

  errMsg(field: string): string | null {
    const c = this.form.get(field);
    if (!c || !c.invalid || (!c.touched && !c.dirty)) return null;
    if (c.hasError('required')) return 'Obligatorio.';
    if (c.hasError('min')) return 'Valor demasiado bajo.';
    if (c.hasError('max')) return 'Valor demasiado alto.';
    if (c.hasError('maxlength')) return 'Texto demasiado largo.';
    return 'Inválido.';
  }
}
