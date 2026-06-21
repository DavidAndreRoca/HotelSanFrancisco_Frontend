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
  ClienteLookupService,
  ClienteResumen,
} from '../../../core/clientes/cliente-lookup.service';

/** Autocomplete de clientes/huéspedes por nombre. Emite null al limpiar. */
@Component({
  selector: 'app-cliente-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="relative">
      @if (seleccionado(); as c) {
        <div class="flex items-center justify-between gap-2 h-10 px-3 rounded-lg
                    border border-[#C5A048] bg-[#C5A048]/5">
          <span class="text-sm text-[#2D2926] truncate">
            {{ c.nombreCompleto }}
            <span class="text-[#2D2926]/45">· {{ c.numeroDocumento }}</span>
          </span>
          <button type="button" (click)="limpiar()"
            class="text-[#2D2926]/45 hover:text-[#2D2926] text-lg leading-none shrink-0"
            aria-label="Quitar huésped">×</button>
        </div>
      } @else {
        <input
          type="text"
          [ngModel]="busqueda()"
          (ngModelChange)="onBuscar($event)"
          placeholder="Buscar huésped por nombre…"
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
              @for (c of resultados(); track c.huespedId) {
                <li>
                  <button type="button" (click)="elegir(c)"
                    class="w-full text-left px-3 py-2 hover:bg-[#F9F5F0] transition-colors">
                    <span class="text-sm text-[#2D2926]">{{ c.nombreCompleto }}</span>
                    <span class="block text-[11px] text-[#2D2926]/45">{{ c.numeroDocumento }}</span>
                  </button>
                </li>
              }
            }
          </ul>
        }
      }
    </div>
  `,
})
export class ClienteSelectorComponent {
  private readonly clientes = inject(ClienteLookupService);

  readonly seleccionado = signal<ClienteResumen | null>(null);
  readonly elegido = output<ClienteResumen | null>();

  readonly busqueda = signal('');
  readonly resultados = signal<ClienteResumen[]>([]);
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
            return of<ClienteResumen[]>([]);
          }
          this.buscando.set(true);
          return this.clientes.buscarPorNombre(q);
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

  elegir(c: ClienteResumen): void {
    this.seleccionado.set(c);
    this.resultados.set([]);
    this.busqueda.set('');
    this.elegido.emit(c);
  }

  limpiar(): void {
    this.seleccionado.set(null);
    this.resultados.set([]);
    this.busqueda.set('');
    this.elegido.emit(null);
  }
}
