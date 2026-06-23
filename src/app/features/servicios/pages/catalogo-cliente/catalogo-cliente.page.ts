import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { TipoServicioService } from '../../services/tipo-servicio.service';
import { ServicioCatalogoItem } from '../../models/servicio.model';
import { PedirServicioModalComponent } from '../../components/pedir-servicio-modal.component';

@Component({
  selector: 'app-catalogo-cliente',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PedirServicioModalComponent],
  template: `
    <div class="space-y-6">

      <!-- Cabecera -->
      <div>
        <h1 class="text-2xl font-bold text-[#2D2926]">Servicios del hotel</h1>
        <p class="text-sm text-[#2D2926]/55 mt-0.5">
          Pide servicios durante tu estadía. Revisa el estado en "Mis pedidos".
        </p>
      </div>

      <!-- Buscador -->
      @if (!loading() && !error() && servicios().length > 0) {
        <input
          type="text"
          [value]="q()"
          (input)="q.set($any($event.target).value)"
          placeholder="Buscar servicio…"
          class="w-full sm:max-w-sm h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                 text-[#2D2926] placeholder:text-[#2D2926]/35 focus:outline-none focus:border-[#C5A048]" />
      }

      <!-- Skeleton de carga -->
      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (_ of [1, 2, 3, 4, 5, 6]; track $index) {
            <div class="bg-white rounded-2xl border border-[#EEE3D1] h-40 animate-pulse"></div>
          }
        </div>

      <!-- Estado de error -->
      } @else if (error()) {
        <div class="bg-white rounded-2xl border border-[#EEE3D1] py-16 flex flex-col items-center gap-3">
          <div class="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <svg class="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667
                       1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34
                       16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <p class="text-sm font-semibold text-[#2D2926]">No se pudo cargar el catálogo</p>
          <p class="text-xs text-[#2D2926]/45">Inténtalo de nuevo en unos momentos.</p>
          <button type="button" (click)="cargar()"
            class="mt-1 h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                   hover:bg-[#8E6F2E] transition-colors">
            Reintentar
          </button>
        </div>

      <!-- Estado vacío -->
      } @else if (filtrados().length === 0) {
        <div class="bg-white rounded-2xl border border-[#EEE3D1] py-16 flex flex-col items-center gap-3">
          <div class="w-14 h-14 rounded-full bg-[#F9F5F0] flex items-center justify-center">
            <svg class="w-7 h-7 text-[#C5A048]/60" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13
                       21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
            </svg>
          </div>
          <p class="text-sm font-semibold text-[#2D2926]">Sin servicios</p>
          <p class="text-xs text-[#2D2926]/45">
            @if (q()) { No hay servicios que coincidan con tu búsqueda. }
            @else { Por ahora no hay servicios disponibles. }
          </p>
        </div>

      <!-- Grilla de servicios -->
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (s of filtrados(); track s.tipoServicioId) {
            <div class="bg-white rounded-2xl border border-[#EEE3D1] p-5 flex flex-col gap-3
                        hover:shadow-sm transition-shadow">
              <div class="flex items-start gap-3">
                <div class="w-11 h-11 rounded-xl bg-[#F9F5F0] flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-[#C5A048]" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915
                             c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674
                             c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888
                             c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888
                             c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-base font-semibold text-[#2D2926]">{{ s.nombre }}</p>
                  @if (s.descripcion) {
                    <p class="text-xs text-[#2D2926]/55 mt-1 leading-relaxed">{{ s.descripcion }}</p>
                  }
                </div>
              </div>

              <div class="mt-auto pt-3 border-t border-[#EEE3D1] flex items-center justify-between gap-2">
                <div class="leading-tight">
                  <span class="block text-[11px] text-[#2D2926]/50">Desde</span>
                  <span class="text-lg font-bold text-[#C5A048]">{{ formatMonto(s.costoBase) }}</span>
                </div>
                <button type="button" (click)="abrirPedir(s)"
                  class="h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                         hover:bg-[#8E6F2E] transition-colors">
                  Pedir
                </button>
              </div>
            </div>
          }
        </div>
      }

      <app-pedir-servicio-modal
        [open]="modalAbierto()"
        [servicio]="servicioSel()"
        (cerrar)="modalAbierto.set(false)"
        (pedidoCreado)="onPedidoCreado()" />

    </div>
  `,
})
export class CatalogoClientePage {
  private readonly svc = inject(TipoServicioService);

  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly servicios = signal<ServicioCatalogoItem[]>([]);
  readonly q = signal('');

  readonly modalAbierto = signal(false);
  readonly servicioSel = signal<ServicioCatalogoItem | null>(null);

  readonly filtrados = computed(() => {
    const term = this.q().trim().toLowerCase();
    const all = this.servicios();
    if (!term) return all;
    return all.filter(
      (s) =>
        s.nombre.toLowerCase().includes(term) ||
        (s.descripcion ?? '').toLowerCase().includes(term),
    );
  });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(false);
    this.svc.listarCatalogoCliente().subscribe({
      next: (data) => {
        this.servicios.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  abrirPedir(s: ServicioCatalogoItem): void {
    this.servicioSel.set(s);
    this.modalAbierto.set(true);
  }

  onPedidoCreado(): void {
    this.modalAbierto.set(false);
    // El pedido queda registrado; lleva al cliente a ver su estado.
    this.router.navigate(['/mis-pedidos']);
  }

  formatMonto(n: number): string {
    return 'S/. ' + n.toLocaleString('en-US');
  }
}
