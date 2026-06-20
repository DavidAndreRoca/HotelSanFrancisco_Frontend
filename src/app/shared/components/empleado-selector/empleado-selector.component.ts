import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  UsuarioLookupService,
  UsuarioResumen,
} from '../../../core/usuarios/usuario-lookup.service';

/**
 * Autocomplete reutilizable de empleados activos. Encapsula la búsqueda con
 * debounce contra UsuarioLookupService. Emite el usuario seleccionado.
 */
@Component({
  selector: 'app-empleado-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="relative">
      @if (seleccionado(); as u) {
        <div class="flex items-center justify-between gap-2 h-10 px-3 rounded-lg
                    border border-[#C5A048] bg-[#C5A048]/5">
          <span class="text-sm text-[#2D2926] truncate">
            {{ u.nombreCompleto }}
            <span class="text-[#2D2926]/45">· {{ u.rolNombre }}</span>
          </span>
          <button type="button" (click)="limpiar()"
            class="text-[#2D2926]/45 hover:text-[#2D2926] text-lg leading-none shrink-0"
            aria-label="Quitar empleado">×</button>
        </div>
      } @else {
        <input
          type="text"
          [ngModel]="busqueda()"
          (ngModelChange)="onBuscar($event)"
          [placeholder]="placeholder()"
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
              @for (u of resultados(); track u.usuarioId) {
                <li>
                  <button type="button" (click)="elegir(u)"
                    class="w-full text-left px-3 py-2 hover:bg-[#F9F5F0] transition-colors">
                    <span class="text-sm text-[#2D2926]">{{ u.nombreCompleto }}</span>
                    <span class="block text-[11px] text-[#2D2926]/45">
                      {{ u.rolNombre }} · {{ u.correo }}
                    </span>
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
export class EmpleadoSelectorComponent {
  private readonly usuarios = inject(UsuarioLookupService);

  readonly placeholder = input<string>('Buscar empleado por nombre…');
  readonly seleccionado = signal<UsuarioResumen | null>(null);
  readonly elegido = output<UsuarioResumen | null>();

  readonly busqueda = signal('');
  readonly resultados = signal<UsuarioResumen[]>([]);
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
            return of<UsuarioResumen[]>([]);
          }
          this.buscando.set(true);
          return this.usuarios.buscarEmpleadosActivos(q);
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (lista) => {
          this.resultados.set(lista);
          this.buscando.set(false);
        },
        error: () => {
          this.resultados.set([]);
          this.buscando.set(false);
        },
      });
  }

  onBuscar(texto: string): void {
    this.busqueda.set(texto);
    this.busqueda$.next(texto);
  }

  elegir(u: UsuarioResumen): void {
    this.seleccionado.set(u);
    this.resultados.set([]);
    this.busqueda.set('');
    this.elegido.emit(u);
  }

  limpiar(): void {
    this.seleccionado.set(null);
    this.resultados.set([]);
    this.busqueda.set('');
    this.elegido.emit(null);
  }

  /** Permite al padre resetear el selector (p.ej. al cerrar un modal). */
  reset(): void {
    this.limpiar();
  }
}
