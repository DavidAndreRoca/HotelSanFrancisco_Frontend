import { Component, input, output, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, of, distinctUntilChanged } from 'rxjs';
import { ReservationService } from '../../services/reservation.service';
import { EstadoReserva, EstadoReservaHabitacion, HistorialReserva, Reserva } from '../../models/reservation.model';

const ESTADO_CFG: Record<EstadoReserva, { label: string; badge: string; dot: string }> = {
  PENDIENTE:  { label: 'Pendiente',  badge: 'bg-amber-50 text-amber-700 border-amber-200',     dot: 'bg-amber-500'   },
  CONFIRMADA: { label: 'Confirmada', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  CHECK_IN:   { label: 'Check-in',   badge: 'bg-[#FFF8E1] text-[#8E6F2E] border-[#FDE68A]',   dot: 'bg-[#C5A048]'   },
  CHECK_OUT:  { label: 'Check-out',  badge: 'bg-slate-50 text-slate-600 border-slate-200',      dot: 'bg-slate-400'   },
  CANCELADA:  { label: 'Cancelada',  badge: 'bg-red-50 text-red-700 border-red-200',            dot: 'bg-red-500'     },
  NO_SHOW:    { label: 'No show',    badge: 'bg-purple-50 text-purple-700 border-purple-200',   dot: 'bg-purple-500'  },
};

const HAB_ESTADO: Record<EstadoReservaHabitacion, string> = {
  ACTIVA:    'bg-emerald-50 text-emerald-700',
  CANCELADA: 'bg-red-50 text-red-700',
  CHECK_OUT: 'bg-slate-50 text-slate-500',
};

@Component({
  selector: 'app-reservation-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, DatePipe],
  host: {
    '(document:keydown.escape)': 'isOpen() && onClose.emit()',
    role: 'dialog',
    'aria-modal': 'true',
  },
  template: `
    @if (isOpen() && loading() && !reserva()) {
      <div class="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-[#2D2926]/75"
           (click)="onClose.emit()">
        <div class="bg-[#F9F5F0] rounded-2xl shadow-2xl px-10 py-12 flex flex-col items-center gap-3"
             (click)="$event.stopPropagation()">
          <div class="w-8 h-8 border-2 border-[#C5A048] border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm text-[#2D2926]/60">Cargando detalle…</p>
        </div>
      </div>
    }
    @if (isOpen() && reserva()) {
      <div class="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-[#2D2926]/75"
           (click)="onClose.emit()">
        <div class="w-full max-w-3xl bg-[#F9F5F0] rounded-2xl shadow-2xl flex flex-col
                    max-h-[92vh] overflow-y-auto relative"
             (click)="$event.stopPropagation()">

          <!-- Cerrar -->
          <button type="button" (click)="onClose.emit()" aria-label="Cerrar"
            class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#EEE3D1]
                   flex items-center justify-center text-[#2D2926]/40
                   hover:bg-[#C5A048] hover:border-[#C5A048] hover:text-white transition-colors z-10">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>

          <!-- Header -->
          <div class="flex items-center justify-between flex-wrap gap-3 px-6 py-5
                      bg-white border-b-2 border-[#C5A048] rounded-t-2xl">
            <div class="flex items-center gap-3">
              <span class="font-mono text-base font-bold text-[#2D2926]">
                {{ reserva()!.codReserva }}
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                           text-[11px] font-semibold border"
                    [class]="estadoBadge(reserva()!.estado)">
                <span class="w-1.5 h-1.5 rounded-full" [class]="estadoDot(reserva()!.estado)"></span>
                {{ estadoLabel(reserva()!.estado) }}
              </span>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              @if (puedeCheckIn()) {
                <button type="button" (click)="onCheckIn.emit(reserva()!.reservaId)"
                  class="h-8 px-3 rounded-lg border border-emerald-200 text-[12px] font-semibold
                         text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white
                         hover:border-emerald-600 transition-colors">
                  Check-in
                </button>
              }
              @if (puedeCheckOut()) {
                <button type="button" (click)="onCheckOut.emit(reserva()!.reservaId)"
                  class="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-semibold
                         text-slate-600 bg-slate-50 hover:bg-slate-600 hover:text-white
                         hover:border-slate-600 transition-colors">
                  Check-out
                </button>
              }
              @if (puedeCancelar()) {
                <button type="button" (click)="onCancelar.emit(reserva()!.reservaId)"
                  class="h-8 px-3 rounded-lg border border-red-200 text-[12px] font-semibold
                         text-red-600 bg-red-50 hover:bg-red-600 hover:text-white
                         hover:border-red-600 transition-colors">
                  Cancelar
                </button>
              }
              <button type="button" (click)="onEditar.emit(reserva()!.reservaId)"
                class="h-8 px-3 rounded-lg border border-[#EEE3D1] text-[12px] font-semibold
                       text-[#8E6F2E] bg-[#FFF8E1] hover:bg-[#C5A048] hover:text-white
                       hover:border-[#C5A048] transition-colors">
                Editar
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-6">

            <!-- Información general -->
            <section>
              <p class="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#C5A048]
                         pb-2 mb-3 border-b border-[#EEE3D1]">
                Información general
              </p>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p class="text-[10px] uppercase tracking-wider font-semibold text-[#8E6F2E] mb-0.5">Fecha de llegada</p>
                  <p class="text-sm font-bold text-[#C5A048]">{{ formatFecha(reserva()!.fechaInicio) }}</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-wider font-semibold text-[#8E6F2E] mb-0.5">Fecha de salida</p>
                  <p class="text-sm font-bold text-[#C5A048]">{{ formatFecha(reserva()!.fechaFin) }}</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-wider font-semibold text-[#8E6F2E] mb-0.5">Adultos / Niños</p>
                  <p class="text-sm font-semibold text-[#2D2926]">{{ reserva()!.nroAdultos }} / {{ reserva()!.nroNinos }}</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-wider font-semibold text-[#8E6F2E] mb-0.5">Canal</p>
                  <p class="text-sm text-[#2D2926]">{{ reserva()!.canalNombre ?? 'Sin canal' }}</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-wider font-semibold text-[#8E6F2E] mb-0.5">Registrado por</p>
                  <p class="text-sm text-[#2D2926]">{{ reserva()!.usuarioNombre }}</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-wider font-semibold text-[#8E6F2E] mb-0.5">Creado</p>
                  <p class="text-[11px] text-[#2D2926]/60">{{ reserva()!.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
              </div>
              @if (reserva()!.observaciones) {
                <div class="mt-3 p-3 bg-white rounded-xl border border-[#EEE3D1]">
                  <p class="text-[10px] uppercase tracking-wider font-semibold text-[#8E6F2E] mb-1">Observaciones</p>
                  <p class="text-sm text-[#2D2926]">{{ reserva()!.observaciones }}</p>
                </div>
              }
            </section>

            <!-- Habitaciones -->
            <section>
              <p class="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#C5A048]
                         pb-2 mb-3 border-b border-[#EEE3D1]">
                Habitaciones
              </p>
              <div class="bg-white rounded-xl border border-[#EEE3D1] overflow-hidden">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-[#EEE3D1] text-left text-[10px] uppercase tracking-wider
                               text-[#8E6F2E]">
                      <th class="px-4 py-2.5 font-semibold">N°</th>
                      <th class="px-4 py-2.5 font-semibold">Tipo</th>
                      <th class="px-4 py-2.5 font-semibold">Tarifa/noche</th>
                      <th class="px-4 py-2.5 font-semibold">Noches</th>
                      <th class="px-4 py-2.5 font-semibold">Subtotal</th>
                      <th class="px-4 py-2.5 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (hab of reserva()!.habitaciones; track hab.reservaHabitacionId) {
                      <tr class="border-b border-[#EEE3D1] last:border-0">
                        <td class="px-4 py-2.5 font-bold text-[#C5A048]">{{ hab.habitacionNumero }}</td>
                        <td class="px-4 py-2.5 text-[#2D2926]/80">{{ hab.tipoHabitacionNombre }}</td>
                        <td class="px-4 py-2.5 text-[#2D2926]">S/ {{ hab.tarifaPactada | number:'1.2-2' }}</td>
                        <td class="px-4 py-2.5 text-[#2D2926]">{{ hab.noches }}</td>
                        <td class="px-4 py-2.5 font-semibold text-[#2D2926]">S/ {{ hab.subtotal | number:'1.2-2' }}</td>
                        <td class="px-4 py-2.5">
                          <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
                                [class]="habEstadoCls(hab.estado)">
                            {{ hab.estado }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>

            <!-- Huéspedes -->
            <section>
              <p class="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#C5A048]
                         pb-2 mb-3 border-b border-[#EEE3D1]">
                Huéspedes
              </p>
              <div class="space-y-2">
                @for (h of reserva()!.huespedes; track h.huespedId) {
                  <div class="flex items-center gap-3 p-3 bg-white rounded-xl border transition-colors"
                       [class]="h.esPrincipal ? 'border-[#C5A048]' : 'border-[#EEE3D1]'">
                    <div class="w-9 h-9 rounded-full bg-[#C5A048] text-white flex items-center justify-center
                                font-bold text-sm shrink-0">
                      {{ h.nombreCompleto.charAt(0) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-[#2D2926] truncate">{{ h.nombreCompleto }}</span>
                        @if (h.esPrincipal) {
                          <span class="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                                       bg-[#FFF8E1] text-[#C5A048] border border-[#FDE68A]">
                            Principal
                          </span>
                        }
                      </div>
                      <p class="text-[11px] text-[#8E6F2E]">{{ h.numeroDocumento }}</p>
                      @if (h.correo || h.telefono) {
                        <p class="text-[11px] text-[#2D2926]/50">
                          {{ h.correo }}{{ h.correo && h.telefono ? ' · ' : '' }}{{ h.telefono }}
                        </p>
                      }
                    </div>
                  </div>
                }
              </div>
            </section>

            <!-- Resumen económico -->
            <section>
              <p class="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#C5A048]
                         pb-2 mb-3 border-b border-[#EEE3D1]">
                Resumen económico
              </p>
              <div class="bg-white rounded-xl border border-[#EEE3D1] overflow-hidden">
                <div class="flex justify-between items-center px-4 py-2.5 border-b border-[#F9F5F0] text-sm text-[#2D2926]">
                  <span>Subtotal</span>
                  <span>S/ {{ reserva()!.subtotal | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between items-center px-4 py-2.5 border-b border-[#F9F5F0] text-sm text-[#2D2926]">
                  <span>Descuento</span>
                  <span class="text-emerald-600">- S/ {{ reserva()!.descuento | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between items-center px-4 py-2.5 border-b border-[#F9F5F0] text-sm text-[#2D2926]">
                  <span>Impuesto</span>
                  <span>S/ {{ reserva()!.impuesto | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between items-center px-4 py-3 border-b-2 border-[#EEE3D1]
                            bg-[#F9F5F0] font-bold text-base text-[#2D2926]">
                  <span>Total</span>
                  <span>S/ {{ reserva()!.montoTotal | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between items-center px-4 py-2.5 border-b border-[#F9F5F0] text-sm text-[#2D2926]">
                  <span>Adelanto pagado</span>
                  <span class="text-emerald-600 font-semibold">S/ {{ reserva()!.adelanto | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between items-center px-4 py-2.5 text-sm font-semibold text-[#C5A048]">
                  <span>Saldo pendiente</span>
                  <span>S/ {{ (reserva()!.montoTotal - reserva()!.adelanto) | number:'1.2-2' }}</span>
                </div>
              </div>
            </section>

            <!-- Historial -->
            @if (historial().length > 0) {
              <section>
                <p class="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#C5A048]
                           pb-2 mb-3 border-b border-[#EEE3D1]">
                  Historial de cambios
                </p>
                <div class="space-y-0">
                  @for (h of historial(); track h.historialId; let last = $last) {
                    <div class="flex gap-4" [class]="last ? '' : 'pb-4'">
                      <div class="flex flex-col items-center">
                        <div class="w-2.5 h-2.5 rounded-full bg-[#C5A048] shrink-0 mt-1"></div>
                        @if (!last) {
                          <div class="w-px flex-1 bg-[#EEE3D1] mt-1"></div>
                        }
                      </div>
                      <div class="flex-1 pb-1">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                                [class]="estadoBadge(h.estadoAnterior)">
                            {{ estadoLabel(h.estadoAnterior) }}
                          </span>
                          <svg class="w-3 h-3 text-[#8E6F2E]" viewBox="0 0 24 24" fill="none"
                               stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" d="M5 12h14M13 6l6 6-6 6"/>
                          </svg>
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                                [class]="estadoBadge(h.estadoNuevo)">
                            {{ estadoLabel(h.estadoNuevo) }}
                          </span>
                        </div>
                        @if (h.motivo) {
                          <p class="text-[11px] text-[#2D2926]/55 italic mt-1">{{ h.motivo }}</p>
                        }
                        <span class="text-[10px] text-[#8E6F2E] mt-0.5 block">
                          {{ h.fechaCambio | date:'dd/MM/yyyy HH:mm' }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              </section>
            }

          </div>
        </div>
      </div>
    }
  `,
})
export class ReservationDetailComponent {
  private readonly svc = inject(ReservationService);

  isOpen    = input.required<boolean>();
  reservaId = input<number | null>(null);
  /** Objeto de reserva precargado (p. ej. desde la lista de mis-reservas).
   *  Si se provee, se usa directamente sin depender del store de ReservationService. */
  reservaData = input<Reserva | null>(null);
  /** Muestra un estado de carga mientras se obtiene el detalle (ej. /mis-reservas/{id}). */
  loading = input<boolean>(false);

  onClose    = output<void>();
  onEditar   = output<number>();
  onCheckIn  = output<number>();
  onCheckOut = output<number>();
  onCancelar = output<number>();

  readonly reserva = computed(() => {
    const preload = this.reservaData();
    if (preload) return preload;
    const id = this.reservaId();
    return id != null ? this.svc.findById(id) ?? null : null;
  });

  readonly historial = toSignal(
    toObservable(computed(() => (this.isOpen() ? this.reservaId() : null))).pipe(
      distinctUntilChanged(),
      switchMap(id => id != null ? this.svc.obtenerHistorial(id) : of([] as HistorialReserva[])),
    ),
    { initialValue: [] as HistorialReserva[] }
  );

  puedeCheckIn(): boolean {
    const e = this.reserva()?.estado;
    return e === 'CONFIRMADA' || e === 'PENDIENTE';
  }

  puedeCheckOut(): boolean {
    return this.reserva()?.estado === 'CHECK_IN';
  }

  puedeCancelar(): boolean {
    const e = this.reserva()?.estado;
    return e !== 'CANCELADA' && e !== 'CHECK_OUT' && e !== 'NO_SHOW';
  }

  formatFecha(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  // Tolera null (ej. estadoAnterior del alta de reserva) y valores desconocidos.
  estadoBadge(estado: EstadoReserva | null): string {
    return (estado && ESTADO_CFG[estado]?.badge) ?? 'bg-slate-50 text-slate-500 border-slate-200';
  }
  estadoDot(estado: EstadoReserva): string    { return ESTADO_CFG[estado]?.dot ?? 'bg-slate-400'; }
  estadoLabel(estado: EstadoReserva | null): string {
    if (estado == null) return 'Creación'; // alta de la reserva (sin estado anterior)
    return ESTADO_CFG[estado]?.label ?? '—';
  }
  habEstadoCls(estado: EstadoReservaHabitacion): string { return HAB_ESTADO[estado] ?? 'bg-slate-50 text-slate-500'; }
}
