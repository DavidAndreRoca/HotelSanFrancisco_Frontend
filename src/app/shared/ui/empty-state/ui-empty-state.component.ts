import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-white/60"
      role="status">
      <div
        class="w-14 h-14 rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-700)] flex items-center justify-center text-xl mb-4"
        aria-hidden="true">
        {{ icon() }}
      </div>
      <h3 class="text-base font-semibold mb-1">{{ title() }}</h3>
      @if (description()) {
        <p class="text-sm text-[var(--color-ink-muted)] max-w-md">{{ description() }}</p>
      }
      <div class="mt-5">
        <ng-content />
      </div>
    </div>
  `,
})
export class UiEmptyStateComponent {
  readonly icon = input<string>('✦');
  readonly title = input.required<string>();
  readonly description = input<string>('');
}
