import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'ui-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-ink)]/45 backdrop-blur-sm animate-fade-in"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
        (click)="onBackdrop()">
        <div
          [class]="dialogClasses()"
          (click)="$event.stopPropagation()">
          <header class="flex items-start justify-between gap-4 px-6 py-5 border-b border-[var(--color-border-soft)]">
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
              aria-label="Cerrar diálogo">×</button>
          </header>
          <div class="px-6 py-5">
            <ng-content />
          </div>
          <footer class="px-6 py-4 border-t border-[var(--color-border-soft)] bg-[var(--color-surface)]/50 rounded-b-2xl flex justify-end gap-2">
            <ng-content select="[modal-footer]" />
          </footer>
        </div>
      </div>
    }
  `,
})
export class UiModalComponent {
  readonly open = input.required<boolean>();
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closed = output<void>();

  readonly dialogClasses = computed(() => {
    const widths = {
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
    };
    return `w-full ${widths[this.size()]} bg-white rounded-2xl shadow-[var(--shadow-elevated)] border border-[var(--color-border-soft)] overflow-hidden`;
  });

  onBackdrop(): void {
    if (this.closeOnBackdrop()) this.closed.emit();
  }
}
