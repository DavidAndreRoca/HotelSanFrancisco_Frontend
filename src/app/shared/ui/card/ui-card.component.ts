import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      [class]="
        'bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] ' +
        (padding() === 'none' ? '' : padding() === 'sm' ? 'p-4' : 'p-6')
      "
      [attr.aria-label]="ariaLabel() || null">
      @if (title()) {
        <header class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold tracking-tight">{{ title() }}</h2>
            @if (subtitle()) {
              <p class="text-[13px] text-[var(--color-ink-muted)] mt-0.5">{{ subtitle() }}</p>
            }
          </div>
          <ng-content select="[card-actions]" />
        </header>
      }
      <ng-content />
    </section>
  `,
})
export class UiCardComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly padding = input<'none' | 'sm' | 'md'>('md');
  readonly ariaLabel = input<string>('');
}
