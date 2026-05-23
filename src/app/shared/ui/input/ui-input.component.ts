import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let inputCounter = 0;

@Component({
  selector: 'ui-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiInputComponent), multi: true },
  ],
  template: `
    <div class="flex flex-col gap-1.5 w-full">
      @if (label()) {
        <label [for]="id" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
          {{ label() }}
          @if (required()) { <span class="text-[var(--color-danger-500)]">*</span> }
        </label>
      }

      <div class="relative">
        <input
          [id]="id"
          [type]="type()"
          [placeholder]="placeholder()"
          [value]="value()"
          [disabled]="disabled()"
          [attr.autocomplete]="autocomplete()"
          [attr.aria-invalid]="invalid() || null"
          [attr.aria-describedby]="error() ? id + '-err' : null"
          (input)="onInput($event)"
          (blur)="onBlur()"
          [class]="inputClasses()" />
      </div>

      @if (error()) {
        <p [id]="id + '-err'" class="text-xs text-[var(--color-danger-500)]" role="alert">
          {{ error() }}
        </p>
      } @else if (hint()) {
        <p class="text-xs text-[var(--color-ink-muted)]">{{ hint() }}</p>
      }
    </div>
  `,
})
export class UiInputComponent implements ControlValueAccessor {
  readonly id = `ui-input-${++inputCounter}`;

  readonly label = input<string>('');
  readonly type = input<string>('text');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly required = input<boolean>(false);
  readonly autocomplete = input<string>('off');
  readonly invalid = input<boolean>(false);

  protected readonly value = signal<string>('');
  protected readonly disabled = signal<boolean>(false);

  readonly inputClasses = computed(() => {
    const base =
      'w-full h-11 px-3.5 rounded-lg border bg-white text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] transition-all focus:outline-none disabled:bg-[var(--color-surface)] disabled:cursor-not-allowed';
    const border = this.invalid() || this.error()
      ? 'border-[var(--color-danger-500)] focus:ring-2 focus:ring-[var(--color-danger-500)]/30'
      : 'border-[var(--color-border-soft)] focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25';
    return `${base} ${border}`;
  });

  private onChange: (v: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
