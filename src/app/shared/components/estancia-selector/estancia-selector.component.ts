import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import {
  EstanciaLookupService,
  ReservaCheckIn,
} from '../../../core/estancias/estancia-lookup.service';

/**
 * Selecciona una estancia activa eligiendo una reserva con CHECK_IN.
 * Como el listado no trae `estanciaId`, al elegir se resuelve con el detalle.
 * Emite el estanciaId resuelto (o null si la reserva aún no tiene estancia).
 */
@Component({
  selector: 'app-estancia-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="relative">
      @if (seleccionada(); as r) {
        <div class="flex items-center justify-between gap-2 h-10 px-3 rounded-lg
                    border border-[#C5A048] bg-[#C5A048]/5">
          <span class="text-sm text-[#2D2926] truncate">
            {{ r.codReserva }} · {{ r.huespedNombre }}
            @if (r.habitaciones) { <span class="text-[#2D2926]/45">· Hab. {{ r.habitaciones }}</span> }
            @if (resolviendo()) { <span class="text-[#2D2926]/45"> · resolviendo…</span> }
            @else if (estanciaId() != null) { <span class="text-[#C5A048]"> · estancia #{{ estanciaId() }}</span> }
          </span>
          <button type="button" (click)="limpiar()"
            class="text-[#2D2926]/45 hover:text-[#2D2926] text-lg leading-none shrink-0"
            aria-label="Quitar estancia">×</button>
        </div>
        @if (!resolviendo() && estanciaId() == null) {
          <p class="text-[11px] text-red-500 mt-1">
            Esta reserva no tiene una estancia activa todavía.
          </p>
        }
      } @else {
        <input type="text" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)"
          placeholder="Buscar reserva CHECK_IN por código o huésped…"
          autocomplete="off"
          class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                 text-[#2D2926] placeholder:text-[#2D2926]/35
                 focus:outline-none focus:border-[#C5A048]" />

        @if (cargando()) {
          <p class="text-[11px] text-[#2D2926]/45 mt-1">Cargando reservas activas…</p>
        } @else if (filtradas().length > 0) {
          <ul class="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#EEE3D1]
                     rounded-lg shadow-lg max-h-52 overflow-y-auto">
            @for (r of filtradas(); track r.reservaId) {
              <li>
                <button type="button" (click)="elegir(r)"
                  class="w-full text-left px-3 py-2 hover:bg-[#F9F5F0] transition-colors">
                  <span class="text-sm text-[#2D2926] font-mono">{{ r.codReserva }}</span>
                  <span class="block text-[11px] text-[#2D2926]/45">
                    {{ r.huespedNombre }} @if (r.habitaciones) { · Hab. {{ r.habitaciones }} }
                  </span>
                </button>
              </li>
            }
          </ul>
        } @else if (busqueda().trim()) {
          <p class="text-[11px] text-[#2D2926]/45 mt-1">Sin reservas CHECK_IN que coincidan.</p>
        }
      }
    </div>
  `,
})
export class EstanciaSelectorComponent {
  private readonly lookup = inject(EstanciaLookupService);

  readonly estanciaElegida = output<number | null>();

  readonly busqueda = signal('');
  readonly reservas = signal<ReservaCheckIn[]>([]);
  readonly cargando = signal(true);
  readonly seleccionada = signal<ReservaCheckIn | null>(null);
  readonly estanciaId = signal<number | null>(null);
  readonly resolviendo = signal(false);

  readonly filtradas = computed(() => {
    const t = this.busqueda().trim().toLowerCase();
    if (!t) return [];
    return this.reservas().filter(
      (r) =>
        r.codReserva.toLowerCase().includes(t) ||
        r.huespedNombre.toLowerCase().includes(t),
    );
  });

  constructor() {
    this.lookup
      .buscarReservasCheckIn()
      .pipe(catchError(() => of([] as ReservaCheckIn[])))
      .subscribe((rs) => {
        this.reservas.set(rs);
        this.cargando.set(false);
      });
  }

  elegir(r: ReservaCheckIn): void {
    this.seleccionada.set(r);
    this.busqueda.set('');

    if (r.estanciaId != null) {
      this.estanciaId.set(r.estanciaId);
      this.estanciaElegida.emit(r.estanciaId);
      return;
    }
    // El listado no trae estanciaId → resolver con el detalle
    this.resolviendo.set(true);
    this.estanciaId.set(null);
    this.estanciaElegida.emit(null);
    this.lookup
      .resolverEstanciaId(r.reservaId)
      .pipe(catchError(() => of(null)))
      .subscribe((id) => {
        this.resolviendo.set(false);
        this.estanciaId.set(id);
        this.estanciaElegida.emit(id);
      });
  }

  limpiar(): void {
    this.seleccionada.set(null);
    this.estanciaId.set(null);
    this.busqueda.set('');
    this.estanciaElegida.emit(null);
  }
}
