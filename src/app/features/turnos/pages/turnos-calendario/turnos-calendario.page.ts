import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthStore } from '../../../../core/auth/auth.store';
import { TurnoService } from '../../services/turno.service';
import { TurnoResponse } from '../../models/turno.model';
import { ESTADO_TURNO_CELDA, ESTADO_TURNO_LABEL } from '../../utils/turno-ui';
import { TurnoEditModalComponent } from '../../components/turno-edit-modal.component';

interface FilaEmpleado {
  usuarioId: number;
  nombre: string;
  porDia: TurnoResponse[][]; // alineado con dias()
}

const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

@Component({
  selector: 'app-turnos-calendario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TurnoEditModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Cabecera -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-[#2D2926]">Planificación de turnos</h1>
          <p class="text-sm text-[#2D2926]/55 mt-0.5">Vista semanal por empleado.</p>
        </div>
        @if (puedeGenerar()) {
          <button type="button" (click)="generarSemana()" [disabled]="generando() || cargando()"
            class="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#C5A048] text-white
                   text-sm font-medium hover:bg-[#8E6F2E] transition-colors disabled:opacity-40">
            {{ generando() ? 'Generando…' : 'Generar semana' }}
          </button>
        }
      </div>

      <!-- Navegación de semana -->
      <div class="flex items-center gap-2">
        <button type="button" (click)="semanaAnterior()"
          class="h-9 w-9 grid place-items-center rounded-lg border border-[#EEE3D1]
                 text-[#2D2926]/70 hover:border-[#C5A048] transition-colors">‹</button>
        <button type="button" (click)="hoy()"
          class="h-9 px-3 rounded-lg border border-[#EEE3D1] text-sm font-medium
                 text-[#2D2926]/70 hover:border-[#C5A048] transition-colors">Hoy</button>
        <button type="button" (click)="semanaSiguiente()"
          class="h-9 w-9 grid place-items-center rounded-lg border border-[#EEE3D1]
                 text-[#2D2926]/70 hover:border-[#C5A048] transition-colors">›</button>
        <span class="ml-2 text-sm font-medium text-[#2D2926]/70">
          {{ dias()[0] }} → {{ dias()[6] }}
        </span>
      </div>

      <!-- Calendario -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden">
        @if (cargando()) {
          <div class="p-5 space-y-3">
            @for (_ of [1,2,3,4]; track $index) {
              <div class="h-12 bg-[#EEE3D1] rounded-lg animate-pulse"></div>
            }
          </div>
        } @else if (filas().length === 0) {
          <div class="py-12 text-center">
            <p class="text-sm text-[#2D2926]/45">No hay turnos en esta semana.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[860px] text-sm border-collapse">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-[11px] uppercase tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold text-left sticky left-0 bg-white">Empleado</th>
                  @for (d of diasCortos; track $index) {
                    <th class="px-2 py-3 font-semibold text-center whitespace-nowrap">
                      {{ d }}<br /><span class="text-[10px] normal-case text-[#2D2926]/40">{{ dias()[$index].slice(5) }}</span>
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (fila of filas(); track fila.usuarioId) {
                  <tr class="border-b border-[#EEE3D1] last:border-0">
                    <td class="px-4 py-3 font-medium text-[#2D2926] sticky left-0 bg-white whitespace-nowrap">
                      {{ fila.nombre }}
                    </td>
                    @for (celda of fila.porDia; track $index) {
                      <td class="px-1.5 py-2 align-top">
                        <div class="flex flex-col gap-1">
                          @for (t of celda; track t.turnoId) {
                            <button type="button" (click)="abrirTurno(t)"
                              class="w-full text-left px-2 py-1 rounded-md border text-[11px] leading-tight
                                     hover:opacity-80 transition-opacity"
                              [class]="celdaClase(t)">
                              <span class="block font-semibold">{{ t.horarioNombreTurno }}</span>
                              <span class="block">{{ t.horaInicio.slice(0,5) }}–{{ t.horaFin.slice(0,5) }}</span>
                            </button>
                          }
                        </div>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Leyenda -->
      <div class="flex flex-wrap gap-2 text-[11px]">
        @for (e of leyenda; track e.value) {
          <span class="px-2 py-0.5 rounded-md border" [class]="e.clase">{{ e.label }}</span>
        }
      </div>
    </div>

    <app-turno-edit-modal
      [open]="modalAbierto()"
      [turno]="turnoSel()"
      [puedeEditar]="puedeEditar()"
      [puedeCancelar]="puedeCancelar()"
      (cerrar)="cerrarModal()"
      (guardado)="onGuardado()" />
  `,
})
export class TurnosCalendarioPage {
  private readonly svc = inject(TurnoService);
  private readonly toastr = inject(ToastrService);
  private readonly store = inject(AuthStore);

  readonly diasCortos = DIAS_CORTOS;
  readonly leyenda = (
    ['PLANIFICADO', 'CONFIRMADO', 'CUBIERTO', 'AUSENTE', 'CANCELADO'] as const
  ).map((v) => ({ value: v, label: ESTADO_TURNO_LABEL[v], clase: ESTADO_TURNO_CELDA[v] }));

  readonly puedeGenerar = computed(() => this.store.hasPermission('turnos:generar'));
  readonly puedeEditar = computed(() => this.store.hasPermission('turnos:update'));
  readonly puedeCancelar = computed(() => this.store.hasPermission('turnos:delete'));

  private readonly refLunes = signal(lunesDe(new Date()));
  readonly turnos = signal<TurnoResponse[]>([]);
  readonly cargando = signal(false);
  readonly generando = signal(false);

  readonly modalAbierto = signal(false);
  readonly turnoSel = signal<TurnoResponse | null>(null);

  /** Las 7 fechas de la semana en curso, "YYYY-MM-DD". */
  readonly dias = computed(() => {
    const base = this.refLunes();
    return Array.from({ length: 7 }, (_, i) => fmtFecha(sumarDias(base, i)));
  });

  /** Filas: un empleado por fila, con sus turnos agrupados por día. */
  readonly filas = computed<FilaEmpleado[]>(() => {
    const dias = this.dias();
    const mapa = new Map<number, FilaEmpleado>();
    for (const t of this.turnos()) {
      let fila = mapa.get(t.usuarioId);
      if (!fila) {
        fila = {
          usuarioId: t.usuarioId,
          nombre: t.usuarioNombreCompleto,
          porDia: dias.map(() => []),
        };
        mapa.set(t.usuarioId, fila);
      }
      const idx = dias.indexOf(t.fecha);
      if (idx >= 0) fila.porDia[idx].push(t);
    }
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    const dias = this.dias();
    this.cargando.set(true);
    this.svc.listar(dias[0], dias[6]).subscribe({
      next: (lista) => { this.turnos.set(lista); this.cargando.set(false); },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.cargando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudieron cargar los turnos.', 'Error');
      },
    });
  }

  semanaAnterior(): void { this.refLunes.set(sumarDias(this.refLunes(), -7)); this.cargar(); }
  semanaSiguiente(): void { this.refLunes.set(sumarDias(this.refLunes(), 7)); this.cargar(); }
  hoy(): void { this.refLunes.set(lunesDe(new Date())); this.cargar(); }

  generarSemana(): void {
    if (this.generando()) return;
    const dias = this.dias();
    this.generando.set(true);
    this.svc.generar({ desde: dias[0], hasta: dias[6] }).subscribe({
      next: (r) => {
        this.generando.set(false);
        this.toastr.success(`${r.generados} turnos creados · ${r.omitidos} omitidos.`);
        this.cargar();
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.generando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudieron generar los turnos.', 'Error');
      },
    });
  }

  abrirTurno(t: TurnoResponse): void {
    this.turnoSel.set(t);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.turnoSel.set(null);
  }

  onGuardado(): void {
    this.cerrarModal();
    this.cargar();
  }

  celdaClase(t: TurnoResponse): string { return ESTADO_TURNO_CELDA[t.estado]; }
}

// ── Helpers de fecha (locales, sin desfase de zona horaria) ─────────────────────

function lunesDe(d: Date): Date {
  const x = new Date(d);
  const offset = (x.getDay() + 6) % 7; // 0 = lunes
  x.setDate(x.getDate() - offset);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sumarDias(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function fmtFecha(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
