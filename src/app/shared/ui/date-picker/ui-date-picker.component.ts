import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let datePickerCounter = 0;

interface CalendarDay {
  date: Date;
  label: number;
  iso: string;
  inCurrentMonth: boolean;
  disabled: boolean;
  isToday: boolean;
}

const WEEKDAYS = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromIso(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

@Component({
  selector: 'ui-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiDatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative">
      <button
        type="button"
        [attr.id]="id()"
        [disabled]="disabled()"
        [attr.aria-expanded]="open()"
        (click)="toggle()"
        class="h-11 w-full px-3 rounded-lg border border-[var(--color-border-soft)] bg-white text-[15px] text-left flex items-center justify-between gap-2 focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/25 disabled:bg-[var(--color-surface)] disabled:cursor-not-allowed"
      >
        <span [class]="displayValue() ? 'text-black' : 'text-[var(--color-ink-muted)]'">
          {{ displayValue() || 'dd/mm/aaaa' }}
        </span>
        <svg
          class="w-4 h-4 text-[var(--color-ink-muted)] shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      @if (open()) {
        <div
          class="fixed z-[100] max-w-[calc(100vw-1rem)] rounded-xl border border-[var(--color-border-soft)] bg-white p-2 shadow-2xl text-[var(--color-ink)]"
          [style.top.px]="panelPos().top"
          [style.left.px]="panelPos().left"
          [style.width.px]="panelPos().width"
        >
          <div class="flex items-center gap-0.5 mb-1">
            <button
              type="button"
              (click)="prevMonth()"
              class="w-6 h-6 shrink-0 flex items-center justify-center rounded-md hover:bg-[var(--color-surface)] text-[var(--color-ink-soft)]"
              aria-label="Mes anterior"
            >
              ‹
            </button>
            <div class="flex-1 flex items-center justify-center gap-0.5">
              <select
                [value]="viewMonth()"
                (change)="onMonthChange($event)"
                aria-label="Mes"
                class="text-[13px] font-semibold bg-transparent rounded px-0.5 py-0.5 hover:bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/25 cursor-pointer"
              >
                @for (m of months; track $index) {
                  <option [value]="$index">{{ m }}</option>
                }
              </select>
              <select
                [value]="viewYear()"
                (change)="onYearChange($event)"
                aria-label="Año"
                class="text-[13px] font-semibold bg-transparent rounded px-0.5 py-0.5 hover:bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/25 cursor-pointer"
              >
                @for (y of yearOptions(); track y) {
                  <option [value]="y">{{ y }}</option>
                }
              </select>
            </div>
            <button
              type="button"
              (click)="nextMonth()"
              class="w-6 h-6 shrink-0 flex items-center justify-center rounded-md hover:bg-[var(--color-surface)] text-[var(--color-ink-soft)]"
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>

          <div class="grid grid-cols-7 text-center text-[10px] font-semibold text-[var(--color-primary-700)] mb-0.5">
            @for (day of weekdays; track day) {
              <span>{{ day }}</span>
            }
          </div>

          <div class="grid grid-cols-7">
            @for (day of calendarDays(); track day.iso) {
              <button
                type="button"
                [disabled]="day.disabled"
                (click)="selectDay(day)"
                [class]="dayClasses(day)"
              >
                {{ day.label }}
              </button>
            }
          </div>

          <div class="flex items-center justify-between mt-1.5 pt-1.5 border-t border-[var(--color-border-soft)] text-[12px]">
            <button
              type="button"
              (click)="clear()"
              class="text-[var(--color-ink-muted)] hover:text-[var(--color-danger-500)]"
            >
              Borrar
            </button>
            <button
              type="button"
              (click)="selectToday()"
              class="text-[var(--color-primary-700)] font-medium hover:underline"
            >
              Hoy
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class UiDatePickerComponent implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly generatedId = `ui-date-picker-${++datePickerCounter}`;

  readonly id = input<string>(this.generatedId);
  readonly min = input<string>('');
  readonly max = input<string>('');

  protected readonly weekdays = WEEKDAYS;
  protected readonly months = MONTHS;
  protected readonly open = signal(false);
  protected readonly disabled = signal(false);
  protected readonly selectedIso = signal<string>('');
  protected readonly viewDate = signal<Date>(startOfDay(new Date()));
  protected readonly panelPos = signal<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 256,
  });

  protected readonly viewMonth = computed(() => this.viewDate().getMonth());
  protected readonly viewYear = computed(() => this.viewDate().getFullYear());

  protected readonly yearOptions = computed<number[]>(() => {
    const currentYear = new Date().getFullYear();
    const minYear = fromIso(this.min())?.getFullYear() ?? currentYear - 100;
    const maxYear = fromIso(this.max())?.getFullYear() ?? currentYear + 10;
    const years: number[] = [];
    for (let y = maxYear; y >= minYear; y--) years.push(y);
    return years;
  });

  protected readonly displayValue = computed(() => {
    const date = fromIso(this.selectedIso());
    if (!date) return '';
    const d = `${date.getDate()}`.padStart(2, '0');
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${d}/${m}/${date.getFullYear()}`;
  });

  protected readonly monthLabel = computed(() => {
    const v = this.viewDate();
    return `${MONTHS[v.getMonth()]} de ${v.getFullYear()}`;
  });

  protected readonly calendarDays = computed<CalendarDay[]>(() => {
    const view = this.viewDate();
    const year = view.getFullYear();
    const month = view.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);
    const today = startOfDay(new Date());
    const minDate = fromIso(this.min());
    const maxDate = fromIso(this.max());

    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      days.push({
        date,
        label: date.getDate(),
        iso: toIso(date),
        inCurrentMonth: date.getMonth() === month,
        disabled: (minDate ? date < minDate : false) || (maxDate ? date > maxDate : false),
        isToday: date.getTime() === today.getTime(),
      });
    }
    return days;
  });

  private onChange: (v: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
      this.onTouched();
    }
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onViewportChange(): void {
    if (this.open()) this.updatePosition();
  }

  /** Alto aproximado del panel compacto (cabecera + 6 semanas + pie). */
  private readonly PANEL_HEIGHT = 270;
  /** Ancho mínimo para que las 7 columnas se lean bien. */
  private readonly MIN_WIDTH = 240;

  private updatePosition(): void {
    const el = this.elementRef.nativeElement.querySelector('button');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 6;
    const margin = 8;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;

    // El panel toma el ancho del campo (con un mínimo legible).
    const width = Math.max(rect.width, this.MIN_WIDTH);

    let left = rect.left;
    if (left + width > vw - margin) {
      left = Math.max(margin, vw - width - margin);
    }

    // Debajo del campo por defecto; si no cabe, encima.
    let top = rect.bottom + gap;
    if (top + this.PANEL_HEIGHT > vh - margin && rect.top - gap - this.PANEL_HEIGHT >= margin) {
      top = rect.top - gap - this.PANEL_HEIGHT;
    }

    this.panelPos.set({ top, left, width });
  }

  toggle(): void {
    if (this.disabled()) return;
    this.open.update((v) => !v);
    if (this.open()) {
      const selected = fromIso(this.selectedIso());
      this.viewDate.set(selected ?? startOfDay(new Date()));
      this.updatePosition();
    }
  }

  prevMonth(): void {
    const v = this.viewDate();
    this.viewDate.set(new Date(v.getFullYear(), v.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const v = this.viewDate();
    this.viewDate.set(new Date(v.getFullYear(), v.getMonth() + 1, 1));
  }

  onMonthChange(event: Event): void {
    const month = Number((event.target as HTMLSelectElement).value);
    const v = this.viewDate();
    this.viewDate.set(new Date(v.getFullYear(), month, 1));
  }

  onYearChange(event: Event): void {
    const year = Number((event.target as HTMLSelectElement).value);
    const v = this.viewDate();
    this.viewDate.set(new Date(year, v.getMonth(), 1));
  }

  selectDay(day: CalendarDay): void {
    if (day.disabled) return;
    this.selectedIso.set(day.iso);
    this.onChange(day.iso);
    this.open.set(false);
    this.onTouched();
  }

  selectToday(): void {
    const today = startOfDay(new Date());
    this.viewDate.set(today);
    this.selectedIso.set(toIso(today));
    this.onChange(toIso(today));
    this.open.set(false);
    this.onTouched();
  }

  clear(): void {
    this.selectedIso.set('');
    this.onChange('');
    this.open.set(false);
    this.onTouched();
  }

  isSelected(day: CalendarDay): boolean {
    return day.iso === this.selectedIso();
  }

  dayClasses(day: CalendarDay): string {
    const base =
      'h-7 w-7 mx-auto flex items-center justify-center rounded-full text-[12px] transition-colors';
    if (day.disabled) {
      return `${base} text-[var(--color-ink-muted)] opacity-30 cursor-not-allowed`;
    }
    if (this.isSelected(day)) {
      return `${base} bg-[var(--color-primary-500)] text-white font-semibold`;
    }
    const tone = day.inCurrentMonth
      ? day.isToday
        ? 'text-[var(--color-primary-700)] font-semibold'
        : 'text-[var(--color-ink)]'
      : 'text-[var(--color-ink-muted)]';
    return `${base} ${tone} hover:bg-[var(--color-surface)]`;
  }

  writeValue(value: string | null): void {
    this.selectedIso.set(value ?? '');
    const parsed = fromIso(value ?? '');
    if (parsed) this.viewDate.set(parsed);
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
