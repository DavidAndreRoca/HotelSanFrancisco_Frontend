import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ReservationService } from '../../services/reservation.service';
import { DetalleHuesped, EstadoReserva, PagoReserva, Reserva, ReservaHabitacion } from '../../models/reservation.model';

const ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80',
];

@Component({
  selector: 'app-reservation-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-5">

      <!-- ── Volver ─────────────────────────────────────────────── -->
      <button
        type="button"
        (click)="volverAtras()"
        class="inline-flex items-center gap-1.5 text-sm text-[#2D2926]/60
               hover:text-[#C5A048] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
             stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Volver
      </button>

      <!-- ── Skeleton de carga ───────────────────────────────────── -->
      @if (loading()) {
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <div class="space-y-4">
            <div class="h-64 bg-[#EEE3D1] rounded-xl animate-pulse"></div>
            <div class="bg-white rounded-xl border border-[#EEE3D1] p-6 space-y-4">
              @for (_ of [1,2,3,4,5]; track _) {
                <div class="h-4 bg-[#EEE3D1] rounded animate-pulse"></div>
              }
            </div>
          </div>
          <div class="space-y-4">
            <div class="bg-white rounded-xl border border-[#EEE3D1] h-52 animate-pulse"></div>
            <div class="bg-white rounded-xl border border-[#EEE3D1] h-32 animate-pulse"></div>
          </div>
        </div>
      }

      <!-- ── Sin reserva / Contenido ──────────────────────────────── -->
      @if (!loading()) {
        @if (reserva(); as r) {
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

          <!-- ───── Columna izquierda ──────────────────────────── -->
          <div class="space-y-4">

            <!-- Imagen de habitación -->
            <div class="h-64 rounded-xl overflow-hidden">
              <img
                [src]="roomImage()"
                [alt]="primerHab(r)?.tipoHabitacionNombre ?? 'Habitación'"
                class="w-full h-full object-cover"
                loading="lazy" />
            </div>

            <!-- Card de detalles -->
            <div class="bg-white rounded-xl border border-[#EEE3D1] p-6">

              <!-- Tipo + badge de estado -->
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <h2 class="text-xl font-bold text-[#2D2926]">
                  {{ primerHab(r)?.tipoHabitacionNombre ?? 'Sin tipo' }}
                </h2>
                <span
                  class="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
                  [class]="badgeClass(r.estado)">
                  {{ badgeLabel(r.estado) }}
                </span>
              </div>

              @if (primerHab(r); as hab) {
                <p class="text-sm text-[#2D2926]/50 mt-0.5">
                  Habitación {{ hab.habitacionNumero }}
                </p>
              }

              <hr class="border-[#EEE3D1] my-4" />

              <!-- Datos de reserva -->
              <p class="text-[10px] font-bold text-[#C5A048] uppercase tracking-widest mb-3">
                Datos de reserva:
              </p>

              <div class="grid grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <p class="text-[11px] text-[#2D2926]/50 font-medium">Nombre</p>
                  <p class="text-sm font-medium text-[#2D2926] mt-0.5">
                    {{ huespedPrincipal(r)?.nombreCompleto ?? r.usuarioNombre }}
                  </p>
                </div>
                <div>
                  <p class="text-[11px] text-[#2D2926]/50 font-medium">Teléfono</p>
                  <p class="text-sm font-medium text-[#2D2926] mt-0.5">
                    {{ huespedPrincipal(r)?.telefono ?? '—' }}
                  </p>
                </div>
                <div>
                  <p class="text-[11px] text-[#2D2926]/50 font-medium">Correo</p>
                  <p class="text-sm font-medium text-[#2D2926] mt-0.5 truncate"
                     [title]="huespedPrincipal(r)?.correo ?? ''">
                    {{ huespedPrincipal(r)?.correo ?? '—' }}
                  </p>
                </div>
                <div>
                  <p class="text-[11px] text-[#2D2926]/50 font-medium">Personas</p>
                  <p class="text-sm font-medium text-[#2D2926] mt-0.5">
                    {{ r.nroAdultos + r.nroNinos }}
                  </p>
                </div>
              </div>

              <hr class="border-[#EEE3D1] my-4" />

              <!-- Check-in / Check-out -->
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <p class="text-[10px] font-bold text-[#C5A048] uppercase tracking-widest">
                    Check-in
                  </p>
                  <p class="text-sm font-bold text-[#2D2926] mt-1.5">
                    {{ formatFecha(r.fechaInicio) }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-[#C5A048] uppercase tracking-widest">
                    Check-out
                  </p>
                  <p class="text-sm font-bold text-[#2D2926] mt-1.5">
                    {{ formatFecha(r.fechaFin) }}
                  </p>
                </div>
              </div>

              <!-- Servicios (opcionales) -->
              @if (r.servicios && r.servicios.length > 0) {
                <hr class="border-[#EEE3D1] my-4" />

                <p class="text-[10px] font-bold text-[#C5A048] uppercase tracking-widest mb-3">
                  Servicios:
                </p>
                <div class="flex flex-wrap gap-2">
                  @for (srv of r.servicios; track srv.servicioId) {
                    <span class="inline-flex items-center h-7 px-3.5 rounded-full
                                 bg-[#F9F5F0] border border-[#EEE3D1]
                                 text-xs font-medium text-[#2D2926]">
                      {{ srv.nombre }}
                    </span>
                  }
                </div>
              }

            </div>
          </div>

          <!-- ───── Columna derecha ─────────────────────────────── -->
          <div class="space-y-4">

            <!-- Card Pago -->
            <div class="bg-white rounded-xl border border-[#EEE3D1] p-5">
              <h3 class="text-base font-bold text-[#2D2926] text-center mb-4">Pago</h3>

              <!-- Código de la reserva -->
              <div class="bg-[#F9F5F0] rounded-lg px-4 py-3 text-center mb-4">
                <span class="text-base font-bold tracking-widest text-[#C5A048]">
                  {{ r.codReserva }}
                </span>
              </div>

              <!-- Filas de montos -->
              <div class="space-y-3">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-[#2D2926]/55 font-medium">Total</span>
                  <span class="font-semibold text-[#2D2926]">
                    S/. {{ formatMonto(r.montoTotal) }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-[#2D2926]/55 font-medium">Pagado</span>
                  <span class="font-semibold text-green-600">
                    S/. {{ formatMonto(totalPagado()) }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-sm font-semibold">
                  <span class="text-[#C5A048]">Saldo pendiente</span>
                  <span class="text-[#C5A048]">
                    S/. {{ formatMonto(r.montoTotal - totalPagado()) }}
                  </span>
                </div>
                <hr class="border-[#EEE3D1]" />
                <div class="flex items-center justify-between text-sm">
                  <span class="text-[#2D2926]/55 font-medium">Método de pago</span>
                  <span class="font-medium text-[#2D2926]">
                    {{ metodoPago() }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Card Acciones -->
            <div class="bg-white rounded-xl border border-[#EEE3D1] p-5">
              <h3 class="text-base font-bold text-[#2D2926] text-center mb-4">Acciones</h3>

              <div class="space-y-2.5">

                <!-- Descargar comprobante -->
                <button
                  type="button"
                  (click)="descargarComprobante()"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                         bg-[#F9F5F0] hover:bg-[#EEE3D1] transition-colors
                         border border-[#EEE3D1] text-[#C5A048] font-medium text-sm">
                  <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v1a2 2 0 002 2h14a2 2 0 002-2v-1"/>
                  </svg>
                  Descargar comprobante
                </button>

                <!-- Contactar recepción -->
                <button
                  type="button"
                  (click)="contactarRecepcion()"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                         bg-[#F9F5F0] hover:bg-[#EEE3D1] transition-colors
                         border border-[#EEE3D1] text-[#2D2926] font-medium text-sm">
                  <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8
                             a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042
                             3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  Contactar recepción
                </button>

              </div>
            </div>

          </div>
        </div>
        } @else {
          <div class="bg-white rounded-xl border border-[#EEE3D1] p-12 text-center">
            <p class="text-[#2D2926]/45 text-sm">No se encontró la reserva.</p>
            <button
              type="button"
              (click)="volverAtras()"
              class="mt-3 inline-block text-sm text-[#C5A048] hover:underline font-medium">
              Volver al listado
            </button>
          </div>
        }
      }

    </div>
  `,
})
export class ReservationDetailPage {
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(ReservationService);
  private readonly toastr = inject(ToastrService);

  readonly loading = signal(true);
  readonly reserva = signal<Reserva | null>(null);
  readonly pagos = signal<PagoReserva[]>([]);

  readonly totalPagado = computed(() =>
    this.pagos()
      .filter(p => p.tipoPago !== 'REEMBOLSO')
      .reduce((sum, p) => sum + p.monto, 0),
  );

  readonly metodoPago = computed(() =>
    this.pagos()[0]?.metodoPagoNombre ?? 'Sin información',
  );

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      return;
    }

    forkJoin([
      this.svc.getById(id).pipe(catchError(() => of(null))),
      this.svc.getPagos(id).pipe(catchError(() => of([]))),
    ]).subscribe(([reserva, pagos]) => {
      this.loading.set(false);
      this.reserva.set(reserva);
      this.pagos.set(pagos ?? []);
    });
  }

  roomImage(): string {
    const id = this.reserva()?.reservaId ?? 0;
    return ROOM_IMAGES[id % ROOM_IMAGES.length];
  }

  primerHab(r: Reserva): ReservaHabitacion | null {
    return r.habitaciones.at(0) ?? null;
  }

  huespedPrincipal(r: Reserva): DetalleHuesped | null {
    return r.huespedes.find((h) => h.esPrincipal) ?? r.huespedes.at(0) ?? null;
  }

  formatFecha(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    return `${d} ${meses[parseInt(m, 10) - 1]} ${y}`;
  }

  formatMonto(monto: number): string {
    return monto.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  badgeClass(estado: EstadoReserva): string {
    const map: Record<EstadoReserva, string> = {
      CHECK_IN:   'bg-green-100 text-green-700',
      CONFIRMADA: 'bg-amber-100 text-amber-700',
      PENDIENTE:  'bg-gray-100 text-[#2D2926]/60',
      CHECK_OUT:  'bg-blue-100 text-blue-700',
      CANCELADA:  'bg-red-100 text-red-600',
      NO_SHOW:    'bg-purple-100 text-purple-700',
    };
    return map[estado] ?? 'bg-gray-100 text-[#2D2926]/60';
  }

  badgeLabel(estado: EstadoReserva): string {
    const map: Record<EstadoReserva, string> = {
      CHECK_IN:   'Activa',
      CONFIRMADA: 'Confirmada',
      PENDIENTE:  'Pendiente',
      CHECK_OUT:  'Finalizada',
      CANCELADA:  'Cancelada',
      NO_SHOW:    'No presentado',
    };
    return map[estado] ?? estado;
  }

  volverAtras(): void {
    this.location.back();
  }

  descargarComprobante(): void {
    const pago = this.pagos().find((p) => p.comprobante);
    if (pago?.comprobante) {
      // comprobante es número de boleta/factura (ej. "BOLETA-2026-0001"), no una URL
      this.toastr.info(`Comprobante: ${pago.comprobante}`, 'Número de comprobante');
    } else {
      this.toastr.info('El comprobante aún no está disponible.', 'Sin comprobante');
    }
  }

  contactarRecepcion(): void {
    this.toastr.info('Comunícate a recepción: +51 1 234 5678', 'Recepción Hotel San Francisco');
  }
}
