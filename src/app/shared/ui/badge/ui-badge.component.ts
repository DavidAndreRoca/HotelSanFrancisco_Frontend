import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

@Component({
  selector: 'ui-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="classes()"><ng-content /></span>`,
})
export class UiBadgeComponent {
  readonly tone = input<BadgeTone>('neutral');

  readonly classes = computed(() => {
    const base =
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap';
    const tones: Record<BadgeTone, string> = {
      neutral: 'bg-[var(--color-border-soft)] text-[var(--color-ink-soft)]',
      success: 'bg-[var(--color-success-500)]/10 text-[var(--color-success-500)]',
      warning: 'bg-[var(--color-warning-500)]/15 text-[var(--color-warning-500)]',
      danger: 'bg-[var(--color-danger-500)]/10 text-[var(--color-danger-500)]',
      info: 'bg-[var(--color-info-500)]/10 text-[var(--color-info-500)]',
      primary: 'bg-[var(--color-primary-500)]/15 text-[var(--color-primary-700)]',
    };
    return `${base} ${tones[this.tone()]}`;
  });
}
