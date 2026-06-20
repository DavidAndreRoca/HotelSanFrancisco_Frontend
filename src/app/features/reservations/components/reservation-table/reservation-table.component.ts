import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { EstadoReserva, Reserva } from '../../models/reservation.model';

const ESTADO_CFG: Record<EstadoReserva, { label: string; bg: string; text: string; dot: string }> = {
  PENDIENTE:  { label: 'Pendiente',  bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-500'  },
  CONFIRMADA: { label: 'Confirmada', bg: 'bg-emerald-50', text: 'text-emerald-700',dot: 'bg-emerald-500' },
  CHECK_IN:   { label: 'Check-in',   bg: 'bg-[#FFF8E1]',  text: 'text-[#8E6F2E]', dot: 'bg-[#C5A048]'  },
  CHECK_OUT:  { label: 'Check-out',  bg: 'bg-slate-50',   text: 'text-slate-600',  dot: 'bg-slate-400'  },
  CANCELADA:  { label: 'Cancelada',  bg: 'bg-red-50',     text: 'text-red-700',    dot: 'bg-red-500'    },
  NO_SHOW:    { label: 'No show',    bg: 'bg-purple-50',  text: 'text-purple-700', dot: 'bg-purple-500' },
};

@Component({
  selector: 'app-reservation-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden">
      @if (reservas().length === 0) {
        <div class="py-16 text-center">
          <p class="text-sm font-semibold text-[#2D2926]">Sin reservas</p>
          <p class="text-xs text-[#2D2926]/45 mt-1">No se encontraron reservas con los filtros aplicados.</p>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full min-w-[860px] text-sm">
            <thead>
              <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase tracking-wide
                         text-[#2D2926]/50">
                <th class="px-4 py-3 font-semibold">Código</th>
                <th class="px-4 py-3 font-semibold">Huésped</th>
                <th class="px-4 py-3 font-semibold">Habitación</th>
                <th class="px-4 py-3 font-semibold">Check-in</th>
                <th class="px-4 py-3 font-semibold">Check-out</th>
                <th class="px-4 py-3 font-semibold">Estado</th>
                <th class="px-4 py-3 font-semibold">Monto</th>
                <th class="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (r of reservas(); track r.reservaId) {
                <tr class="border-b border-[#EEE3D1] last:border-0 hover:bg-[#F9F5F0] transition-colors">

                  <td class="px-4 py-3">
                    <span class="font-mono text-xs font-semibold text-[#8E6F2E]">
                      {{ r.codReserva }}
                    </span>
                  </td>

                  <td class="px-4 py-3">
                    <p class="font-semibold text-[#2D2926]">{{ huesped(r).nombreCompleto }}</p>
                    <p class="text-[11px] text-[#2D2926]/50">{{ huesped(r).numeroDocumento }}</p>
                  </td>

                  <td class="px-4 py-3">
                    <p class="font-bold text-[#C5A048]">{{ habitacion(r).habitacionNumero }}</p>
                    <p class="text-[11px] text-[#2D2926]/50">{{ habitacion(r).tipoHabitacionNombre }}</p>
                  </td>

                  <td class="px-4 py-3 text-[#2D2926]/80">{{ fmt(r.fechaInicio) }}</td>
                  <td class="px-4 py-3 text-[#2D2926]/80">{{ fmt(r.fechaFin) }}</td>

                  <td class="px-4 py-3">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                 text-[11px] font-semibold border"
                          [class]="estadoBadge(r.estado)">
                      <span class="w-1.5 h-1.5 rounded-full" [class]="estadoDot(r.estado)"></span>
                      {{ estadoLabel(r.estado) }}
                    </span>
                  </td>

                  <td class="px-4 py-3">
                    <p class="font-bold text-[#2D2926]">S/ {{ r.montoTotal | number:'1.2-2' }}</p>
                    @if (r.adelanto > 0) {
                      <p class="text-[11px] text-emerald-600">
                        Adelanto: S/ {{ r.adelanto | number:'1.2-2' }}
                      </p>
                    }
                  </td>

                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1.5">
                      <button type="button"
                        (click)="onVerReserva.emit(r.reservaId)"
                        class="h-7 px-2.5 rounded-lg border border-[#EEE3D1] text-[11px] font-medium
                               text-[#2D2926]/60 hover:border-[#C5A048] hover:text-[#C5A048] transition-colors"
                        title="Ver detalle">
                        Ver
                      </button>
                      <button type="button"
                        (click)="onEditarReserva.emit(r.reservaId)"
                        class="h-7 px-2.5 rounded-lg border border-[#EEE3D1] text-[11px] font-medium
                               text-[#2D2926]/60 hover:border-[#C5A048] hover:text-[#C5A048] transition-colors"
                        title="Editar">
                        Editar
                      </button>
                      @if (r.estado === 'CONFIRMADA' || r.estado === 'PENDIENTE') {
                        <button type="button"
                          (click)="onCheckIn.emit(r.reservaId)"
                          class="h-7 px-2.5 rounded-lg border border-emerald-200 text-[11px] font-medium
                                 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Check-in">
                          Check-in
                        </button>
                      }
                      @if (r.estado === 'CHECK_IN') {
                        <button type="button"
                          (click)="onCheckOut.emit(r.reservaId)"
                          class="h-7 px-2.5 rounded-lg border border-slate-200 text-[11px] font-medium
                                 text-slate-600 hover:bg-slate-50 transition-colors"
                          title="Check-out">
                          Check-out
                        </button>
                      }
                      @if (r.estado !== 'CANCELADA' && r.estado !== 'CHECK_OUT' && r.estado !== 'NO_SHOW') {
                        <button type="button"
                          (click)="onCancelarReserva.emit(r.reservaId)"
                          class="h-7 px-2.5 rounded-lg border border-red-100 text-[11px] font-medium
                                 text-red-500 hover:bg-red-50 transition-colors"
                          title="Cancelar">
                          Cancelar
                        </button>
                      }
                    </div>
                  </td>

                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class ReservationTableComponent {
  reservas = input.required<Reserva[]>();

  onVerReserva      = output<number>();
  onEditarReserva   = output<number>();
  onCheckIn         = output<number>();
  onCheckOut        = output<number>();
  onCancelarReserva = output<number>();

  huesped(r: Reserva) {
    return r.huespedes.find(h => h.esPrincipal) ?? r.huespedes.at(0)
      ?? { nombreCompleto: '—', numeroDocumento: '—', esPrincipal: true, huespedId: 0, correo: null, telefono: null };
  }

  habitacion(r: Reserva) {
    return r.habitaciones.at(0) ?? { habitacionNumero: '—', tipoHabitacionNombre: '—' };
  }

  fmt(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  estadoBadge(e: EstadoReserva): string {
    const c = ESTADO_CFG[e];
    return `${c.bg} ${c.text} border-transparent`;
  }

  estadoDot(e: EstadoReserva): string {
    return ESTADO_CFG[e].dot;
  }

  estadoLabel(e: EstadoReserva): string {
    return ESTADO_CFG[e].label;
  }
}
