import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ApiClient } from '../../../../core/http/http-client.service';

interface PagoClienteItem {
  pagoId: number | null;
  reservaId: number;
  codReserva: string;
  habitacion: string;
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO';
  fecha: string;
  metodoPago: string | null;
  monto: number;
  facturaUrl: string | null;
  tipoPago: string | null;
}

// Filas compactas (~64px); 7 por página llena bien sin desbordar la pantalla.
const PAGE_SIZE_PAGADOS = 7;

@Component({
  selector: 'app-pagos-factura-cliente',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-8">

      <!-- Título -->
      <h1 class="text-2xl font-bold text-[#2D2926]">Pagos y facturas</h1>

      <!-- ── Stat cards ─────────────────────────────────────────────────── -->
      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          @for (_ of [1, 2, 3]; track $index) {
            <div class="bg-white rounded-2xl border border-[#EEE3D1] h-36 animate-pulse"></div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">

          <!-- Total facturado -->
          <div class="bg-white rounded-2xl border border-[#EEE3D1] p-6
                      flex flex-col items-center gap-2 text-center">
            <svg class="w-9 h-9 text-[#C5A048]" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3
                       3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
            <p class="text-2xl font-bold text-[#2D2926]">
              {{ formatMonto(stats().totalFacturado) }}
            </p>
            <p class="text-sm text-[#2D2926]/50">Total facturado</p>
          </div>

          <!-- Total pagado -->
          <div class="bg-white rounded-2xl border border-[#EEE3D1] p-6
                      flex flex-col items-center gap-2 text-center">
            <svg class="w-9 h-9 text-emerald-500" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-2xl font-bold text-emerald-500">
              {{ formatMonto(stats().totalPagado) }}
            </p>
            <p class="text-sm text-[#2D2926]/50">Total pagado</p>
          </div>

          <!-- Pendiente -->
          <div class="bg-white rounded-2xl border border-[#EEE3D1] p-6
                      flex flex-col items-center gap-2 text-center">
            <svg class="w-9 h-9 text-[#C5A048]" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-2xl font-bold text-[#2D2926]">
              {{ formatMonto(stats().totalPendiente) }}
            </p>
            <p class="text-sm text-[#2D2926]/50">Pendiente</p>
          </div>

        </div>
      }

      <!-- ── Historial de pagos ──────────────────────────────────────────── -->
      <div>
        <h2 class="text-xl font-bold text-[#2D2926] mb-4">Historial de pagos</h2>

        @if (loading()) {
          <div class="bg-white rounded-2xl border border-[#EEE3D1] p-6 space-y-3">
            @for (_ of [1, 2, 3, 4]; track $index) {
              <div class="h-14 bg-[#EEE3D1] rounded-xl animate-pulse"></div>
            }
          </div>
        } @else {
          <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden">

            <!-- Tab "Pendientes" -->
            <div class="px-5 pt-4">
              <span class="inline-block text-sm font-semibold text-[#2D2926]
                           pb-2 border-b-2 border-[#C5A048]">
                Pendientes ({{ pendientes().length }})
              </span>
              <div class="border-b border-[#EEE3D1] -mt-px"></div>
            </div>

            <!-- Filas pendientes -->
            <div class="divide-y divide-[#EEE3D1]">
              @for (p of pendientes(); track p.codReserva) {
                <div class="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5">
                  <div class="flex items-center gap-4 flex-1 min-w-0">
                    <div class="w-9 h-9 rounded-lg bg-[#F9F5F0] flex items-center justify-center shrink-0">
                      <svg class="w-5 h-5 text-[#C5A048]" fill="none" viewBox="0 0 24 24"
                           stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343
                                 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0
                                 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-sm font-semibold text-[#2D2926]">{{ p.habitacion }}</span>
                        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                                     bg-amber-100 text-amber-800">
                          Pendiente
                        </span>
                      </div>
                      <p class="text-xs text-[#2D2926]/50 mt-0.5">
                        {{ p.codReserva }} · {{ formatFecha(p.fecha) }} - Pendiente
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:flex-shrink-0 pl-[52px] sm:pl-0">
                    <button
                      type="button"
                      (click)="verReserva(p.reservaId)"
                      class="h-8 px-3 rounded-lg border border-[#C5A048] text-[#C5A048]
                             text-xs font-medium hover:bg-[#C5A048]/5 transition-colors whitespace-nowrap">
                      Ver detalles reserva
                    </button>
                    <button
                      type="button"
                      (click)="pagar(p)"
                      class="h-8 px-4 rounded-lg bg-[#C5A048] text-white text-xs font-medium
                             hover:bg-[#8E6F2E] transition-colors">
                      Pagar
                    </button>
                    <span class="text-sm font-bold text-[#2D2926] text-right min-w-[56px] ml-auto sm:ml-0">
                      {{ formatMonto(p.monto) }}
                    </span>
                  </div>
                </div>
              }

              @if (pendientes().length === 0) {
                <p class="px-5 py-8 text-center text-sm text-[#2D2926]/40">
                  Sin pagos pendientes.
                </p>
              }
            </div>

            <!-- Separador -->
            <div class="h-px bg-[#EEE3D1] mx-5 my-1"></div>

            <!-- Filas pagadas -->
            <div class="divide-y divide-[#EEE3D1]">
              @for (p of pagadosPagina(); track p.codReserva) {
                <div class="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5">
                  <div class="flex items-center gap-4 flex-1 min-w-0">
                    <div class="w-9 h-9 rounded-lg bg-[#F9F5F0] flex items-center justify-center shrink-0">
                      <svg class="w-5 h-5 text-[#C5A048]" fill="none" viewBox="0 0 24 24"
                           stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343
                                 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0
                                 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-sm font-semibold text-[#2D2926]">{{ p.habitacion }}</span>
                        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                                     bg-emerald-100 text-emerald-700">
                          Pagado
                        </span>
                      </div>
                      <p class="text-xs text-[#2D2926]/50 mt-0.5">
                        {{ p.codReserva }} · {{ formatFecha(p.fecha) }}
                        @if (p.metodoPago) { - {{ p.metodoPago }} }
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 sm:flex-shrink-0 pl-[52px] sm:pl-0">
                    <button
                      type="button"
                      (click)="verReserva(p.reservaId)"
                      class="h-8 px-3 rounded-lg border border-[#C5A048] text-[#C5A048]
                             text-xs font-medium hover:bg-[#C5A048]/5 transition-colors whitespace-nowrap">
                      Ver detalles reserva
                    </button>
                    <div class="text-right ml-auto sm:ml-0">
                      <p class="text-sm font-bold text-[#2D2926]">{{ formatMonto(p.monto) }}</p>
                      <button
                        type="button"
                        (click)="descargarFactura(p)"
                        class="flex items-center gap-1 text-[11px] text-[#C5A048]
                               hover:underline mt-0.5 ml-auto">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0
                                   0l-4-4m4 4V4"/>
                        </svg>
                        Factura
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Paginación (solo del historial de pagados) -->
            @if (totalPagadosPages() > 1) {
              <div class="flex items-center justify-between gap-3 px-5 py-3 border-t border-[#EEE3D1]">
                <p class="text-xs text-[#2D2926]/50">
                  {{ pagados().length }} pago(s) · Página {{ pageIndex() + 1 }} de {{ totalPagadosPages() }}
                </p>
                <div class="flex items-center gap-2">
                  <button type="button" (click)="paginaAnterior()" [disabled]="pageIndex() === 0"
                    class="h-8 px-3 rounded-lg border border-[#EEE3D1] text-xs font-medium
                           text-[#2D2926]/70 hover:bg-[#F9F5F0] disabled:opacity-40
                           disabled:cursor-not-allowed transition-colors">Anterior</button>
                  <button type="button" (click)="paginaSiguiente()" [disabled]="pageIndex() >= totalPagadosPages() - 1"
                    class="h-8 px-3 rounded-lg border border-[#EEE3D1] text-xs font-medium
                           text-[#2D2926]/70 hover:bg-[#F9F5F0] disabled:opacity-40
                           disabled:cursor-not-allowed transition-colors">Siguiente</button>
                </div>
              </div>
            }

          </div>
        }
      </div>

    </div>
  `,
})
export class PagosFacturasClientePage {
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  readonly loading = signal(true);
  readonly pagos = signal<PagoClienteItem[]>([]);

  readonly pendientes = computed(() =>
    this.pagos().filter((p) => p.estado === 'PENDIENTE'),
  );

  readonly pagados = computed(() =>
    this.pagos().filter((p) => p.estado === 'PAGADO'),
  );

  // ── Paginación del historial de pagados ──────────────────────────────
  readonly pageIndex = signal(0);

  readonly totalPagadosPages = computed(() =>
    Math.max(1, Math.ceil(this.pagados().length / PAGE_SIZE_PAGADOS)),
  );

  readonly pagadosPagina = computed(() => {
    const start = this.pageIndex() * PAGE_SIZE_PAGADOS;
    return this.pagados().slice(start, start + PAGE_SIZE_PAGADOS);
  });

  readonly stats = computed(() => {
    const all = this.pagos();
    return {
      totalFacturado: all.reduce((s, p) => s + p.monto, 0),
      totalPagado: all
        .filter((p) => p.estado === 'PAGADO')
        .reduce((s, p) => s + p.monto, 0),
      totalPendiente: all
        .filter((p) => p.estado === 'PENDIENTE')
        .reduce((s, p) => s + p.monto, 0),
    };
  });

  constructor() {
    this.load();
  }

  private load(): void {
    this.api
      .get<PagoClienteItem[]>('/api/v1/mis-pagos')
      .subscribe({
        next: (data) => {
          this.pagos.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.pagos.set([]);
          this.loading.set(false);
        },
      });
  }

  paginaAnterior(): void {
    if (this.pageIndex() === 0) return;
    this.pageIndex.update((p) => p - 1);
  }

  paginaSiguiente(): void {
    if (this.pageIndex() >= this.totalPagadosPages() - 1) return;
    this.pageIndex.update((p) => p + 1);
  }

  verReserva(reservaId: number): void {
    this.router.navigate(['/reservations', reservaId]);
  }

  pagar(p: PagoClienteItem): void {
    this.toastr.info(
      `Módulo de pago en línea próximamente disponible.`,
      'Próximamente',
    );
  }

  descargarFactura(p: PagoClienteItem): void {
    if (p.facturaUrl) {
      window.open(p.facturaUrl, '_blank');
    } else {
      this.toastr.info('Factura no disponible aún.', 'Sin factura');
    }
  }

  formatMonto(n: number): string {
    return 'S/. ' + n.toLocaleString('en-US');
  }

  formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
