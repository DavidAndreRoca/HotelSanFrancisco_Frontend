import {
  Component, inject, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthStore } from '../../../../core/auth/auth.store';
import { MisReservasService } from '../../services/mis-reservas.service';
import { ReservationDetailComponent } from '../../components/reservation-detail/reservation-detail.component';
import { CancelarModalComponent } from '../../components/cancelar-modal/cancelar-modal.component';
import {
  ReservationFormComponent,
  ReservaFormSaveEvent,
} from '../../components/reservation-form/reservation-form.component';
import {
  CancelarReservaPayload,
  CreateReservaPayload,
  EstadoReserva,
  Reserva,
} from '../../models/reservation.model';

type FiltroMisReservas = EstadoReserva | 'todas' | 'activas';

const ESTADO_CFG: Record<EstadoReserva, { label: string; badge: string; dot: string; bar: string }> = {
  PENDIENTE:  { label: 'Pendiente',  badge: 'bg-amber-50 text-amber-700 border-amber-200',      dot: 'bg-amber-500',   bar: 'bg-amber-400'   },
  CONFIRMADA: { label: 'Confirmada', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  CHECK_IN:   { label: 'Check-in',   badge: 'bg-[#FFF8E1] text-[#8E6F2E] border-[#FDE68A]',    dot: 'bg-[#C5A048]',   bar: 'bg-[#C5A048]'  },
  CHECK_OUT:  { label: 'Check-out',  badge: 'bg-slate-50 text-slate-600 border-slate-200',       dot: 'bg-slate-400',   bar: 'bg-slate-400'  },
  CANCELADA:  { label: 'Cancelada',  badge: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500',     bar: 'bg-red-500'    },
  NO_SHOW:    { label: 'No show',    badge: 'bg-purple-50 text-purple-700 border-purple-200',    dot: 'bg-purple-500',  bar: 'bg-purple-500' },
};

@Component({
  selector: 'app-mis-reservas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, ReservationDetailComponent, CancelarModalComponent, ReservationFormComponent],
  template: `
    <div class="space-y-6">

      <!-- Cabecera -->
      <header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-[11px] uppercase tracking-[0.3em] text-[#C5A048] font-semibold mb-1">
            Recepción
          </p>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-[#2D2926]">Mis reservas</h1>
          @if (auth.user()) {
            <p class="text-[15px] text-[#2D2926]/55 mt-1">
              {{ auth.user()!.nombreCompleto }} · {{ auth.user()!.rol }}
            </p>
          }
        </div>
        <button type="button" (click)="abrirNuevaReserva()"
          class="self-start sm:self-auto inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#C5A048] text-white
                 text-sm font-semibold hover:bg-[#8E6F2E] transition-colors shrink-0">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Reservar
        </button>
      </header>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
          <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Total</p>
          <p class="mt-1.5 text-2xl font-bold text-[#2D2926]">{{ misReservas().length }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
          <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Activas</p>
          <p class="mt-1.5 text-2xl font-bold text-[#C5A048]">{{ activasCount() }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
          <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Llegadas hoy</p>
          <p class="mt-1.5 text-2xl font-bold text-emerald-600">{{ todayCheckIns() }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
          <p class="text-[11px] uppercase tracking-wider text-[#2D2926]/50 font-semibold">Salidas hoy</p>
          <p class="mt-1.5 text-2xl font-bold text-[#2D2926]/50">{{ todayCheckOuts() }}</p>
        </div>
      </div>

      <!-- Filtros -->
      <div class="flex flex-wrap gap-2">
        @for (f of filtros; track f.value) {
          <button type="button"
            class="h-8 px-3 rounded-lg text-xs font-semibold border transition-colors"
            [class]="filtroActivo() === f.value
              ? 'bg-[#C5A048] border-[#C5A048] text-white'
              : 'bg-white border-[#EEE3D1] text-[#2D2926] hover:border-[#C5A048] hover:text-[#C5A048]'"
            (click)="filtroActivo.set(f.value)">
            {{ f.label }}
            @if (f.count() > 0) {
              <span class="ml-1 opacity-75">{{ f.count() }}</span>
            }
          </button>
        }
      </div>

      <!-- Lista -->
      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (_ of [1,2,3]; track $index) {
            <div class="bg-white rounded-2xl border border-[#EEE3D1] h-48 animate-pulse"></div>
          }
        </div>
      } @else if (error()) {
        <div class="bg-white rounded-2xl border border-[#EEE3D1] py-16 text-center">
          <p class="text-sm font-semibold text-red-600">{{ error() }}</p>
          <button type="button" (click)="cargar()"
            class="mt-3 text-sm text-[#C5A048] hover:underline font-medium">Reintentar</button>
        </div>
      } @else if (reservasFiltradas().length === 0) {
        <div class="bg-white rounded-2xl border border-[#EEE3D1] py-16 text-center">
          <p class="text-sm font-semibold text-[#2D2926]">Sin reservas</p>
          <p class="text-xs text-[#2D2926]/45 mt-1">
            @if (misReservas().length === 0) {
              Aún no tienes reservas. Usa “Reservar” para crear una.
            } @else {
              No hay reservas con el filtro seleccionado.
            }
          </p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (r of reservasFiltradas(); track r.reservaId) {
            <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden
                        hover:-translate-y-0.5 hover:shadow-md transition-all relative">

              <!-- Barra izquierda de color por estado -->
              <div class="absolute inset-y-0 left-0 w-1 rounded-l-2xl" [class]="estadoBar(r.estado)"></div>

              <!-- Card header -->
              <div class="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-[#F9F5F0] pl-5">
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px]
                             font-semibold border" [class]="estadoBadge(r.estado)">
                  <span class="w-1.5 h-1.5 rounded-full" [class]="estadoDot(r.estado)"></span>
                  {{ estadoLabel(r.estado) }}
                </span>
                <span class="font-mono text-xs font-bold text-[#2D2926] flex-1">{{ r.codReserva }}</span>
                @if (r.canalNombre) {
                  <span class="text-[10px] text-[#8E6F2E] bg-[#EEE3D1] px-1.5 py-0.5 rounded">
                    {{ r.canalNombre }}
                  </span>
                }
              </div>

              <!-- Card body -->
              <div class="px-4 py-3 pl-5 space-y-3">

                <!-- Huésped -->
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-[#C5A048] text-white shrink-0
                              flex items-center justify-center font-bold text-sm">
                    {{ huespedPrincipal(r).charAt(0) }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-[#2D2926] truncate">{{ huespedPrincipal(r) }}</p>
                    @if (huespedDoc(r)) {
                      <p class="text-[11px] text-[#8E6F2E]">{{ huespedDoc(r) }}</p>
                    }
                  </div>
                </div>

                <!-- Fechas -->
                <div class="flex items-center gap-2 bg-[#F9F5F0] rounded-xl px-3 py-2">
                  <div>
                    <p class="text-[9px] uppercase tracking-wider font-semibold text-[#8E6F2E]">Llegada</p>
                    <p class="text-sm font-bold text-[#2D2926]">{{ formatFecha(r.fechaInicio) }}</p>
                  </div>
                  <div class="flex-1 flex items-center justify-center gap-1">
                    <div class="flex-1 border-t border-dashed border-[#EEE3D1]"></div>
                    <span class="text-[11px] font-bold text-[#C5A048] whitespace-nowrap px-1">
                      {{ calcNoches(r) }}n
                    </span>
                    <div class="flex-1 border-t border-dashed border-[#EEE3D1]"></div>
                  </div>
                  <div class="text-right">
                    <p class="text-[9px] uppercase tracking-wider font-semibold text-[#8E6F2E]">Salida</p>
                    <p class="text-sm font-bold text-[#2D2926]">{{ formatFecha(r.fechaFin) }}</p>
                  </div>
                </div>

                <!-- Pax (el desglose de habitaciones se ve en el detalle) -->
                <div class="flex flex-wrap gap-1.5">
                  <span class="text-[11px] text-[#8E6F2E] bg-[#EEE3D1] px-2 py-0.5 rounded-md font-medium">
                    {{ r.nroAdultos }}A{{ r.nroNinos > 0 ? ' + ' + r.nroNinos + 'N' : '' }}
                  </span>
                </div>

              </div>

              <!-- Banners de hoy -->
              @if (r.llegadaHoy) {
                <div class="text-[11px] font-bold text-center py-1.5 bg-emerald-50 text-emerald-700">
                  Llegada hoy
                </div>
              }
              @if (esHoy(r.fechaFin) && r.estado === 'CHECK_IN') {
                <div class="text-[11px] font-bold text-center py-1.5 bg-[#FFF8E1] text-[#8E6F2E]">
                  Salida hoy
                </div>
              }

              <!-- Card footer -->
              <div class="flex items-center justify-between px-4 py-3 pl-5
                          border-t border-[#F9F5F0]">
                <div>
                  <p class="text-base font-bold text-[#2D2926]">S/ {{ r.montoTotal | number:'1.2-2' }}</p>
                  @if (r.adelanto > 0) {
                    <p class="text-[11px] text-[#C5A048] font-semibold">
                      Saldo: S/ {{ (r.montoTotal - r.adelanto) | number:'1.2-2' }}
                    </p>
                  }
                </div>
                <div class="flex gap-1.5">
                  <button type="button" (click)="abrirDetalle(r)"
                    class="h-7 px-2.5 rounded-lg border border-[#EEE3D1] text-[11px] font-semibold
                           text-[#8E6F2E] hover:border-[#C5A048] hover:text-[#C5A048] transition-colors">
                    Ver
                  </button>
                  @if (puedeCancelar(r.estado)) {
                    <button type="button" (click)="iniciarCancelacion(r)"
                      class="h-7 px-2.5 rounded-lg border border-red-100 text-[11px] font-semibold
                             text-red-500 hover:bg-red-600 hover:text-white hover:border-red-600
                             transition-colors">
                      Cancelar
                    </button>
                  }
                </div>
              </div>

            </div>
          }
        </div>
      }

    </div>

    <!-- Modales -->
    <app-reservation-detail
      [isOpen]="detailAbierto()"
      [reservaId]="reservaIdDetalle()"
      [reservaData]="reservaDetalle()"
      [loading]="detailLoading()"
      (onClose)="detailAbierto.set(false)"
      (onEditar)="detailAbierto.set(false)"
      (onCancelar)="iniciarCancelacionById($event)" />

    <app-cancelar-modal
      [isOpen]="cancelarAbierto()"
      [reserva]="reservaACancelar()"
      (onClose)="cancelarAbierto.set(false)"
      (onCancelar)="confirmarCancelacion($event)" />

    <app-reservation-form
      [isOpen]="formAbierto()"
      [reserva]="null"
      (onClose)="formAbierto.set(false)"
      (onSave)="guardarReserva($event)" />
  `,
})
export class MisReservasComponent {
  protected readonly auth   = inject(AuthStore);
  private  readonly misSvc  = inject(MisReservasService);
  private  readonly toastr  = inject(ToastrService);

  readonly filtroActivo = signal<FiltroMisReservas>('todas');

  // ── Estado de datos ──────────────────────────────────────────────────────────
  readonly reservas = signal<Reserva[]>([]);
  readonly loading  = signal(true);
  readonly error    = signal<string | null>(null);

  readonly detailAbierto    = signal(false);
  readonly detailLoading    = signal(false);
  readonly reservaIdDetalle = signal<number | null>(null);
  readonly reservaDetalle   = signal<Reserva | null>(null);
  readonly cancelarAbierto  = signal(false);
  readonly reservaACancelar = signal<Reserva | null>(null);
  readonly formAbierto      = signal(false);

  constructor() {
    this.cargar();
  }

  /** Carga las reservas del usuario autenticado desde /api/v1/mis-reservas. */
  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.misSvc.listar(0, 100).subscribe({
      next: (page) => {
        this.reservas.set(page.content ?? []);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.loading.set(false);
        this.reservas.set([]);
        this.error.set(this.mensajeError(err));
      },
    });
  }

  private mensajeError(err: HttpErrorResponse & { friendlyMessage?: string }): string {
    if (err.status === 403) return 'No tienes permiso para ver estas reservas.';
    if (err.status === 404) return 'El servicio de reservas no está disponible.';
    return err.friendlyMessage ?? 'No se pudieron cargar tus reservas.';
  }

  // ── Computed ───────────────────────────────────────────────────────────────

  readonly misReservas = computed(() => this.reservas());

  readonly activasCount = computed(() =>
    this.misReservas().filter(r =>
      r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA' || r.estado === 'CHECK_IN'
    ).length
  );

  /** Fecha de hoy en zona local (no UTC), formato YYYY-MM-DD para comparar contra fechas del backend. */
  private readonly hoy = ((d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  )(new Date());

  // "Llegadas hoy" usa el flag del backend (calculado con la zona horaria del hotel), no un cálculo propio.
  readonly todayCheckIns  = computed(() => this.misReservas().filter(r => r.llegadaHoy).length);
  readonly todayCheckOuts = computed(() => this.misReservas().filter(r => r.fechaFin === this.hoy && r.estado === 'CHECK_IN').length);

  readonly reservasFiltradas = computed(() => {
    const filtro = this.filtroActivo();
    const lista  = this.misReservas();
    if (filtro === 'todas')   return lista;
    if (filtro === 'activas') return lista.filter(r => r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA' || r.estado === 'CHECK_IN');
    return lista.filter(r => r.estado === filtro);
  });

  readonly filtros: Array<{ value: FiltroMisReservas; label: string; count: () => number }> = [
    { value: 'todas',      label: 'Todas',      count: () => this.misReservas().length },
    { value: 'activas',    label: 'Activas',    count: () => this.activasCount() },
    { value: 'PENDIENTE',  label: 'Pendiente',  count: () => this.misReservas().filter(r => r.estado === 'PENDIENTE').length },
    { value: 'CONFIRMADA', label: 'Confirmada', count: () => this.misReservas().filter(r => r.estado === 'CONFIRMADA').length },
    { value: 'CHECK_IN',   label: 'Check-in',   count: () => this.misReservas().filter(r => r.estado === 'CHECK_IN').length },
    { value: 'CANCELADA',  label: 'Cancelada',  count: () => this.misReservas().filter(r => r.estado === 'CANCELADA').length },
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────

  huespedPrincipal(r: Reserva): string {
    // El listado liviano trae huespedes vacío; usamos el titular de la reserva.
    return r.huespedes.find(h => h.esPrincipal)?.nombreCompleto
        ?? r.huespedes.at(0)?.nombreCompleto
        ?? r.usuarioNombre
        ?? '—';
  }

  huespedDoc(r: Reserva): string {
    return r.huespedes.find(h => h.esPrincipal)?.numeroDocumento
        ?? r.huespedes.at(0)?.numeroDocumento
        ?? '';
  }

  calcNoches(r: Reserva): number {
    const ms = new Date(r.fechaFin).getTime() - new Date(r.fechaInicio).getTime();
    return Math.max(0, Math.round(ms / 86_400_000));
  }

  formatFecha(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  esHoy(fecha: string): boolean { return fecha === this.hoy; }

  puedeCancelar(estado: EstadoReserva): boolean {
    return estado !== 'CANCELADA' && estado !== 'CHECK_OUT' && estado !== 'NO_SHOW';
  }

  estadoBadge(e: EstadoReserva): string  { return ESTADO_CFG[e].badge; }
  estadoDot(e: EstadoReserva): string    { return ESTADO_CFG[e].dot;   }
  estadoLabel(e: EstadoReserva): string  { return ESTADO_CFG[e].label; }
  estadoBar(e: EstadoReserva): string    { return ESTADO_CFG[e].bar;   }

  // ── Acciones ───────────────────────────────────────────────────────────────

  abrirDetalle(r: Reserva): void {
    // El listado trae habitaciones/huespedes vacíos: pedimos el detalle completo.
    this.reservaDetalle.set(null);
    this.reservaIdDetalle.set(r.reservaId);
    this.detailLoading.set(true);
    this.detailAbierto.set(true);
    this.misSvc.obtenerDetalle(r.reservaId).subscribe({
      next: (detalle) => {
        this.reservaDetalle.set(detalle);
        this.detailLoading.set(false);
      },
      error: () => {
        // El interceptor ya muestra el toast (403 si no es propia, 404 si no existe).
        this.detailLoading.set(false);
        this.detailAbierto.set(false);
      },
    });
  }

  iniciarCancelacion(r: Reserva): void {
    this.reservaACancelar.set(r);
    this.cancelarAbierto.set(true);
  }

  iniciarCancelacionById(id: number): void {
    this.detailAbierto.set(false);
    const r = this.reservas().find((x) => x.reservaId === id);
    if (r) this.iniciarCancelacion(r);
  }

  confirmarCancelacion(payload: CancelarReservaPayload): void {
    const r = this.reservaACancelar();
    if (!r) return;
    this.misSvc.cancelar(r.reservaId, payload.motivo ?? '').subscribe({
      next: () => {
        this.cancelarAbierto.set(false);
        this.reservaACancelar.set(null);
        this.toastr.success('Reserva cancelada.');
        this.cargar();
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.toastr.error(err.friendlyMessage ?? 'No se pudo cancelar la reserva.', 'Error');
      },
    });
  }

  // ── Crear reserva ────────────────────────────────────────────────────────────

  abrirNuevaReserva(): void {
    this.formAbierto.set(true);
  }

  guardarReserva(event: ReservaFormSaveEvent): void {
    this.misSvc.crear(event.payload as CreateReservaPayload).subscribe({
      next: (creada) => {
        this.formAbierto.set(false);
        this.toastr.success(`Reserva ${creada.codReserva} creada.`);
        this.cargar();
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.toastr.error(err.friendlyMessage ?? 'No se pudo crear la reserva.', 'Error');
      },
    });
  }
}
