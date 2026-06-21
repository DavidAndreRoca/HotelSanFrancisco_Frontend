import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ProductoLookupService,
  ProductoResumen,
} from '../../../core/productos/producto-lookup.service';

/**
 * Autocomplete de productos activos. Tras elegir, limpia el input para permitir
 * agregar varios productos seguidos (uso típico en líneas de venta).
 */
@Component({
  selector: 'app-producto-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="relative">
      <input
        type="text"
        [ngModel]="busqueda()"
        (ngModelChange)="onBuscar($event)"
        placeholder="Buscar producto por nombre…"
        autocomplete="off"
        class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
               text-[#2D2926] placeholder:text-[#2D2926]/35
               focus:outline-none focus:border-[#C5A048]" />

      @if (buscando() || resultados().length > 0) {
        <ul class="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#EEE3D1]
                   rounded-lg shadow-lg max-h-52 overflow-y-auto">
          @if (buscando()) {
            <li class="px-3 py-2 text-sm text-[#2D2926]/45">Buscando…</li>
          } @else {
            @for (p of resultados(); track p.productoId) {
              <li>
                <button type="button" (click)="elegir(p)"
                  class="w-full text-left px-3 py-2 hover:bg-[#F9F5F0] transition-colors flex items-center gap-2">
                  <span class="text-sm text-[#2D2926]">{{ p.nombre }}</span>
                  <span class="text-[11px] text-[#2D2926]/45 ml-auto">
                    S/. {{ p.precioVenta }} · stock {{ p.stockActual }}
                  </span>
                </button>
              </li>
            }
          }
        </ul>
      }
    </div>
  `,
})
export class ProductoSelectorComponent {
  private readonly productos = inject(ProductoLookupService);

  readonly elegido = output<ProductoResumen>();

  readonly busqueda = signal('');
  readonly resultados = signal<ProductoResumen[]>([]);
  readonly buscando = signal(false);
  private readonly busqueda$ = new Subject<string>();

  constructor() {
    this.busqueda$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) => {
          if (q.trim().length < 2) {
            this.buscando.set(false);
            return of<ProductoResumen[]>([]);
          }
          this.buscando.set(true);
          return this.productos.buscarActivos(q);
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (lista) => { this.resultados.set(lista); this.buscando.set(false); },
        error: () => { this.resultados.set([]); this.buscando.set(false); },
      });
  }

  onBuscar(texto: string): void {
    this.busqueda.set(texto);
    this.busqueda$.next(texto);
  }

  elegir(p: ProductoResumen): void {
    this.elegido.emit(p);
    this.resultados.set([]);
    this.busqueda.set('');
  }
}
