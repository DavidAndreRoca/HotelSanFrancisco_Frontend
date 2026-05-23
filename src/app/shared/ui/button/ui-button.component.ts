import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading() || null"
      [class]="classes()">
      @if (loading()) {
        <span
          class="inline-block w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin"
          aria-hidden="true"></span>
      }
      <ng-content />
    </button>
  `,
})
export class UiButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<ButtonType>('button');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly block = input<boolean>(false);

  readonly classes = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-500)] disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const sizes: Record<ButtonSize, string> = {
      sm: 'h-9 px-3 text-[13px]',
      md: 'h-11 px-5 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] active:bg-[var(--color-primary-700)] shadow-sm',
      secondary:
        'bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-soft)] active:bg-black',
      ghost:
        'bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-border-soft)]',
      outline:
        'bg-transparent text-[var(--color-ink)] border border-[var(--color-border-soft)] hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-700)]',
      danger:
        'bg-[var(--color-danger-500)] text-white hover:opacity-90',
    };

    return [base, sizes[this.size()], variants[this.variant()], this.block() ? 'w-full' : '']
      .filter(Boolean)
      .join(' ');
  });
}
