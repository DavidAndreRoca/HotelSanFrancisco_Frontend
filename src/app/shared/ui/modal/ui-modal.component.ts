import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';

// Usa <dialog> nativo (showModal): focus-trap, cierre con Escape y
// restauración del foco al elemento que abrió el modal vienen gratis
// del navegador, sin JS propio.
@Component({
  selector: 'ui-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    dialog::backdrop {
      background: rgb(28 25 23 / 0.45);
      backdrop-filter: blur(4px);
    }
  `,
  template: `
    <dialog
      #dlg
      [class]="dialogClasses()"
      [attr.aria-label]="title()"
      (cancel)="onCancel($event)"
      (click)="onDialogClick($event)"
    >
      <header
        class="flex items-start justify-between gap-4 px-6 py-5 border-b border-[var(--color-border-soft)]"
      >
        <div>
          <h2 class="text-lg font-semibold tracking-tight">{{ title() }}</h2>
          @if (subtitle()) {
            <p class="text-[13px] text-[var(--color-ink-muted)] mt-1">{{ subtitle() }}</p>
          }
        </div>
        <button
          type="button"
          class="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] text-xl leading-none p-1"
          (click)="closed.emit()"
          aria-label="Cerrar diálogo"
        >
          ×
        </button>
      </header>
      <div class="px-6 py-5">
        <ng-content />
      </div>
      <footer
        class="px-6 py-4 border-t border-[var(--color-border-soft)] bg-[var(--color-surface)]/50 rounded-b-2xl flex justify-end gap-2"
      >
        <ng-content select="[modal-footer]" />
      </footer>
    </dialog>
  `,
})
export class UiModalComponent {
  readonly open = input.required<boolean>();
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closed = output<void>();

  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    effect(() => {
      const el = this.dlg().nativeElement;
      if (this.open() && !el.open) {
        el.showModal();
      } else if (!this.open() && el.open) {
        el.close();
      }
    });
  }

  readonly dialogClasses = computed(() => {
    const widths = {
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
    };
    return `m-auto w-full ${widths[this.size()]} max-h-[90dvh] overflow-y-auto p-0 bg-white rounded-2xl shadow-[var(--shadow-elevated)] border border-[var(--color-border-soft)] animate-fade-in`;
  });

  /** Escape: el navegador dispara `cancel`; delegamos el cierre al padre. */
  onCancel(event: Event): void {
    event.preventDefault();
    this.closed.emit();
  }

  /** Un click cuyo target es el propio <dialog> cae en el ::backdrop. */
  onDialogClick(event: MouseEvent): void {
    if (event.target === this.dlg().nativeElement && this.closeOnBackdrop()) {
      this.closed.emit();
    }
  }
}
