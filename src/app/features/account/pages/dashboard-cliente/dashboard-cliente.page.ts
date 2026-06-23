import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { MiDashboardResponse, MiReservaItem } from '../../../../core/auth/auth-user.interface';

@Component({
  selector: 'app-dashboard-cliente',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">

      <!-- ── Cabecera ─────────────────────────────────────────────── -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-[#2D2926]">
          Bienvenido, {{ firstName() }}
        </h1>
      </div>

      <!-- ── Stat cards ────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        @for (stat of stats(); track stat.label) {
          <div class="bg-white rounded-xl border border-[#EEE3D1] p-4 flex flex-col items-center
                      text-center gap-2 sm:flex-row sm:text-left sm:gap-3">
            <div
              class="w-11 h-11 rounded-lg bg-[#C5A048]/10 flex items-center justify-center shrink-0"
              aria-hidden="true">
              <span class="text-[#C5A048] text-xl">{{ stat.icon }}</span>
            </div>
            <div class="min-w-0">
              @if (loading()) {
                <div class="h-6 w-12 bg-[#EEE3D1] rounded animate-pulse mb-1 mx-auto sm:mx-0"></div>
                <div class="h-3 w-20 bg-[#EEE3D1] rounded animate-pulse mx-auto sm:mx-0"></div>
              } @else {
                <p class="text-2xl font-bold text-[#2D2926] leading-tight whitespace-nowrap">{{ stat.value }}</p>
                <p class="text-xs text-[#2D2926]/55 mt-1 leading-tight">{{ stat.label }}</p>
              }
            </div>
          </div>
        }
      </div>

      <!-- ── Estadías activas ──────────────────────────────────────── -->
      <section>
        <h2 class="text-lg font-bold text-[#2D2926] mb-4">Estadías Activas</h2>

        @if (loadingReservas()) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            @for (_ of [1, 2]; track _) {
              <div class="bg-white rounded-xl border border-[#EEE3D1] h-32 animate-pulse"></div>
            }
          </div>
        } @else if (reservasVisibles().length === 0) {
          <div class="bg-white rounded-xl border border-[#EEE3D1] p-8 text-center">
            <p class="text-[#2D2926]/45 text-sm">No tienes estadías activas ni próximas reservas.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            @for (reserva of reservasVisibles(); track reserva.reservaId) {
              <div class="bg-white rounded-xl border border-[#EEE3D1] overflow-hidden flex">

                <!-- Imagen de habitación -->
                <div class="w-32 shrink-0 relative overflow-hidden">
                  <img
                    [src]="roomImage(reserva.reservaId)"
                    [alt]="primerHabitacion(reserva).tipoHabitacionNombre"
                    class="absolute inset-0 w-full h-full object-cover"
                    loading="lazy" />
                </div>

                <!-- Contenido -->
                <div class="flex-1 p-4 min-w-0">
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <p class="font-mono text-sm font-semibold text-[#2D2926] truncate">
                      {{ reserva.codReserva }}
                    </p>
                    <span
                      class="shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                      [class]="badgeClass(reserva.estado)">
                      {{ badgeLabel(reserva.estado) }}
                    </span>
                  </div>

                  <p class="text-xs text-[#2D2926]/50 mb-3">
                    {{ numHuespedes(reserva) }} {{ numHuespedes(reserva) === 1 ? 'huésped' : 'huéspedes' }}
                  </p>

                  <div class="border-t border-[#EEE3D1] pt-2.5 flex items-center justify-between">
                    <p class="text-xs text-[#2D2926]/65">
                      {{ formatDate(reserva.fechaInicio) }} → {{ formatDate(reserva.fechaFin) }}
                    </p>
                    <p class="text-xs text-[#2D2926]/50 shrink-0 ml-2">
                      {{ calcNoches(reserva) }} {{ calcNoches(reserva) === 1 ? 'noche' : 'noches' }}
                    </p>
                  </div>
                </div>

              </div>
            }
          </div>
        }
      </section>

      <!-- ── Banner CTA ─────────────────────────────────────────────── -->
      <div class="bg-white rounded-xl border border-[#EEE3D1] p-5
                  flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div
            class="w-10 h-10 rounded-lg bg-[#C5A048]/10 flex items-center justify-center shrink-0"
            aria-hidden="true">
            <svg class="w-5 h-5 text-[#C5A048]" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915
                       c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674
                       c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888
                       c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888
                       c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-[#2D2926]">¿Disfrutando tu estadía?</p>
            <p class="text-xs text-[#2D2926]/50 mt-0.5">
              Solicita servicios adicionales o extiende tu reserva
            </p>
          </div>
        </div>
        <button
          type="button"
          (click)="verServicios()"
          class="shrink-0 h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                 hover:bg-[#8E6F2E] transition-colors">
          Ver servicios
        </button>
      </div>

    </div>
  `,
})
export class DashboardClientePage {
  private readonly auth = inject(AuthService);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly loadingReservas = signal(true);
  readonly dashboard = signal<MiDashboardResponse | null>(null);
  readonly reservas = signal<MiReservaItem[]>([]);

  private readonly ROOM_IMAGES = [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=400&q=80',
  ];

  readonly firstName = computed(() => {
    const nombre =
      this.dashboard()?.nombreCompleto ?? this.store.user()?.nombre ?? 'Usuario';
    return nombre.split(' ')[0];
  });

  readonly reservasVisibles = computed(() =>
    this.reservas().filter((r) => ['CHECK_IN', 'CONFIRMADA'].includes(r.estado)),
  );

  readonly diasEnHotel = computed(() => {
    const activa = this.reservas().find((r) => r.estado === 'CHECK_IN');
    if (!activa) return 0;
    return Math.max(1, Math.ceil((Date.now() - new Date(activa.fechaInicio).getTime()) / 86_400_000));
  });

  readonly proximasCount = computed(() => {
    // Fecha de hoy en zona local (no UTC) para evitar el desfase al comparar contra fechas del backend.
    const d = new Date();
    const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return this.reservas().filter(
      (r) => r.estado === 'CONFIRMADA' && r.fechaInicio > hoy,
    ).length;
  });

  readonly stats = computed(() => {
    const d = this.dashboard();
    return [
      { icon: '🛏', value: String(d?.reservas?.activas ?? 0), label: 'Reservas Activas' },
      { icon: '💳', value: d ? `S/${(d.montoDeuda ?? 0).toFixed(2)}` : 'S/0.00', label: 'Pagos pendientes' },
      { icon: '📅', value: String(this.proximasCount()), label: 'Próximas reservas' },
      { icon: '⏱', value: String(this.diasEnHotel()), label: 'Días en hotel' },
    ];
  });

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    forkJoin([
      this.auth.getMiDashboard().pipe(catchError(() => of(null))),
      this.auth.getMisReservas().pipe(catchError(() => of([]))),
    ]).subscribe(([dashboard, reservas]) => {
      this.loading.set(false);
      this.loadingReservas.set(false);
      this.dashboard.set(dashboard);
      this.reservas.set(Array.isArray(reservas) ? reservas : (reservas as any)?.content ?? []);
    });
  }

  verServicios(): void {
    this.router.navigate(['/servicios-catalogo']);
  }

  primerHabitacion(reserva: MiReservaItem) {
    return reserva.habitaciones[0] ?? {
      habitacionId: 0,
      habitacionNumero: '—',
      tipoHabitacionNombre: '—',
      noches: 0,
    };
  }

  numHuespedes(reserva: MiReservaItem): number {
    return reserva.nroAdultos + reserva.nroNinos;
  }

  /** Noches calculadas desde las fechas (el listado liviano no trae habitaciones). */
  calcNoches(reserva: MiReservaItem): number {
    const [y1, m1, d1] = reserva.fechaInicio.split('-').map(Number);
    const [y2, m2, d2] = reserva.fechaFin.split('-').map(Number);
    const ms = new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime();
    return Math.max(0, Math.round(ms / 86_400_000));
  }

  roomImage(reservaId: number): string {
    return this.ROOM_IMAGES[reservaId % this.ROOM_IMAGES.length];
  }

  formatDate(fecha: string): string {
    // Parseo de YYYY-MM-DD en zona local (no UTC) para evitar que el día se corra hacia atrás.
    const [y, m, d] = fecha.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  badgeClass(estado: string): string {
    const map: Record<string, string> = {
      CHECK_IN: 'bg-green-100 text-green-700',
      CONFIRMADA: 'bg-amber-100 text-amber-700',
      PENDIENTE: 'bg-gray-100 text-[#2D2926]/60',
      CANCELADA: 'bg-red-100 text-red-600',
    };
    return map[estado] ?? 'bg-gray-100 text-[#2D2926]/60';
  }

  badgeLabel(estado: string): string {
    const map: Record<string, string> = {
      CHECK_IN: 'Estadía Activa',
      CONFIRMADA: 'Confirmada',
      PENDIENTE: 'Pendiente',
      CANCELADA: 'Cancelada',
    };
    return map[estado] ?? estado;
  }
}
