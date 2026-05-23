import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="skeleton block"
      [style.width]="width()"
      [style.height]="height()"
      [style.borderRadius]="radius()"
      aria-hidden="true"></span>
  `,
})
export class UiSkeletonComponent {
  readonly width = input<string>('100%');
  readonly height = input<string>('1rem');
  readonly radius = input<string>('0.5rem');
}
