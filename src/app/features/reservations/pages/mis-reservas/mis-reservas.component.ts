import {
  Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, ViewChild
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthStore } from '../../../../core/auth/auth.store';
import { NiubizCheckoutService } from '../../../../core/pagos/niubiz-checkout.service';
import { MisReservasService } from '../../services/mis-reservas.service';
import { ReservationDetailComponent } from '../../components/reservation-detail/reservation-detail.component';
import { EditarAcompanantesModalComponent } from '../../components/editar-acompanantes-modal/editar-acompanantes-modal.component';
import { CancelarModalComponent } from '../../components/cancelar-modal/cancelar-modal.component';
import {
  ReservationFormComponent,
  ReservaFormSaveEvent,
} from '../../components/reservation-form/reservation-form.component';
import {
  Acompanante,
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
  imports: [DecimalPipe, ReservationDetailComponent, EditarAcompanantesModalComponent, CancelarModalComponent, ReservationFormComponent],
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
            (click)="setFiltro(f.value)">
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
          @if (misReservas().length === 0) {
            <p class="text-xs text-[#2D2926]/45 mt-1">Aún no tienes reservas. Usa "Reservar" para crear una.</p>
          } @else {
            <p class="text-xs text-[#2D2926]/45 mt-1">No hay reservas con el filtro seleccionado.</p>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (r of reservasPaginadas(); track r.reservaId) {
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
                  @if (r.saldoPendiente > 0) {
                    <p class="text-[11px] text-[#C5A048] font-semibold">
                      Saldo: S/ {{ r.saldoPendiente | number:'1.2-2' }}
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

      <!-- Paginación -->
      @if (totalPaginas() > 1) {
        <nav class="flex items-center justify-between pt-2">
          <p class="text-xs text-[#2D2926]/50">
            Página {{ paginaActual() + 1 }} de {{ totalPaginas() }}
            · {{ reservasFiltradas().length }} reservas
          </p>
          <div class="flex items-center gap-1">
            <button type="button"
              [disabled]="paginaActual() === 0"
              (click)="irAPagina(paginaActual() - 1)"
              class="h-8 w-8 flex items-center justify-center rounded-lg border border-[#EEE3D1]
                     text-[#8E6F2E] hover:border-[#C5A048] hover:text-[#C5A048] transition-colors
                     disabled:opacity-30 disabled:pointer-events-none">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>

            @for (p of paginas(); track $index) {
              @if (p === '...') {
                <span class="h-8 w-8 flex items-center justify-center text-xs text-[#2D2926]/40">…</span>
              } @else {
                <button type="button"
                  (click)="irAPagina(+p)"
                  class="h-8 w-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition-colors"
                  [class]="paginaActual() === p
                    ? 'bg-[#C5A048] border-[#C5A048] text-white'
                    : 'border-[#EEE3D1] text-[#2D2926] hover:border-[#C5A048] hover:text-[#C5A048]'">
                  {{ +p + 1 }}
                </button>
              }
            }

            <button type="button"
              [disabled]="paginaActual() === totalPaginas() - 1"
              (click)="irAPagina(paginaActual() + 1)"
              class="h-8 w-8 flex items-center justify-center rounded-lg border border-[#EEE3D1]
                     text-[#8E6F2E] hover:border-[#C5A048] hover:text-[#C5A048] transition-colors
                     disabled:opacity-30 disabled:pointer-events-none">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </nav>
      }

    </div>

    <!-- Modales -->
    <app-reservation-detail
      [isOpen]="detailAbierto()"
      [reservaId]="reservaIdDetalle()"
      [reservaData]="reservaDetalle()"
      [loading]="detailLoading()"
      [modoCliente]="true"
      (onClose)="detailAbierto.set(false)"
      (onEditarAcompanantes)="abrirEditarAcompanantes()"
      (onCancelar)="iniciarCancelacionById($event)" />

    <app-editar-acompanantes-modal
      [isOpen]="editarAcompAbierto()"
      [reserva]="reservaDetalle()"
      [saving]="savingAcomp()"
      (onClose)="editarAcompAbierto.set(false)"
      (onSave)="guardarAcompanantes($event)" />

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
export class MisReservasComponent implements OnInit {
  @ViewChild(ReservationFormComponent) formRef?: ReservationFormComponent;

  protected readonly auth   = inject(AuthStore);
  private  readonly misSvc  = inject(MisReservasService);
  private  readonly toastr  = inject(ToastrService);
  private  readonly route       = inject(ActivatedRoute);
  private  readonly router      = inject(Router);
  private  readonly checkoutSvc = inject(NiubizCheckoutService);

  readonly filtroActivo  = signal<FiltroMisReservas>('todas');
  readonly paginaActual  = signal(0);
  readonly tamanioPagina = 6;

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
  readonly editarAcompAbierto = signal(false);
  readonly savingAcomp        = signal(false);

  constructor() {
    this.cargar();
  }

  ngOnInit(): void {
    // Escuchar parámetros de retorno de Niubiz
    this.route.queryParams.subscribe(params => {
      const pagoStatus = params['pago'];        // 'exito', 'rechazado', 'error', 'timeout'
      const purchaseNumber = params['purchase']; // purchaseNumber (identificador de la transacción)
      const msg = params['msg'];                 // mensaje adicional (solo en rechazo o error)

      if (pagoStatus && purchaseNumber) {
        // Mostrar mensaje según el estado
        this.mostrarMensajeSegunEstado(pagoStatus, msg, purchaseNumber);

        // Si el pago fue exitoso, recargar la lista de reservas
        if (pagoStatus === 'exito') {
          this.cargar();
        }

        // Limpiar URL para no reprocesar al recargar
        this.router.navigate([], {
          queryParams: { pago: null, purchase: null, msg: null },
          queryParamsHandling: 'merge'
        });
      }
    });
  }

  private mostrarMensajeSegunEstado(estado: string, msg?: string, purchaseNumber?: string): void {
    switch (estado) {
      case 'exito':
        this.toastr.success(`Pago confirmado correctamente. N° operación: ${purchaseNumber}`);
        break;
      case 'rechazado':
        this.toastr.error(msg || 'El pago fue rechazado. Intenta nuevamente.');
        break;
      case 'error':
        this.toastr.error('Ocurrió un error al procesar el pago.');
        break;
      case 'timeout':
        this.toastr.warning('El tiempo de sesión de pago expiró.');
        break;
      default:
        this.toastr.info('Estado de pago desconocido.');
    }
  }

  private procesarRetornoPago(resultado: string, reservaId: number, msg?: string): void {
    if (resultado === 'exito') {
      this.toastr.success('El pago en línea se procesó correctamente.', 'Pago exitoso');
      this.cargar(); // Refrescar lista de reservas
      // Opcionalmente abrir el detalle para ver la reserva confirmada
      this.misSvc.obtenerDetalle(reservaId).subscribe({
        next: (reserva) => {
          this.reservaDetalle.set(reserva);
          this.reservaIdDetalle.set(reserva.reservaId);
          this.detailAbierto.set(true);
        },
        error: () => {
          this.toastr.error('El pago se procesó pero no se pudo cargar la confirmación de la reserva.');
        },
      });
      return;
    }
    if (resultado === 'rechazado') {
      this.toastr.warning(msg ?? 'El pago no fue autorizado. Puede intentar nuevamente.', 'Pago rechazado');
      return;
    }
    if (resultado === 'timeout') {
      this.toastr.info('El tiempo para completar el pago expiró. Intente nuevamente.');
      return;
    }
    if (resultado === 'error') {
      this.toastr.error('No se pudo verificar el resultado del pago. Revise la reserva.', 'Error de verificación');
    }
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

  readonly totalPaginas = computed(() =>
    Math.ceil(this.reservasFiltradas().length / this.tamanioPagina)
  );

  readonly reservasPaginadas = computed(() => {
    const inicio = this.paginaActual() * this.tamanioPagina;
    return this.reservasFiltradas().slice(inicio, inicio + this.tamanioPagina);
  });

  readonly paginas = computed(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const paginas: (number | '...')[] = [0];
    if (actual > 2) paginas.push('...');
    for (let i = Math.max(1, actual - 1); i <= Math.min(total - 2, actual + 1); i++) paginas.push(i);
    if (actual < total - 3) paginas.push('...');
    paginas.push(total - 1);
    return paginas;
  });

  readonly filtros: Array<{ value: FiltroMisReservas; label: string; count: () => number }> = [
    { value: 'todas',      label: 'Todas',      count: () => this.misReservas().length },
    { value: 'activas',    label: 'Activas',    count: () => this.activasCount() },
    { value: 'PENDIENTE',  label: 'Pendiente',  count: () => this.misReservas().filter(r => r.estado === 'PENDIENTE').length },
    { value: 'CONFIRMADA', label: 'Confirmada', count: () => this.misReservas().filter(r => r.estado === 'CONFIRMADA').length },
    { value: 'CHECK_IN',   label: 'Check-in',   count: () => this.misReservas().filter(r => r.estado === 'CHECK_IN').length },
    { value: 'CANCELADA',  label: 'Cancelada',  count: () => this.misReservas().filter(r => r.estado === 'CANCELADA').length },
  ];

  setFiltro(f: FiltroMisReservas): void {
    this.filtroActivo.set(f);
    this.paginaActual.set(0);
  }

  irAPagina(p: number): void {
    this.paginaActual.set(p);
  }

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
        // En lugar de simplemente cerrar, para clientes SIEMPRE se debe pagar con Niubiz
        this.iniciarPagoNiubiz(creada.reservaId, creada);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        if (this.formRef) this.formRef.enviandoPago.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo crear la reserva.', 'Error');
      },
    });
  }

  private iniciarPagoNiubiz(reservaId: number, reserva: Reserva): void {
    const principal = reserva.huespedes?.find(h => h.esPrincipal) || reserva.huespedes?.[0];
    this.checkoutSvc.crearSesion(reservaId).subscribe({
      next: async (sesion) => {
        try {
          // 'dashboard' como origen asegura que el callback vuelva a esta misma pantalla
          await this.checkoutSvc.abrirCheckout(sesion, 'dashboard', {
            nombres: principal?.nombre || '',
            apellidos: principal?.apellidoPaterno || '',
            correo: principal?.correo || undefined,
          });
        } catch (err: any) {
          if (this.formRef) this.formRef.enviandoPago.set(false);
          this.toastr.error(err.message || 'No se pudo abrir el checkout de Niubiz.');
        }
      },
      error: (err: any) => {
        if (this.formRef) this.formRef.enviandoPago.set(false);
        this.toastr.error(err.error?.message || 'No se pudo crear la sesión de pago de Niubiz.');
      }
    });
  }

  // ── Editar acompañantes ──────────────────────────────────────────────────────

  abrirEditarAcompanantes(): void {
    // Se abre sobre el detalle ya cargado (reservaDetalle); mantenemos el detalle
    // abierto detrás para volver a él tras guardar.
    if (this.reservaDetalle()) this.editarAcompAbierto.set(true);
  }

  guardarAcompanantes(acompanantes: Acompanante[]): void {
    const reserva = this.reservaDetalle();
    if (!reserva) return;
    this.savingAcomp.set(true);
    this.misSvc.actualizarAcompanantes(reserva.reservaId, acompanantes).subscribe({
      next: (actualizada) => {
        this.savingAcomp.set(false);
        this.editarAcompAbierto.set(false);
        // La respuesta trae la reserva con huespedes[] repoblado: refrescamos el detalle.
        this.reservaDetalle.set(actualizada);
        this.toastr.success('Acompañantes actualizados.');
        this.cargar();
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.savingAcomp.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudieron actualizar los acompañantes.', 'Error');
      },
    });
  }
}
