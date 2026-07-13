import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

/** Coincide con ExportFormat del backend (/reportes). */
export type ExportMenuFormat = 'PDF' | 'EXCEL' | 'CSV';

const OPCIONES: ReadonlyArray<{ formato: ExportMenuFormat; tag: string; label: string }> = [
  { formato: 'PDF', tag: 'PDF', label: 'Documento PDF' },
  { formato: 'EXCEL', tag: 'XLSX', label: 'Excel' },
  { formato: 'CSV', tag: 'CSV', label: 'CSV' },
];

/**
 * Botón "Exportar" con menú de formato. Cada selección emite UNA vez y cierra:
 * una acción de exportar = una descarga.
 */
@Component({
  selector: 'ui-export-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative inline-block text-left">
      <button
        type="button"
        [disabled]="loading()"
        [title]="tooltip()"
        (click)="abierto.set(!abierto())"
        class="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--color-primary-500,#C5A048)]
               bg-white text-sm font-semibold text-[var(--color-primary-700,#8E6F2E)] shadow-sm
               hover:bg-[var(--color-primary-500,#C5A048)] hover:text-white transition-colors
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
               focus-visible:ring-[var(--color-primary-500,#C5A048)]
               disabled:opacity-60 disabled:cursor-not-allowed">
        @if (loading()) {
          <span class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          Exportando…
        } @else {
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {{ label() }}
          <svg class="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        }
      </button>

      @if (abierto()) {
        <div
          class="absolute right-0 z-20 mt-1.5 w-44 rounded-xl border border-[var(--color-border-soft,#EEE3D1)]
                 bg-white shadow-xl py-1.5 overflow-hidden"
          role="menu">
          @for (op of opciones; track op.formato) {
            <button
              type="button"
              role="menuitem"
              (click)="elegir(op.formato)"
              class="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm font-medium
                     text-[var(--color-ink,#2D2926)]
                     hover:bg-[var(--color-primary-500,#C5A048)]/10
                     hover:text-[var(--color-primary-700,#8E6F2E)] transition-colors">
              <span class="text-[10px] font-bold w-9 text-center px-1 py-0.5 rounded border
                           border-current opacity-70">{{ op.tag }}</span>
              {{ op.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class UiExportMenuComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly label = input('Exportar');
  readonly tooltip = input('');
  readonly loading = input(false);
  readonly exportar = output<ExportMenuFormat>();

  readonly abierto = signal(false);
  readonly opciones = OPCIONES;

  elegir(formato: ExportMenuFormat): void {
    this.abierto.set(false);
    this.exportar.emit(formato);
  }

  @HostListener('document:click', ['$event'])
  cerrarSiClickAfuera(event: MouseEvent): void {
    if (this.abierto() && !this.host.nativeElement.contains(event.target as Node)) {
      this.abierto.set(false);
    }
  }
}
